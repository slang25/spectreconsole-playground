using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace Spectre.Docs.Playground.Services;

/// <summary>
/// Compile-time rewriter that adapts user code for single-threaded execution on
/// the executor worker. Works on the bound semantic model, so it catches every
/// spelling of a call (unqualified, fully-qualified, aliased) while leaving the
/// editor experience — diagnostics, hovers, completions — on the real, untouched
/// API. Rewrites:
///
///  - System.Threading.Thread (type)      → PlaygroundThread surrogate: Sleep pumps
///    live-display refresh and observes cancellation; started threads run inline.
///  - Progress.Start/StartAsync           → PlaygroundRuntime.RunProgress[Async],
///  - Status.Start/StartAsync             → PlaygroundRuntime.RunStatus[Async],
///    which disable the thread-based auto-refresh and pump refresh instead.
///  - System.Console Write/WriteLine/ReadLine/ReadKey/KeyAvailable/Clear → the
///    playground terminal (they'd otherwise go to the browser console or throw).
///
/// The rewrite runs only at emit time; diagnostics are produced from the original
/// compilation so error positions always match the editor buffer.
/// </summary>
public static class PlaygroundRewriter
{
    public const string UserDocumentPath = "Program.cs";

    public static CSharpCompilation Rewrite(CSharpCompilation compilation)
    {
        var userTree = compilation.SyntaxTrees.FirstOrDefault(t => t.FilePath == UserDocumentPath);
        if (userTree == null)
        {
            return compilation;
        }

        var model = compilation.GetSemanticModel(userTree);
        var newRoot = new Rewriter(model).Visit(userTree.GetRoot());
        var newTree = userTree.WithRootAndOptions(newRoot, userTree.Options);
        return (CSharpCompilation)compilation.ReplaceSyntaxTree(userTree, newTree);
    }

    private sealed class Rewriter : CSharpSyntaxRewriter
    {
        private const string ThreadTypeName = "System.Threading.Thread";
        private const string ConsoleTypeName = "System.Console";
        private const string ProgressTypeName = "Spectre.Console.Progress";
        private const string StatusTypeName = "Spectre.Console.Status";

        private readonly SemanticModel _model;

        public Rewriter(SemanticModel model)
        {
            _model = model;
        }

        // --- Thread type substitution -----------------------------------------

        public override SyntaxNode? VisitIdentifierName(IdentifierNameSyntax node)
        {
            // `var` binds to the inferred type symbol — never substitute it.
            if (!node.IsVar && !IsMemberNamePosition(node) && BindsToType(node, ThreadTypeName))
            {
                return ThreadReplacement(node);
            }

            return base.VisitIdentifierName(node);
        }

        public override SyntaxNode? VisitQualifiedName(QualifiedNameSyntax node)
        {
            // Type contexts: System.Threading.Thread, Threading.Thread, ...
            if (BindsToType(node, ThreadTypeName))
            {
                return ThreadReplacement(node);
            }

            return base.VisitQualifiedName(node);
        }

        public override SyntaxNode? VisitMemberAccessExpression(MemberAccessExpressionSyntax node)
        {
            // Expression contexts: the `System.Threading.Thread` receiver in
            // `System.Threading.Thread.Sleep(...)` parses as member accesses.
            if (BindsToType(node, ThreadTypeName))
            {
                return ThreadReplacement(node);
            }

            // Console.KeyAvailable → terminal-backed check
            if (_model.GetSymbolInfo(node).Symbol is IPropertySymbol prop
                && prop.Name == "KeyAvailable"
                && prop.ContainingType?.ToDisplayString() == ConsoleTypeName)
            {
                return SyntaxFactory.ParseExpression("global::PlaygroundRuntime.ConsoleKeyAvailable")
                    .WithTriviaFrom(node);
            }

            return base.VisitMemberAccessExpression(node);
        }

        // --- Invocation interception -------------------------------------------

        public override SyntaxNode? VisitInvocationExpression(InvocationExpressionSyntax node)
        {
            var method = _model.GetSymbolInfo(node).Symbol as IMethodSymbol;
            var visited = (InvocationExpressionSyntax)base.VisitInvocationExpression(node)!;
            if (method == null)
            {
                return visited;
            }

            var containingType = method.ContainingType?.ToDisplayString();

            if (containingType == ProgressTypeName
                && method.Name is "Start" or "StartAsync"
                && visited.Expression is MemberAccessExpressionSyntax progressAccess)
            {
                var helper = method.Name == "Start" ? "RunProgress" : "RunProgressAsync";
                return ToReceiverHelper(visited, progressAccess, helper);
            }

            if (containingType == StatusTypeName
                && method.Name is "Start" or "StartAsync"
                && visited.Expression is MemberAccessExpressionSyntax statusAccess)
            {
                var helper = method.Name == "Start" ? "RunStatus" : "RunStatusAsync";
                return ToReceiverHelper(visited, statusAccess, helper);
            }

            if (containingType == ConsoleTypeName && TryMapConsoleMethod(method, out var consoleHelper))
            {
                var callee = SyntaxFactory.ParseExpression("global::PlaygroundRuntime." + consoleHelper);
                return visited.WithExpression(callee.WithTriviaFrom(visited.Expression));
            }

            return visited;
        }

        /// <summary>
        /// receiver.Start(args) → global::PlaygroundRuntime.Helper(receiver, args)
        /// </summary>
        private static InvocationExpressionSyntax ToReceiverHelper(
            InvocationExpressionSyntax visited,
            MemberAccessExpressionSyntax receiverAccess,
            string helperName)
        {
            var receiverArgument = SyntaxFactory.Argument(receiverAccess.Expression.WithoutTrivia());
            var arguments = SyntaxFactory.SeparatedList(
                new[] { receiverArgument }.Concat(visited.ArgumentList.Arguments));
            var callee = SyntaxFactory.ParseExpression("global::PlaygroundRuntime." + helperName);

            return SyntaxFactory.InvocationExpression(callee, SyntaxFactory.ArgumentList(arguments))
                .WithTriviaFrom(visited);
        }

        /// <summary>
        /// Map a bound System.Console method to a PlaygroundRuntime helper, only
        /// when the helper set is known to cover that exact overload — unsupported
        /// overloads keep their original (browser console) behavior rather than
        /// risking a compile error in the rewritten tree.
        /// </summary>
        private static bool TryMapConsoleMethod(IMethodSymbol method, out string helper)
        {
            helper = string.Empty;

            switch (method.Name)
            {
                case "ReadLine" when method.Parameters.Length == 0:
                    helper = "ReadLine";
                    return true;

                case "ReadKey" when method.Parameters.Length <= 1:
                    helper = "ReadKey";
                    return true;

                case "Clear" when method.Parameters.Length == 0:
                    helper = "ConsoleClear";
                    return true;

                case "Write" or "WriteLine":
                    if (method.Parameters.Length == 0)
                    {
                        helper = "ConsoleWriteLine"; // only WriteLine() exists
                        return method.Name == "WriteLine";
                    }

                    // Format overloads: (string, object...) or (string, params object[])
                    if (method.Parameters.Length >= 2)
                    {
                        if (method.Parameters[0].Type.SpecialType == SpecialType.System_String
                            && method.Parameters.Skip(1).All(p =>
                                p.Type.SpecialType == SpecialType.System_Object
                                || p.Type is IArrayTypeSymbol { ElementType.SpecialType: SpecialType.System_Object }))
                        {
                            helper = method.Name == "Write" ? "ConsoleWrite" : "ConsoleWriteLine";
                            return true;
                        }

                        return false;
                    }

                    // Single-argument overloads for simple values
                    var t = method.Parameters[0].Type.SpecialType;
                    if (t is SpecialType.System_String or SpecialType.System_Object or SpecialType.System_Boolean
                        or SpecialType.System_Char or SpecialType.System_Decimal or SpecialType.System_Double
                        or SpecialType.System_Single or SpecialType.System_Int32 or SpecialType.System_UInt32
                        or SpecialType.System_Int64 or SpecialType.System_UInt64)
                    {
                        helper = method.Name == "Write" ? "ConsoleWrite" : "ConsoleWriteLine";
                        return true;
                    }

                    return false;

                default:
                    return false;
            }
        }

        private bool BindsToType(SyntaxNode node, string fullTypeName)
        {
            return _model.GetSymbolInfo(node).Symbol is INamedTypeSymbol type
                && type.ToDisplayString() == fullTypeName;
        }

        private static SyntaxNode ThreadReplacement(SyntaxNode node)
        {
            return SyntaxFactory.ParseName("global::PlaygroundThread").WithTriviaFrom(node);
        }

        /// <summary>
        /// True when the identifier is the member-name part of a dotted expression
        /// (e.g. the `Thread` in `Something.Thread`) — the enclosing node handles those.
        /// </summary>
        private static bool IsMemberNamePosition(IdentifierNameSyntax node)
        {
            return (node.Parent is MemberAccessExpressionSyntax member && member.Name == node)
                || (node.Parent is QualifiedNameSyntax qualified && qualified.Right == node)
                || (node.Parent is AliasQualifiedNameSyntax alias && alias.Name == node)
                || node.Parent is MemberBindingExpressionSyntax;
        }
    }
}
