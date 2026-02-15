namespace Spectre.Docs.Playground.Samples;

public static partial class Examples
{
    public static void TreeView()
    {
        // <example name="Tree View">
        // Create a tree structure
        var root = new Tree("[yellow]Solution[/]");

        var src = root.AddNode("[blue]src[/]");
        var project = src.AddNode("[green]MyProject[/]");
        project.AddNode("Program.cs");
        project.AddNode("Startup.cs");
        project.AddNode("appsettings.json");

        var tests = root.AddNode("[blue]tests[/]");
        var testProject = tests.AddNode("[green]MyProject.Tests[/]");
        testProject.AddNode("UnitTests.cs");
        testProject.AddNode("IntegrationTests.cs");

        root.AddNode("README.md");
        root.AddNode(".gitignore");

        AnsiConsole.Write(root);
        // </example>
    }
}
