using System.IO.Compression;
using System.Text;
using Google.Protobuf;
using Microsoft.JSInterop;

namespace Spectre.Docs.Playground.Services;

/// <summary>
/// Service for persisting editor state in the URL hash using Protobuf + Deflate compression.
/// </summary>
/// <remarks>
/// Payload format (v1+):
///   Protobuf-encoded UrlPayload message, then deflate-compressed, then base64url-encoded.
///
/// Legacy format (v0) is raw UTF-8 code without protobuf wrapper.
/// </remarks>
public sealed class UrlStateService
{
    private readonly IJSRuntime _jsRuntime;

    private const int CurrentVersion = 1;

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
            Version = CurrentVersion,
            Code = code,
            RunImmediately = runImmediately
        };

        return CompressBytes(payload.ToByteArray());
    }

    /// <summary>
    /// Decodes a URL payload from the encoded string.
    /// Supports both the new protobuf format (v1+) and legacy format (raw code).
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

            // Try to parse as protobuf first
            try
            {
                var payload = UrlPayload.Parser.ParseFrom(bytes);
                // Valid protobuf with version >= 1 means it's the new format
                if (payload.Version >= 1)
                {
                    return payload;
                }
            }
            catch (InvalidProtocolBufferException)
            {
                // Not a valid protobuf message, fall through to legacy handling
            }

            // Legacy format (v0): raw UTF-8 code without protobuf wrapper
            return new UrlPayload
            {
                Version = 0,
                Code = Encoding.UTF8.GetString(bytes),
                RunImmediately = false
            };
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Compresses and encodes code to a URL-safe Base64 string.
    /// </summary>
    [Obsolete("Use Encode() instead for versioned payloads")]
    public static string Compress(string code) => Encode(code);

    /// <summary>
    /// Decodes and decompresses a URL-safe Base64 string back to code.
    /// </summary>
    [Obsolete("Use Decode() instead for versioned payloads")]
    public static string? Decompress(string encoded) => Decode(encoded)?.Code;

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
    /// Gets the code from the URL hash, if present.
    /// </summary>
    [Obsolete("Use GetPayloadFromUrlAsync() instead to access all payload fields")]
    public async Task<string?> GetCodeFromUrlAsync()
    {
        var payload = await GetPayloadFromUrlAsync();
        return payload?.Code;
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
