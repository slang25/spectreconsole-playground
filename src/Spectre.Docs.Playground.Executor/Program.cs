namespace Spectre.Docs.Playground.Executor;

public static class Program
{
    // The worker boots this runtime via dotnet.create() and drives it through
    // the ExecutorHost JSExports, so Main never runs.
    public static void Main()
    {
    }
}
