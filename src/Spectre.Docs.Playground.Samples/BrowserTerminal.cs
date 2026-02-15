namespace Spectre.Docs.Playground.Samples;

/// <summary>
/// Browser-compatible ITerminal implementation for Spectre.Tui.
/// Enables TUI rendering in WASM by bridging to AnsiConsole output.
/// </summary>
public class BrowserTerminal : ITerminal
{
    private readonly IAnsiConsole _console;
    private readonly int _width, _height;

    public BrowserTerminal(IAnsiConsole console, int width, int height)
    {
        _console = console;
        _width = width;
        _height = height;
    }

    public void Clear() => _console.Profile.Out.Writer.Write("\x1b[2J\x1b[H");
    public Spectre.Tui.Size GetSize() => new(_width, _height);
    public void MoveTo(int x, int y) => _console.Profile.Out.Writer.Write($"\x1b[{y + 1};{x + 1}H");

    public void Write(Cell cell)
    {
        var w = _console.Profile.Out.Writer;
        var codes = new List<int> { 0 };
        if (cell.Foreground != Color.Default)
            codes.AddRange(new[] { 38, 2, cell.Foreground.R, cell.Foreground.G, cell.Foreground.B });
        if (cell.Background != Color.Default)
            codes.AddRange(new[] { 48, 2, cell.Background.R, cell.Background.G, cell.Background.B });
        if ((cell.Decoration & Decoration.Bold) != 0) codes.Add(1);
        if ((cell.Decoration & Decoration.Italic) != 0) codes.Add(3);
        if ((cell.Decoration & Decoration.Underline) != 0) codes.Add(4);
        w.Write($"\x1b[{string.Join(";", codes)}m{cell.Symbol ?? " "}\x1b[0m");
    }

    public void Flush() => _console.Profile.Out.Writer.Flush();
    public void Dispose() { }
}
