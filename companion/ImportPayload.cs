using System.IO;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace P5RCompanion;

/// <summary>
/// Builds the JSON import payload that the PWA's /import route understands.
///
/// The PWA's import format (defined in ImportedOwnedData):
///   {
///     "version": 1,
///     "source": "save-file",
///     "personas": {
///       "Persona Name": { "owned": true, "wishlist": false, "notes": "" },
///       ...
///     }
///   }
///
/// We only include owned personas. The PWA's importOwned action merges
/// (when source == "save-file") so the user's existing wishlist and notes
/// are preserved.
/// </summary>
public static class ImportPayload
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = false,
        DefaultIgnoreCondition = JsonIgnoreCondition.Never,
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    };

    public static string BuildJson(IEnumerable<string> ownedPersonaNames)
    {
        var personas = new Dictionary<string, OwnedState>(StringComparer.Ordinal);
        foreach (var name in ownedPersonaNames)
        {
            personas[name] = new OwnedState { Owned = true, Wishlist = false, Notes = "" };
        }

        var payload = new ImportData
        {
            Version = 1,
            Source = "save-file",
            Personas = personas,
        };

        return JsonSerializer.Serialize(payload, JsonOptions);
    }

    /// <summary>
    /// URL-safe base64 encoding for use in a hash fragment.
    /// </summary>
    public static string EncodeForUrl(string json)
    {
        var bytes = Encoding.UTF8.GetBytes(json);
        return Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }

    /// <summary>
    /// Builds the full deep-link URL for the PWA.
    /// </summary>
    public static string BuildDeepLink(string baseUrl, string json)
    {
        var encoded = EncodeForUrl(json);
        return $"{baseUrl.TrimEnd('/')}/#/import?data={encoded}";
    }

    public static void WriteJsonToFile(string path, string json)
    {
        File.WriteAllText(path, json, Encoding.UTF8);
    }

    // --- DTOs matching the PWA's expected shape ---

    private class ImportData
    {
        [JsonPropertyName("version")] public int Version { get; set; }
        [JsonPropertyName("source")]  public string Source { get; set; } = "";
        [JsonPropertyName("personas")] public Dictionary<string, OwnedState> Personas { get; set; } = new();
    }

    private class OwnedState
    {
        [JsonPropertyName("owned")]    public bool Owned { get; set; }
        [JsonPropertyName("wishlist")] public bool Wishlist { get; set; }
        [JsonPropertyName("notes")]    public string Notes { get; set; } = "";
    }
}
