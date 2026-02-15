using System.Reflection;
using System.Text.RegularExpressions;

namespace Spectre.Docs.Playground.Services;

public static partial class SampleLoader
{
    public static Dictionary<string, string> LoadExamples()
    {
        var assembly = Assembly.GetExecutingAssembly();
        var examples = new Dictionary<string, string>();

        foreach (var resourceName in assembly.GetManifestResourceNames())
        {
            if (!resourceName.StartsWith("Sample."))
                continue;

            using var stream = assembly.GetManifestResourceStream(resourceName);
            if (stream == null)
                continue;

            using var reader = new StreamReader(stream);
            var content = reader.ReadToEnd();

            var match = ExampleMarker().Match(content);
            if (!match.Success)
                continue;

            var name = match.Groups[1].Value;
            var body = match.Groups[2].Value;

            // Strip common leading indentation
            examples[name] = StripIndentation(body);
        }

        return examples;
    }

    private static string StripIndentation(string text)
    {
        var lines = text.Split('\n');

        // Skip leading/trailing empty lines
        int start = 0, end = lines.Length - 1;
        while (start <= end && string.IsNullOrWhiteSpace(lines[start])) start++;
        while (end >= start && string.IsNullOrWhiteSpace(lines[end])) end--;

        if (start > end)
            return string.Empty;

        // Find minimum indentation of non-empty lines
        int minIndent = int.MaxValue;
        for (int i = start; i <= end; i++)
        {
            if (string.IsNullOrWhiteSpace(lines[i]))
                continue;

            int indent = 0;
            foreach (var ch in lines[i])
            {
                if (ch == ' ') indent++;
                else break;
            }
            minIndent = Math.Min(minIndent, indent);
        }

        if (minIndent == int.MaxValue)
            minIndent = 0;

        // Strip common indentation
        var result = new List<string>();
        for (int i = start; i <= end; i++)
        {
            if (string.IsNullOrWhiteSpace(lines[i]))
                result.Add(string.Empty);
            else
                result.Add(lines[i].Length > minIndent ? lines[i][minIndent..] : lines[i].TrimStart());
        }

        return string.Join("\n", result);
    }

    [GeneratedRegex(@"// <example name=""(.+?)"">\s*\n([\s\S]*?)\n\s*// </example>")]
    private static partial Regex ExampleMarker();
}
