using Spectre.Console;
using Spectre.Tui;

namespace Spectre.Docs.Playground.Services;

/// <summary>
/// ITerminal implementation for browser/WASM environments.
/// Wraps the playground's terminal infrastructure to enable Spectre.Tui rendering.
/// </summary>
public class BrowserTerminal : ITerminal
{
    private readonly IAnsiConsole _console;
    private readonly int _width;
    private readonly int _height;

    public BrowserTerminal(IAnsiConsole console, int width, int height)
    {
        _console = console;
        _width = width;
        _height = height;
    }

    public void Clear()
    {
        // Send ANSI clear screen and home cursor
        _console.Profile.Out.Writer.Write("\x1b[2J\x1b[H");
    }

    public Spectre.Tui.Size GetSize()
    {
        return new Spectre.Tui.Size(_width, _height);
    }

    public void MoveTo(int x, int y)
    {
        // ANSI cursor positioning (1-based)
        _console.Profile.Out.Writer.Write($"\x1b[{y + 1};{x + 1}H");
    }

    public void Write(Cell cell)
    {
        var writer = _console.Profile.Out.Writer;

        // Build style escape sequence
        var codes = new List<int>();

        // Reset first
        codes.Add(0);

        // Foreground color
        if (cell.Foreground != Color.Default)
        {
            var (r, g, b) = (cell.Foreground.R, cell.Foreground.G, cell.Foreground.B);
            codes.Add(38);
            codes.Add(2);
            codes.Add(r);
            codes.Add(g);
            codes.Add(b);
        }

        // Background color
        if (cell.Background != Color.Default)
        {
            var (r, g, b) = (cell.Background.R, cell.Background.G, cell.Background.B);
            codes.Add(48);
            codes.Add(2);
            codes.Add(r);
            codes.Add(g);
            codes.Add(b);
        }

        // Decorations
        if ((cell.Decoration & Decoration.Bold) != 0) codes.Add(1);
        if ((cell.Decoration & Decoration.Dim) != 0) codes.Add(2);
        if ((cell.Decoration & Decoration.Italic) != 0) codes.Add(3);
        if ((cell.Decoration & Decoration.Underline) != 0) codes.Add(4);
        if ((cell.Decoration & Decoration.SlowBlink) != 0) codes.Add(5);
        if ((cell.Decoration & Decoration.RapidBlink) != 0) codes.Add(6);
        if ((cell.Decoration & Decoration.Invert) != 0) codes.Add(7);
        if ((cell.Decoration & Decoration.Strikethrough) != 0) codes.Add(9);

        writer.Write($"\x1b[{string.Join(";", codes)}m");
        writer.Write(cell.Symbol ?? " ");
        writer.Write("\x1b[0m");
    }

    public void Flush()
    {
        _console.Profile.Out.Writer.Flush();
    }

    public void Dispose()
    {
        // Nothing to dispose in browser environment
    }
}
