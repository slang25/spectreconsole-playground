namespace Spectre.Docs.Playground.Samples;

public static partial class Examples
{
    public static void LiveDisplay()
    {
        // <example name="Live Display">
        // Live updating display
        var table = new Table().Border(TableBorder.Rounded);
        table.AddColumn("Time");
        table.AddColumn("Status");

        AnsiConsole.Live(table)
            .Start(ctx =>
            {
                for (int i = 1; i <= 5; i++)
                {
                    table.AddRow(
                        DateTime.Now.ToString("HH:mm:ss"),
                        $"[green]Step {i} complete[/]");
                    ctx.Refresh();
                    Thread.Sleep(500);
                }
            });

        AnsiConsole.MarkupLine("[yellow]All steps completed![/]");
        // </example>
    }
}
