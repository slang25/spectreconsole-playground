using System.Buffers.Text;
using System.IO.Compression;
using Google.Protobuf;

namespace StuDev.Spectre.Console.Playground.Utilities;

/// <summary>
/// Provides methods for creating Spectre.Console Playground URLs.
/// </summary>
public sealed class PlaygroundUrl
{
    private readonly Uri _baseUrl;

    /// <summary>
    /// Initializes a new instance of the <see cref="PlaygroundUrl"/> class.
    /// </summary>
    /// <param name="baseUrl">The base URL of the playground (e.g., "https://playground.spectreconsole.net/").</param>
    public PlaygroundUrl(Uri baseUrl)
    {
        ArgumentNullException.ThrowIfNull(baseUrl);
        _baseUrl = baseUrl;
    }

    /// <summary>
    /// Creates a full playground URL with the given code.
    /// </summary>
    /// <param name="code">The C# code to include in the URL.</param>
    /// <param name="runImmediately">Whether the code should run automatically when the URL is opened.</param>
    /// <returns>A URL that can be shared to open the playground with the given code.</returns>
    public string Create(string code, bool runImmediately)
    {
        ArgumentNullException.ThrowIfNull(code);

        var encoded = Encode(code, runImmediately);
        if (string.IsNullOrEmpty(encoded))
        {
            return _baseUrl.ToString();
        }

        var builder = new UriBuilder(_baseUrl)
        {
            Fragment = encoded
        };

        return builder.Uri.ToString();
    }

    private static string Encode(string code, bool runImmediately)
    {
        if (string.IsNullOrEmpty(code))
        {
            return string.Empty;
        }

        var payload = new UrlPayload
        {
            Code = code,
            RunImmediately = runImmediately
        };

        return CompressBytes(payload.ToByteArray());
    }

    private static string CompressBytes(byte[] bytes)
    {
        using var output = new MemoryStream();
        using (var deflate = new DeflateStream(output, CompressionLevel.Optimal, leaveOpen: true))
        {
            deflate.Write(bytes, 0, bytes.Length);
        }

        return Base64Url.EncodeToString(output.ToArray());
    }
}
