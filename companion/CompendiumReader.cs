using System.IO;
using System.Reflection;
using System.Text;

namespace P5RCompanion;

/// <summary>
/// Reads the persona compendium out of a decrypted P5R save file.
///
/// Compendium location verified empirically against a live P5R PC save file.
///
/// Within the decrypted game data block:
///   Offset 0x3F40: 464 entries × 48 bytes (0x30 stride)
///
/// Per-entry layout:
///   0x00  Flags  short   ← bit 0 set = registered in compendium
///   0x02  Id     short   ← persona ID (1=Metatron, 5=Jack Frost, ...)
///   0x04+ Level, Trait, Experience, Skills, Stats; we don't read these
///
/// We only look at Flags + Id. Everything else in the save (header,
/// money, story flags, character data, protagonist name) is ignored.
/// </summary>
public static class CompendiumReader
{
    private const int CompendiumOffset = 0x3F40;
    private const int EntryCount = 0x1D0;     // 464
    private const int EntryStride = 0x30;     // 48 bytes
    private const ushort RegisteredFlag = 0x0001;

    // Names in the save file that differ from the PWA's persona data.
    // The save file uses ASCII-only names; the PWA matches in-game spelling.
    private static readonly Dictionary<string, string> NameTranslations = new()
    {
        ["Arsene"] = "Arsène",
    };

    private static string[]? _personaIdLookup;

    /// <summary>
    /// Returns the list of owned persona names, ready for use in the
    /// PWA's import JSON. Names are translated to match the PWA's
    /// canonical spellings. Unknown personas are silently skipped.
    /// </summary>
    public static HashSet<string> ReadOwnedPersonas(byte[] decryptedData)
    {
        EnsureLookupLoaded();

        var owned = new HashSet<string>(StringComparer.Ordinal);
        var lookup = _personaIdLookup!;

        for (var i = 0; i < EntryCount; i++)
        {
            var entryOffset = CompendiumOffset + i * EntryStride;
            if (entryOffset + 4 > decryptedData.Length) break;

            var flags = BitConverter.ToUInt16(decryptedData, entryOffset);
            var id = BitConverter.ToUInt16(decryptedData, entryOffset + 2);

            // Skip if not registered, or ID out of range
            if ((flags & RegisteredFlag) == 0) continue;
            if (id == 0 || id >= lookup.Length) continue;

            var rawName = lookup[id];
            if (string.IsNullOrWhiteSpace(rawName) || rawName == "000") continue;

            // Translate name if needed, otherwise use as-is.
            // Unknown personas (not in the PWA) are silently dropped at
            // PWA import time; they just won't have a card to mark.
            var canonicalName = NameTranslations.TryGetValue(rawName, out var translated)
                ? translated
                : rawName;

            owned.Add(canonicalName);
        }

        return owned;
    }

    /// <summary>
    /// Loads the embedded persona-ids.txt resource. Line N is persona ID N
    /// (line 1 = ID 1 = Metatron, etc.). Line 0 is the placeholder "000".
    /// </summary>
    private static void EnsureLookupLoaded()
    {
        if (_personaIdLookup != null) return;

        var assembly = Assembly.GetExecutingAssembly();
        var resourceName = assembly.GetManifestResourceNames()
            .FirstOrDefault(n => n.EndsWith("persona-ids.txt", StringComparison.OrdinalIgnoreCase))
            ?? throw new InvalidOperationException("persona-ids.txt resource missing from build.");

        using var stream = assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException($"Failed to open resource: {resourceName}");
        using var reader = new StreamReader(stream, Encoding.UTF8);

        var lines = new List<string>();
        while (!reader.EndOfStream)
        {
            var line = reader.ReadLine();
            if (line != null) lines.Add(line.Trim());
        }

        _personaIdLookup = lines.ToArray();
    }
}
