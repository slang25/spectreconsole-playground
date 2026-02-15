namespace Spectre.Docs.Playground.Samples;

public static partial class Examples
{
    public static void Emojis()
    {
        // <example name="Emojis">
        // Display emojis using the Emoji class
        AnsiConsole.MarkupLine($"Hello {Emoji.Known.WavingHand}");
        AnsiConsole.MarkupLine($"Great job! {Emoji.Known.ThumbsUp} {Emoji.Known.PartyPopper}");
        AnsiConsole.WriteLine();

        // Common emojis in a table
        var table = new Table().Border(TableBorder.Rounded);
        table.AddColumn("[cyan]Emoji[/]");
        table.AddColumn("[cyan]Code[/]");

        table.AddRow($"{Emoji.Known.CheckMarkButton}", "Emoji.Known.CheckMarkButton");
        table.AddRow($"{Emoji.Known.CrossMark}", "Emoji.Known.CrossMark");
        table.AddRow($"{Emoji.Known.Star}", "Emoji.Known.Star");
        table.AddRow($"{Emoji.Known.Fire}", "Emoji.Known.Fire");
        table.AddRow($"{Emoji.Known.Rocket}", "Emoji.Known.Rocket");
        table.AddRow($"{Emoji.Known.GreenCircle}", "Emoji.Known.GreenCircle");
        table.AddRow($"{Emoji.Known.RedCircle}", "Emoji.Known.RedCircle");
        table.AddRow($"{Emoji.Known.Warning}", "Emoji.Known.Warning");

        AnsiConsole.Write(table);
        AnsiConsole.WriteLine();

        // Emojis in markup
        AnsiConsole.MarkupLine($"[green]Success![/] {Emoji.Known.CheckMarkButton}");
        AnsiConsole.MarkupLine($"[red]Error![/] {Emoji.Known.CrossMark}");
        AnsiConsole.MarkupLine($"[yellow]Warning![/] {Emoji.Known.Warning}");
        // </example>
    }
}
