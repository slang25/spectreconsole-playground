namespace Spectre.Docs.Playground.Samples;

public static partial class Examples
{
    public static void Panels()
    {
        // <example name="Panels">
        // Create styled panels
        var panel = new Panel(
            Align.Center(
                new Markup("[blue]Hello[/] from [red]Spectre.Console[/]!"),
                VerticalAlignment.Middle))
            .Header("[yellow]Welcome[/]")
            .Border(BoxBorder.Rounded)
            .BorderStyle(Style.Parse("cyan"))
            .Padding(2, 1);

        AnsiConsole.Write(panel);

        AnsiConsole.WriteLine();

        // Nested panels
        var inner = new Panel("This is the [green]inner[/] panel")
            .Header("Inner")
            .Border(BoxBorder.Double);

        var outer = new Panel(inner)
            .Header("Outer")
            .Border(BoxBorder.Rounded)
            .Padding(1, 1);

        AnsiConsole.Write(outer);
        // </example>
    }
}
