namespace Spectre.Docs.Playground.Samples;

public static partial class Examples
{
    public static void Canvas()
    {
        // <example name="Canvas">
        // Draw on a canvas
        var canvas = new Canvas(16, 16);

        // Draw a simple pattern
        for (int i = 0; i < 16; i++)
        {
            canvas.SetPixel(i, 0, Color.Red);
            canvas.SetPixel(i, 15, Color.Red);
            canvas.SetPixel(0, i, Color.Blue);
            canvas.SetPixel(15, i, Color.Blue);
        }

        // Draw diagonals
        for (int i = 0; i < 16; i++)
        {
            canvas.SetPixel(i, i, Color.Green);
            canvas.SetPixel(15 - i, i, Color.Yellow);
        }

        AnsiConsole.Write(canvas);
        // </example>
    }
}
