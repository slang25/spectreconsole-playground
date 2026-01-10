using System.Buffers.Text;
using System.IO.Compression;
using Google.Protobuf;
using Microsoft.JSInterop;

namespace Spectre.Docs.Playground.Services;

/// <summary>
/// Service for persisting editor state in the URL hash using Protobuf + Deflate compression.
/// </summary>
/// <remarks>
/// Payload format: Protobuf-encoded UrlPayload message, deflate-compressed, base64url-encoded.
/// </remarks>
public sealed class UrlStateService
{
    private readonly IJSRuntime _jsRuntime;

    public UrlStateService(IJSRuntime jsRuntime)
    {
        _jsRuntime = jsRuntime;
    }

    /// <summary>
    /// Creates an encoded URL payload with the given code and options.
    /// </summary>
    public static string Encode(string code, bool runImmediately = false)
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
    /// Decodes a URL payload from the encoded string.
    /// </summary>
    public static UrlPayload? Decode(string encoded)
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

            return UrlPayload.Parser.ParseFrom(bytes);
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Updates the URL hash with the compressed payload.
    /// </summary>
    public async Task UpdateUrlAsync(string code, bool runImmediately = false)
    {
        var encoded = Encode(code, runImmediately);
        await _jsRuntime.InvokeVoidAsync("urlStateInterop.setHash", encoded);
    }

    /// <summary>
    /// Gets the payload from the URL hash, if present.
    /// </summary>
    public async Task<UrlPayload?> GetPayloadFromUrlAsync()
    {
        try
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            var hash = await _jsRuntime.InvokeAsync<string>("urlStateInterop.getHash", cts.Token);
            return Decode(hash);
        }
        catch (OperationCanceledException)
        {
            System.Console.WriteLine("Timeout while reading URL hash");
            return null;
        }
        catch (Exception ex)
        {
            System.Console.WriteLine($"Failed to read URL hash: {ex.Message}");
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

        return Base64Url.EncodeToString(output.ToArray());
    }

    /// <summary>
    /// Decompresses a URL-safe Base64 string back to bytes.
    /// </summary>
    private static byte[]? DecompressBytes(string encoded)
    {
        try
        {
            var compressed = Base64Url.DecodeFromChars(encoded);

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
}
