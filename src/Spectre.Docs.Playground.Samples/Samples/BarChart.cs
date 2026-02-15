namespace Spectre.Docs.Playground.Samples;

public static partial class Examples
{
    public static void BarChart()
    {
        // <example name="Bar Chart">
        // Create a bar chart
        AnsiConsole.Write(new BarChart()
            .Width(60)
            .Label("[green bold underline]Programming Languages[/]")
            .CenterLabel()
            .AddItem("C#", 85, Color.Green)
            .AddItem("Python", 78, Color.Blue)
            .AddItem("JavaScript", 72, Color.Yellow)
            .AddItem("Rust", 45, Color.Red)
            .AddItem("Go", 52, Color.Cyan1));
        // </example>
    }
}
