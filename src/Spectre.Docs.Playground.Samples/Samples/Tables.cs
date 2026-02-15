namespace Spectre.Docs.Playground.Samples;

public static partial class Examples
{
    public static void Tables()
    {
        // <example name="Tables">
        // Create a simple table
        var table = new Table();
        table.Border(TableBorder.Rounded);

        // Add columns
        table.AddColumn("[cyan]Name[/]");
        table.AddColumn("[cyan]Age[/]");
        table.AddColumn("[cyan]City[/]");

        // Add rows
        table.AddRow("Alice", "30", "New York");
        table.AddRow("Bob", "25", "Los Angeles");
        table.AddRow("Charlie", "35", "Chicago");

        AnsiConsole.Write(table);
        // </example>
    }
}
