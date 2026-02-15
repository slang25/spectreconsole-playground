namespace Spectre.Docs.Playground.Samples;

public static partial class Examples
{
    public static void TuiApp()
    {
        // <example name="TUI App (Spectre.Tui)">
        // Service Monitor - Built with Spectre.Tui
        // Low-level TUI rendering with Renderer and RenderContext

        var terminal = new BrowserTerminal(AnsiConsole.Console, AnsiConsole.Profile.Width, AnsiConsole.Profile.Height);
        var renderer = new Renderer(terminal);
        AnsiConsole.Profile.Out.Writer.Write("\x1b[?25l"); // Hide cursor

        // Styles
        var dim = new Style(Color.Grey);
        var normal = new Style(Color.White);
        var accent = new Style(Color.Cyan);
        var good = new Style(Color.Green);
        var warn = new Style(Color.Yellow);
        var bad = new Style(Color.Red);

        var random = new Random();
        var events = new Queue<(string time, string msg, Style style)>();
        var services = new[] {
            ("api-gateway", 99.8, 124),
            ("auth-service", 99.9, 45),
            ("user-db", 99.5, 230),
            ("cache-redis", 100.0, 2),
            ("queue-worker", 98.2, 890)
        };

        for (int tick = 0; tick < 100; tick++)
        {
            // Simulate events
            if (tick % 8 == 0)
            {
                var msgs = new[] {
                    ("Request handled", good), ("Cache miss", warn), ("Connection opened", normal),
                    ("Query executed", normal), ("Auth token refreshed", good), ("Rate limit hit", warn)
                };
                var (msg, style) = msgs[random.Next(msgs.Length)];
                events.Enqueue((DateTime.Now.ToString("HH:mm:ss"), msg, style));
                if (events.Count > 6) events.Dequeue();
            }

            renderer.Draw((RenderContext ctx, TimeSpan elapsed) =>
            {
                var size = terminal.GetSize();
                int w = size.Width, h = size.Height;

                // Header
                ctx.SetString(1, 0, "SERVICE MONITOR", accent, null);
                ctx.SetString(w - 9, 0, DateTime.Now.ToString("HH:mm:ss"), dim, null);

                // Services section
                ctx.SetString(1, 2, "Services", normal, null);
                ctx.SetString(1, 3, new string('─', w - 2), dim, null);

                int row = 4;
                foreach (var (name, uptime, latency) in services)
                {
                    var jitter = random.Next(-20, 21);
                    var currentLatency = Math.Max(1, latency + jitter);
                    var status = currentLatency < 100 ? good : currentLatency < 500 ? warn : bad;
                    var icon = currentLatency < 100 ? "●" : currentLatency < 500 ? "◐" : "○";

                    ctx.SetString(2, row, icon, status, null);
                    ctx.SetString(4, row, name.PadRight(14), normal, null);
                    ctx.SetString(19, row, $"{uptime:F1}%", uptime > 99 ? good : warn, null);
                    ctx.SetString(26, row, $"{currentLatency,4}ms", status, null);
                    row++;
                }

                // Events section
                ctx.SetString(1, row + 1, "Recent Events", normal, null);
                ctx.SetString(1, row + 2, new string('─', w - 2), dim, null);

                int eventRow = row + 3;
                foreach (var (time, msg, style) in events)
                {
                    if (eventRow < h - 1)
                    {
                        ctx.SetString(2, eventRow, time, dim, null);
                        ctx.SetString(11, eventRow, msg, style, w - 13);
                        eventRow++;
                    }
                }

                // Footer
                ctx.SetString(1, h - 1, $"Frame {tick + 1}/100", dim, null);
                ctx.SetString(w - 12, h - 1, $"{elapsed.TotalMilliseconds:F1}ms/frame", dim, null);
            });

            Thread.Sleep(50);
        }

        AnsiConsole.Profile.Out.Writer.Write("\x1b[?25h"); // Show cursor
        // </example>
    }
}
