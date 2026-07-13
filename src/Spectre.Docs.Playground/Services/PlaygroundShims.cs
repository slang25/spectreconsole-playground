namespace Spectre.Docs.Playground.Services;

/// <summary>
/// Runtime helpers injected into every user compilation. They are never called
/// by code the user writes literally — PlaygroundRewriter retargets the relevant
/// call sites here at emit time (see that class for the full list). The user
/// codes against the real Spectre.Console / BCL API; these helpers adapt the
/// blocking/threaded idioms to the single-threaded executor worker:
///
///  - Sleep pumps live-display refresh (spinners animate) and observes cancellation.
///  - RunProgress/RunStatus disable Spectre's thread-based auto-refresh (threads
///    can't start on this runtime) and pump ctx.Refresh() instead.
///  - Console I/O routes to the playground terminal.
///
/// The executor host assigns CancellationRequested / NativeSleep via reflection
/// after loading the user assembly (see ExecutionCore in the Executor project).
/// </summary>
public static class PlaygroundShims
{
    public const string Source =
        """
        // Injected by the playground: single-threaded execution helpers.
        // User code is retargeted to these at compile time; see PlaygroundRewriter.
        public static class PlaygroundRuntime
        {
            public static System.Func<bool>? CancellationRequested;
            public static System.Action<int>? NativeSleep;
            public static System.Action? RefreshPump;

            private static long _lastPump;

            public static void Sleep(int milliseconds)
            {
                ThrowIfCancelled();
                Pump();

                if (milliseconds <= 0)
                {
                    return;
                }

                var end = System.Environment.TickCount64 + milliseconds;
                while (true)
                {
                    var remaining = end - System.Environment.TickCount64;
                    if (remaining <= 0)
                    {
                        break;
                    }

                    var chunk = (int)System.Math.Min(remaining, 50);
                    if (NativeSleep != null)
                    {
                        NativeSleep(chunk);
                    }
                    else
                    {
                        System.Threading.Thread.Sleep(chunk);
                    }

                    ThrowIfCancelled();
                    Pump();
                }
            }

            public static void ThrowIfCancelled()
            {
                if (CancellationRequested?.Invoke() == true)
                {
                    throw new System.OperationCanceledException();
                }
            }

            private static void Pump()
            {
                var pump = RefreshPump;
                if (pump == null)
                {
                    return;
                }

                var now = System.Environment.TickCount64;
                if (now - _lastPump < 80)
                {
                    return;
                }

                _lastPump = now;
                try { pump(); } catch { }
            }

            public static System.IDisposable PushRefresh(System.Action refresh)
            {
                var previous = RefreshPump;
                RefreshPump = refresh;
                // Animates spinners while user code awaits (timers fire when the
                // single thread is idle); sleeps pump via Sleep() above.
                var timer = new System.Threading.Timer(_ => { try { refresh(); } catch { } }, null, 100, 100);
                return new RefreshScope(previous, timer);
            }

            private sealed class RefreshScope : System.IDisposable
            {
                private readonly System.Action? _previous;
                private readonly System.Threading.Timer _timer;

                public RefreshScope(System.Action? previous, System.Threading.Timer timer)
                {
                    _previous = previous;
                    _timer = timer;
                }

                public void Dispose()
                {
                    _timer.Dispose();
                    RefreshPump = _previous;
                }
            }

            // --- Progress/Status interception (thread-based auto-refresh → pumped) ---

            public static void RunProgress(Spectre.Console.Progress progress, System.Action<Spectre.Console.ProgressContext> action)
            {
                progress.AutoRefresh = false;
                progress.Start(ctx =>
                {
                    using (PushRefresh(ctx.Refresh))
                    {
                        action(ctx);
                    }
                });
            }

            public static T RunProgress<T>(Spectre.Console.Progress progress, System.Func<Spectre.Console.ProgressContext, T> func)
            {
                progress.AutoRefresh = false;
                return progress.Start(ctx =>
                {
                    using (PushRefresh(ctx.Refresh))
                    {
                        return func(ctx);
                    }
                });
            }

            public static async System.Threading.Tasks.Task RunProgressAsync(Spectre.Console.Progress progress, System.Func<Spectre.Console.ProgressContext, System.Threading.Tasks.Task> action)
            {
                progress.AutoRefresh = false;
                await progress.StartAsync(async ctx =>
                {
                    using (PushRefresh(ctx.Refresh))
                    {
                        await action(ctx);
                    }
                });
            }

            public static async System.Threading.Tasks.Task<T> RunProgressAsync<T>(Spectre.Console.Progress progress, System.Func<Spectre.Console.ProgressContext, System.Threading.Tasks.Task<T>> func)
            {
                progress.AutoRefresh = false;
                return await progress.StartAsync(async ctx =>
                {
                    using (PushRefresh(ctx.Refresh))
                    {
                        return await func(ctx);
                    }
                });
            }

            public static void RunStatus(Spectre.Console.Status status, string text, System.Action<Spectre.Console.StatusContext> action)
            {
                status.AutoRefresh = false;
                status.Start(text, ctx =>
                {
                    using (PushRefresh(ctx.Refresh))
                    {
                        action(ctx);
                    }
                });
            }

            public static T RunStatus<T>(Spectre.Console.Status status, string text, System.Func<Spectre.Console.StatusContext, T> func)
            {
                status.AutoRefresh = false;
                return status.Start(text, ctx =>
                {
                    using (PushRefresh(ctx.Refresh))
                    {
                        return func(ctx);
                    }
                });
            }

            public static async System.Threading.Tasks.Task RunStatusAsync(Spectre.Console.Status status, string text, System.Func<Spectre.Console.StatusContext, System.Threading.Tasks.Task> action)
            {
                status.AutoRefresh = false;
                await status.StartAsync(text, async ctx =>
                {
                    using (PushRefresh(ctx.Refresh))
                    {
                        await action(ctx);
                    }
                });
            }

            public static async System.Threading.Tasks.Task<T> RunStatusAsync<T>(Spectre.Console.Status status, string text, System.Func<Spectre.Console.StatusContext, System.Threading.Tasks.Task<T>> func)
            {
                status.AutoRefresh = false;
                return await status.StartAsync(text, async ctx =>
                {
                    using (PushRefresh(ctx.Refresh))
                    {
                        return await func(ctx);
                    }
                });
            }

            // --- System.Console redirection to the playground terminal ---

            private static System.IO.TextWriter Out => Spectre.Console.AnsiConsole.Console.Profile.Out.Writer;

            public static void ConsoleWrite(string? value) => Out.Write(value ?? string.Empty);
            public static void ConsoleWrite(object? value) => Out.Write(value?.ToString() ?? string.Empty);
            public static void ConsoleWrite(string format, params object?[] args) => Out.Write(string.Format(format, args));

            public static void ConsoleWriteLine() => Out.Write("\r\n");
            public static void ConsoleWriteLine(string? value) => Out.Write((value ?? string.Empty) + "\r\n");
            public static void ConsoleWriteLine(object? value) => Out.Write((value?.ToString() ?? string.Empty) + "\r\n");
            public static void ConsoleWriteLine(string format, params object?[] args) => Out.Write(string.Format(format, args) + "\r\n");

            public static bool ConsoleKeyAvailable => Spectre.Console.AnsiConsole.Console.Input.IsKeyAvailable();

            public static void ConsoleClear() => Spectre.Console.AnsiConsole.Console.Clear();

            public static System.ConsoleKeyInfo ReadKey(bool intercept = false)
            {
                var key = Spectre.Console.AnsiConsole.Console.Input.ReadKey(intercept)
                    ?? throw new System.OperationCanceledException();
                if (!intercept && key.KeyChar != '\0')
                {
                    Out.Write(key.KeyChar.ToString());
                }

                return key;
            }

            public static string? ReadLine()
            {
                var builder = new System.Text.StringBuilder();
                while (true)
                {
                    ThrowIfCancelled();
                    var key = Spectre.Console.AnsiConsole.Console.Input.ReadKey(true);
                    if (key == null)
                    {
                        return builder.ToString();
                    }

                    var k = key.Value;
                    if (k.Key == System.ConsoleKey.Enter)
                    {
                        Out.Write("\r\n");
                        return builder.ToString();
                    }

                    if (k.Key == System.ConsoleKey.Backspace)
                    {
                        if (builder.Length > 0)
                        {
                            builder.Length--;
                            Out.Write("\b \b");
                        }

                        continue;
                    }

                    if (k.KeyChar != '\0')
                    {
                        builder.Append(k.KeyChar);
                        Out.Write(k.KeyChar.ToString());
                    }
                }
            }
        }

        /// <summary>
        /// Playground stand-in for System.Threading.Thread (substituted at compile
        /// time). Sleep cooperates with live rendering and cancellation; started
        /// threads run their work synchronously — this runtime has one thread.
        /// </summary>
        public sealed class PlaygroundThread
        {
            private readonly System.Delegate _start;

            public PlaygroundThread(System.Threading.ThreadStart start) => _start = start;
            public PlaygroundThread(System.Threading.ParameterizedThreadStart start) => _start = start;

            public bool IsBackground { get; set; }
            public string? Name { get; set; }
            public bool IsAlive => false;

            public void Start()
            {
                if (_start is System.Threading.ThreadStart s) { s(); }
                else { ((System.Threading.ParameterizedThreadStart)_start)(null); }
            }

            public void Start(object? parameter)
            {
                if (_start is System.Threading.ParameterizedThreadStart p) { p(parameter); }
                else { ((System.Threading.ThreadStart)_start)(); }
            }

            public void Join() { }
            public bool Join(int millisecondsTimeout) => true;
            public bool Join(System.TimeSpan timeout) => true;

            public static void Sleep(int millisecondsTimeout) => PlaygroundRuntime.Sleep(millisecondsTimeout);
            public static void Sleep(System.TimeSpan timeout) => PlaygroundRuntime.Sleep((int)timeout.TotalMilliseconds);
            public static System.Threading.Thread CurrentThread => System.Threading.Thread.CurrentThread;
            public static bool Yield() => System.Threading.Thread.Yield();
            public static void SpinWait(int iterations) => System.Threading.Thread.SpinWait(iterations);
            public static void MemoryBarrier() => System.Threading.Interlocked.MemoryBarrier();
        }
        """;
}
