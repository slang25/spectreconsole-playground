using Microsoft.CodeAnalysis;

namespace Spectre.Docs.Playground.Services;

public class CompilationService
{
    private readonly WorkspaceService _workspaceService;

    public CompilationService(WorkspaceService workspaceService)
    {
        _workspaceService = workspaceService;
    }

    public async Task<CompilationResult> CompileAsync(string code)
    {
        await _workspaceService.EnsureInitializedAsync();

        var compilation = _workspaceService.CreateCompilation(code);

        // Diagnose the original tree so error positions match the editor buffer.
        var diagnostics = compilation.GetDiagnostics();
        if (diagnostics.Any(d => d.Severity == DiagnosticSeverity.Error))
        {
            return new CompilationResult
            {
                Success = false,
                Diagnostics = diagnostics.ToList()
            };
        }

        // Emit from the rewritten tree (single-threaded execution adaptations).
        var rewritten = PlaygroundRewriter.Rewrite(compilation);

        using var ms = new MemoryStream();
        var result = rewritten.Emit(ms);

        if (!result.Success)
        {
            // The original code was valid, so a failure here is a rewriter bug.
            // Fall back to the unrewritten code rather than blocking the user
            // (thread-dependent features degrade, everything else runs).
            var firstError = result.Diagnostics.FirstOrDefault(d => d.Severity == DiagnosticSeverity.Error);
            System.Console.Error.WriteLine($"[playground] Rewritten emit failed ({firstError}); falling back to unrewritten code.");

            ms.SetLength(0);
            result = compilation.Emit(ms);
            if (!result.Success)
            {
                return new CompilationResult
                {
                    Success = false,
                    Diagnostics = result.Diagnostics.ToList()
                };
            }
        }

        ms.Seek(0, SeekOrigin.Begin);
        var assembly = ms.ToArray();

        return new CompilationResult
        {
            Success = true,
            Assembly = assembly,
            Diagnostics = diagnostics.ToList()
        };
    }
}

public class CompilationResult
{
    public bool Success { get; set; }
    public byte[]? Assembly { get; set; }
    public List<Diagnostic> Diagnostics { get; set; } = [];
}
