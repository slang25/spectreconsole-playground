namespace Spectre.Docs.Playground.Samples;

public static partial class Examples
{
    public static void TuiShader()
    {
        // <example name="TUI Shader (Spectre.Tui)">
        // "Nothing Special" shader by Patrik Svensson
        // Ported from github.com/patriksvensson/range-challenge

        var terminal = new BrowserTerminal(
            AnsiConsole.Console,
            AnsiConsole.Profile.Width,
            AnsiConsole.Profile.Height);
        var renderer = new Renderer(terminal);
        var writer = AnsiConsole.Profile.Out.Writer;
        writer.Write("\x1b[?25l"); // Hide cursor

        var size = terminal.GetSize();
        int W = size.Width, H = size.Height;

        for (int frame = 0; frame < 60; frame++)
        {
            float time = frame * 0.05f;
            float halfW = W * 0.5f, halfH = H * 0.5f;

            renderer.Draw((RenderContext ctx, TimeSpan elapsed) =>
            {
                for (int y = 0; y < H; y++)
                {
                    for (int x = 0; x < W; x++)
                    {
                        // Ray direction (normalized)
                        float dx = x - halfW, dy = y - halfH, dz = (float)H;
                        float len = MathF.Sqrt(dx * dx + dy * dy + dz * dz);
                        dx /= len; dy /= len; dz /= len;

                        float z = 0f, d;
                        float ox = 0f, oy = 0f, oz = 0f;

                        for (int i = 0; i < 66; i++)
                        {
                            // March along ray
                            float px = z * dx;
                            float py = z * dy;
                            float pz = z * dz + time;
                            float sx = px, sy = py, sz = pz;

                            // Z-dependent domain rotation
                            float c0 = MathF.Cos(0.4f * pz);
                            float c1 = MathF.Cos(0.4f * pz + 11f);
                            float c2 = MathF.Cos(0.4f * pz + 33f);
                            float rx = c2 * py + c0 * px;
                            float ry = c1 * px + c0 * py;
                            px = rx; py = ry;

                            // Fold into repeating unit cells
                            px -= 0.5f; py -= 0.5f; pz -= 0.5f;
                            px -= MathF.Round(px);
                            py -= MathF.Round(py);
                            pz -= MathF.Round(pz);

                            // L8 norm SDF (approximates a rounded box)
                            float qx = px * px, qy = py * py, qz = pz * pz;
                            qx *= qx; qy *= qy; qz *= qz;
                            float l8 = MathF.Sqrt(MathF.Sqrt(MathF.Sqrt(
                                qx * qx + qy * qy + qz * qz)));
                            d = MathF.FusedMultiplyAdd(
                                0.6f, MathF.Abs(l8 - 0.3f), 1e-3f);
                            z += d;

                            // Accumulate color based on proximity
                            float v = MathF.FusedMultiplyAdd(
                                2f, MathF.Sqrt(sx * sx + sy * sy), 0.5f * sz);
                            float invD = 1f / d;
                            ox += invD * (1.1f + MathF.Sin(v + 2f));
                            oy += invD * (1.1f + MathF.Sin(v + 1f));
                            oz += invD * (1.1f + MathF.Sin(v));
                        }

                        // Tone map with tanh
                        ox *= 1e-4f; oy *= 1e-4f; oz *= 1e-4f;
                        var color = new Color(
                            (byte)(MathF.Tanh(ox) * 255),
                            (byte)(MathF.Tanh(oy) * 255),
                            (byte)(MathF.Tanh(oz) * 255));
                        ctx.SetString(x, y, " ",
                            new Style(null, color), null);
                    }
                }
            });

            Thread.Sleep(50);
        }

        writer.Write("\x1b[?25h"); // Show cursor
        // </example>
    }
}
