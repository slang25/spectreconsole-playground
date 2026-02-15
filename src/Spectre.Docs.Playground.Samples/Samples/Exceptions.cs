namespace Spectre.Docs.Playground.Samples;

public static partial class Examples
{
    public static void Exceptions()
    {
        // <example name="Exceptions">
        // Pretty print exceptions
        try
        {
            DoSomething();
        }
        catch (Exception ex)
        {
            AnsiConsole.WriteException(ex,
                ExceptionFormats.ShortenPaths |
                ExceptionFormats.ShortenTypes |
                ExceptionFormats.ShortenMethods);
        }

        void DoSomething()
        {
            DoSomethingElse();
        }

        void DoSomethingElse()
        {
            throw new InvalidOperationException("Something went wrong!");
        }
        // </example>
    }
}
