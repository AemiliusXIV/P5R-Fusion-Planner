using System.IO;

namespace P5RCompanion;

/// <summary>
/// Auto-detects the P5R save folder location.
///
/// Standard path:
///   %AppData%\Roaming\SEGA\P5R\Steam\<SteamID64>\savedata\
///
/// The SteamID64 subfolder is the only one whose name we don't know in advance.
/// We scan for it and prefer the most recently modified one (handles users with
/// multiple Steam accounts on the same machine).
/// </summary>
public static class SaveFileLocator
{
    public class SaveSlot
    {
        public required string FilePath { get; init; }
        public required string SlotName { get; init; }   // "DATA01", "DATA02", ...
        public DateTime LastModified { get; init; }
        public long SizeBytes { get; init; }
    }

    public static string? FindSaveFolder()
    {
        var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        var steamRoot = Path.Combine(appData, "SEGA", "P5R", "Steam");

        if (!Directory.Exists(steamRoot)) return null;

        // Each subfolder of Steam\ is a SteamID64. We pick the one with the
        // most recently modified savedata folder (the active account).
        var candidates = Directory.GetDirectories(steamRoot)
            .Select(dir => new
            {
                Dir = dir,
                SaveData = Path.Combine(dir, "savedata"),
            })
            .Where(c => Directory.Exists(c.SaveData))
            .Select(c => new
            {
                c.SaveData,
                LastWrite = Directory.GetLastWriteTime(c.SaveData),
            })
            .OrderByDescending(c => c.LastWrite)
            .ToList();

        return candidates.FirstOrDefault()?.SaveData;
    }

    public static List<SaveSlot> ListSaveSlots(string saveFolder)
    {
        var slots = new List<SaveSlot>();
        if (!Directory.Exists(saveFolder)) return slots;

        // Each save slot is a subdirectory named DATA01..DATA16 containing
        // a DATA.DAT file. The savedata folder itself does not hold the files
        // directly.
        for (var i = 1; i <= 16; i++)
        {
            var slotName = $"DATA{i:D2}";
            var slotDir  = Path.Combine(saveFolder, slotName);
            if (!Directory.Exists(slotDir)) continue;

            var dataFile = Path.Combine(slotDir, "DATA.DAT");
            if (!File.Exists(dataFile)) continue;

            var info = new FileInfo(dataFile);
            slots.Add(new SaveSlot
            {
                FilePath     = dataFile,
                SlotName     = slotName,
                LastModified = info.LastWriteTime,
                SizeBytes    = info.Length,
            });
        }

        return slots;
    }

    /// <summary>
    /// Copies the file bytes into memory. The original file on disk is
    /// not touched, not opened with write access, not locked.
    /// Uses FileShare.ReadWrite so we don't conflict with Steam Cloud sync.
    /// </summary>
    public static byte[] ReadFileBytes(string path)
    {
        using var fs = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
        using var ms = new MemoryStream();
        fs.CopyTo(ms);
        return ms.ToArray();
    }
}
