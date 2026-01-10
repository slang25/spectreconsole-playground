using System.IO.Compression;
using Google.Protobuf;

namespace StuDev.Spectre.Console.Playground.Utilities;

/// <summary>
/// Represents a decoded playground URL payload.
/// </summary>
/// <param name="Code">The C# code contained in the URL.</param>
/// <param name="RunImmediately">Whether the code should run automatically when the URL is opened.</param>
public record PlaygroundUrlPayload(string Code, bool RunImmediately);

/// <summary>
/// Provides methods for creating and parsing Spectre.Console Playground URLs.
/// </summary>
public static class PlaygroundUrl
{
    /// <summary>
    /// Creates a full playground URL with the given code.
    /// </summary>
    /// <param name="baseUrl">The base URL of the playground (e.g., "https://playground.spectreconsole.net/").</param>
    /// <param name="code">The C# code to include in the URL.</param>
    /// <param name="runImmediately">Whether the code should run automatically when the URL is opened.</param>
    /// <returns>A full URL that can be shared to open the playground with the given code.</returns>
    public static string Create(string baseUrl, string code, bool runImmediately)
    {
        ArgumentNullException.ThrowIfNull(baseUrl);
        ArgumentNullException.ThrowIfNull(code);

        var encoded = Encode(code, runImmediately);
        if (string.IsNullOrEmpty(encoded))
        {
            return baseUrl.TrimEnd('/') + "/";
        }

        return baseUrl.TrimEnd('/') + "/#" + encoded;
    }

    /// <summary>
    /// Parses a playground URL and returns the decoded payload.
    /// </summary>
    /// <param name="url">The full playground URL to parse.</param>
    /// <returns>The decoded payload, or null if the URL is invalid or contains no code.</returns>
    public static PlaygroundUrlPayload? Parse(string url)
    {
        ArgumentNullException.ThrowIfNull(url);

        // Find the hash fragment
        var hashIndex = url.IndexOf('#');
        if (hashIndex < 0 || hashIndex >= url.Length - 1)
        {
            return null;
        }

        var encoded = url[(hashIndex + 1)..];
        return Decode(encoded);
    }

    /// <summary>
    /// Encodes code into a URL-safe hash string.
    /// </summary>
    /// <param name="code">The C# code to encode.</param>
    /// <param name="runImmediately">Whether the code should run automatically when the URL is opened.</param>
    /// <returns>A URL-safe encoded string, or empty string if the code is empty.</returns>
    public static string Encode(string code, bool runImmediately)
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

    /// <summary>
    /// Decodes a URL-safe hash string back to its payload.
    /// </summary>
    /// <param name="encoded">The encoded hash string from the URL.</param>
    /// <returns>The decoded payload, or null if the string is invalid.</returns>
    public static PlaygroundUrlPayload? Decode(string encoded)
    {
        if (string.IsNullOrEmpty(encoded))
        {
            return null;
        }

        try
        {
            var bytes = DecompressBytes(encoded);
            if (bytes == null || bytes.Length == 0)
            {
                return null;
            }

            var payload = UrlPayload.Parser.ParseFrom(bytes);
            return new PlaygroundUrlPayload(payload.Code, payload.RunImmediately);
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Compresses bytes using Deflate and encodes to URL-safe Base64.
    /// </summary>
    private static string CompressBytes(byte[] bytes)
    {
        using var output = new MemoryStream();
        using (var deflate = new DeflateStream(output, CompressionLevel.Optimal, leaveOpen: true))
        {
            deflate.Write(bytes, 0, bytes.Length);
        }

        return ToBase64Url(output.ToArray());
    }

    /// <summary>
    /// Decompresses a URL-safe Base64 string back to bytes.
    /// </summary>
    private static byte[]? DecompressBytes(string encoded)
    {
        try
        {
            var compressed = FromBase64Url(encoded);

            using var input = new MemoryStream(compressed);
            using var deflate = new DeflateStream(input, CompressionMode.Decompress);
            using var output = new MemoryStream();

            deflate.CopyTo(output);

            return output.ToArray();
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Converts bytes to URL-safe Base64 (RFC 4648 §5).
    /// </summary>
    private static string ToBase64Url(byte[] bytes)
    {
        return Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }

    /// <summary>
    /// Converts URL-safe Base64 back to bytes.
    /// </summary>
    private static byte[] FromBase64Url(string encoded)
    {
        // Restore standard Base64 characters
        var base64 = encoded
            .Replace('-', '+')
            .Replace('_', '/');

        // Add padding if needed
        switch (base64.Length % 4)
        {
            case 2: base64 += "=="; break;
            case 3: base64 += "="; break;
        }

        return Convert.FromBase64String(base64);
    }
}
