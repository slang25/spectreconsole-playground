namespace Spectre.Docs.Playground.Samples;

public static partial class Examples
{
    public static void Spinners()
    {
        // <example name="Spinners">
        // Show a spinner while doing work
        AnsiConsole.Status()
            .Spinner(Spinner.Known.Dots)
            .Start("Processing...", ctx =>
            {
                Thread.Sleep(1000);
                ctx.Status("Loading data...");
                ctx.Spinner(Spinner.Known.Star);
                Thread.Sleep(1000);
                ctx.Status("Almost done...");
                ctx.Spinner(Spinner.Known.Bounce);
                Thread.Sleep(1000);
            });

        AnsiConsole.MarkupLine("[green]Done![/]");
        AnsiConsole.WriteLine();

        // Show different spinner styles
        var spinners = new[] { "Dots", "Star", "Bounce", "Clock", "Earth", "Hearts" };
        var table = new Table().Border(TableBorder.Rounded);
        table.AddColumn("Spinner Name");
        table.AddColumn("Description");

        foreach (var name in spinners)
        {
            table.AddRow($"[cyan]{name}[/]", $"Spinner.Known.{name}");
        }

        AnsiConsole.Write(table);
        // </example>
    }
}
