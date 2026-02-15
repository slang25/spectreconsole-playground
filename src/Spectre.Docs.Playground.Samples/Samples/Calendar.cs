namespace Spectre.Docs.Playground.Samples;

public static partial class Examples
{
    public static void Calendar()
    {
        // <example name="Calendar">
        // Display a calendar
        var calendar = new Calendar(2025, 1)
            .AddCalendarEvent(2025, 1, 1)   // New Year's Day
            .AddCalendarEvent(2025, 1, 20)  // MLK Day
            .HighlightStyle(Style.Parse("yellow bold"))
            .HeaderStyle(Style.Parse("blue"));

        AnsiConsole.Write(calendar);

        AnsiConsole.WriteLine();

        // Show current date info
        var today = DateTime.Now;
        AnsiConsole.MarkupLine($"[grey]Today is[/] [green]{today:dddd, MMMM d, yyyy}[/]");
        // </example>
    }
}
