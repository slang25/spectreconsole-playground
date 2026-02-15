namespace Spectre.Docs.Playground.Samples;

public static partial class Examples
{
    public static void PromptSelection()
    {
        // <example name="Prompt Selection">
        // Single selection
        var fruit = AnsiConsole.Prompt(
            new SelectionPrompt<string>()
                .Title("What's your [green]favorite fruit[/]?")
                .PageSize(5)
                .AddChoices(new[] {
                    "Apple", "Banana", "Orange",
                    "Mango", "Strawberry", "Grape"
                }));

        AnsiConsole.MarkupLine($"You selected: [yellow]{fruit}[/]");

        AnsiConsole.WriteLine();

        // Multi selection
        var toppings = AnsiConsole.Prompt(
            new MultiSelectionPrompt<string>()
                .Title("Select your [green]pizza toppings[/]:")
                .NotRequired()
                .PageSize(5)
                .InstructionsText("[grey](Press [blue]<space>[/] to toggle, [green]<enter>[/] to accept)[/]")
                .AddChoices(new[] {
                    "Pepperoni", "Mushrooms", "Olives",
                    "Onions", "Bacon", "Extra Cheese"
                }));

        AnsiConsole.MarkupLine($"Toppings: [cyan]{string.Join(", ", toppings)}[/]");
        // </example>
    }
}
