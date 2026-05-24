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

        // Match DATA01 through DATA16 (no extension). Skip SYSTEM files.
        for (var i = 1; i <= 16; i++)
        {
            var slotName = $"DATA{i:D2}";
            var path = Path.Combine(saveFolder, slotName);
            if (!File.Exists(path)) continue;

            var info = new FileInfo(path);
            slots.Add(new SaveSlot
            {
                FilePath = path,
                SlotName = slotName,
                LastModified = info.LastWriteTime,
                SizeBytes = info.Length,
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
