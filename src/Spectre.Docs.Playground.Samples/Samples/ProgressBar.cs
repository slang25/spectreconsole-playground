namespace Spectre.Docs.Playground.Samples;

public static partial class Examples
{
    public static void ProgressBar()
    {
        // <example name="Progress Bar">
        // Simulate a download with progress
        AnsiConsole.Progress()
            .Start(ctx =>
            {
                var task = ctx.AddTask("[green]Downloading files[/]");

                while (!ctx.IsFinished)
                {
                    task.Increment(3.5);
                    Thread.Sleep(50);
                }
            });

        AnsiConsole.MarkupLine("[green]Download complete![/]");
        // </example>
    }
}
