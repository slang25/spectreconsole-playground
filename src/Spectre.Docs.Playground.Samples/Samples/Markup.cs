namespace Spectre.Docs.Playground.Samples;

public static partial class Examples
{
    public static void MarkupExample()
    {
        // <example name="Markup">
        // Basic colors
        AnsiConsole.MarkupLine("[red]Red[/] [green]Green[/] [blue]Blue[/] [yellow]Yellow[/]");
        AnsiConsole.WriteLine();

        // Styles
        AnsiConsole.MarkupLine("[bold]Bold[/] [italic]Italic[/] [underline]Underline[/] [strikethrough]Strikethrough[/]");
        AnsiConsole.WriteLine();

        // Combined styles
        AnsiConsole.MarkupLine("[bold red]Bold Red[/] [italic blue]Italic Blue[/] [underline green]Underline Green[/]");
        AnsiConsole.WriteLine();

        // Background colors
        AnsiConsole.MarkupLine("[white on blue] White on Blue [/] [black on yellow] Black on Yellow [/]");
        AnsiConsole.WriteLine();

        // Links (shown as underlined in terminal)
        AnsiConsole.MarkupLine("[link=https://spectreconsole.net]Visit Spectre.Console[/]");
        AnsiConsole.WriteLine();

        // RGB and hex colors
        AnsiConsole.MarkupLine("[rgb(255,165,0)]Orange (RGB)[/] [#FF69B4]Hot Pink (Hex)[/]");
        AnsiConsole.WriteLine();

        // Escaping brackets
        AnsiConsole.MarkupLine("Use [[double brackets]] to escape markup");
        // </example>
    }
}
