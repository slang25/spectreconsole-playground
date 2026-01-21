# StuDev.Spectre.Console.Playground.Utilities

A .NET library for generating shareable URLs for the [Spectre.Console Playground](https://playground.spectreconsole.net/).

## Installation

```bash
dotnet add package StuDev.Spectre.Console.Playground.Utilities
```

## Usage

```csharp
using StuDev.Spectre.Console.Playground.Utilities;

var playground = new PlaygroundUrl(new Uri("https://playground.spectreconsole.net/"));

// Create a URL with code that runs automatically
var url = playground.Create(
    """
    AnsiConsole.MarkupLine("[bold green]Hello, World![/]");
    """,
    runImmediately: true
);

Console.WriteLine(url);
// Output: https://playground.spectreconsole.net/#eJw...
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
