# StuDev.Spectre.Console.Playground.Utilities

A .NET library for generating shareable URLs for the [Spectre.Console Playground](https://spectreconsole-playground.pages.dev/).

## Installation

```bash
dotnet add package StuDev.Spectre.Console.Playground.Utilities
```

## Usage

```csharp
using StuDev.Spectre.Console.Playground.Utilities;

var playground = new PlaygroundUrl(new Uri("https://spectreconsole-playground.pages.dev/"));

// Create a URL with code that runs automatically
var url = playground.Create(
    """
    AnsiConsole.MarkupLine("[bold green]Hello, World![/]");
    """,
    runImmediately: true
);

Console.WriteLine(url);
// Output: https://spectreconsole-playground.pages.dev/#eJw...
```

## API

### `PlaygroundUrl`

#### Constructor

- `PlaygroundUrl(Uri baseUrl)` - Creates a new instance with the specified playground base URL.

#### Methods

- `string Create(string code, bool runImmediately)` - Creates a full playground URL with the given code.
  - `code`: The C# code to include in the URL.
  - `runImmediately`: Whether the code should run automatically when the URL is opened.

## License

MIT
