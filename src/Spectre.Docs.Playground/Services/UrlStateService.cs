using System.IO.Compression;
using System.Text;
using Microsoft.JSInterop;

namespace Spectre.Docs.Playground.Services;

/// <summary>
/// Service for persisting editor state in the URL hash using Deflate compression.
/// </summary>
public sealed class UrlStateService
{
    private readonly IJSRuntime _jsRuntime;

    public UrlStateService(IJSRuntime jsRuntime)
    {
        _jsRuntime = jsRuntime;
    }

    /// <summary>
    /// Compresses and encodes code to a URL-safe Base64 string.
    /// </summary>
    public static string Compress(string code)
    {
        if (string.IsNullOrEmpty(code))
        {
            return string.Empty;
        }

        var bytes = Encoding.UTF8.GetBytes(code);

        using var output = new MemoryStream();
        using (var deflate = new DeflateStream(output, CompressionLevel.Optimal, leaveOpen: true))
        {
            deflate.Write(bytes, 0, bytes.Length);
        }

        var compressed = output.ToArray();
        return ToBase64Url(compressed);
    }

    /// <summary>
    /// Decodes and decompresses a URL-safe Base64 string back to code.
    /// </summary>
    public static string? Decompress(string encoded)
    {
        if (string.IsNullOrEmpty(encoded))
        {
            return null;
        }

        try
        {
            var compressed = FromBase64Url(encoded);

            using var input = new MemoryStream(compressed);
            using var deflate = new DeflateStream(input, CompressionMode.Decompress);
            using var output = new MemoryStream();

            deflate.CopyTo(output);

            return Encoding.UTF8.GetString(output.ToArray());
        }
        catch
        {
            // Invalid encoded data - return null
            return null;
        }
    }

    /// <summary>
    /// Updates the URL hash with the compressed code.
    /// </summary>
    public async Task UpdateUrlAsync(string code)
    {
        var encoded = Compress(code);
        await _jsRuntime.InvokeVoidAsync("urlStateInterop.setHash", encoded);
    }

    /// <summary>
    /// Gets the code from the URL hash, if present.
    /// </summary>
    public async Task<string?> GetCodeFromUrlAsync()
    {
        var hash = await _jsRuntime.InvokeAsync<string>("urlStateInterop.getHash");
        return Decompress(hash);
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
