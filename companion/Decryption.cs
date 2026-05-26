using System.IO;
using System.IO.Compression;
using System.Security.Cryptography;

namespace P5RCompanion;

/// <summary>
/// Decrypts a Persona 5 Royal PC save file.
///
/// Algorithm ported from fiber-saveutil's save.py by zarroboogs:
///   https://github.com/zarroboogs/fiber-saveutil
///   License status: unconfirmed (no LICENSE file in upstream repo) --
///   see companion/KNOWN_ISSUES.md
///
/// File format (encrypted on disk):
///   0x00  "DATA" magic            4 bytes
///   0x04  file CRC                4 bytes  (CRC-32/MPEG-2)
///   0x08  timestamp               4 bytes
///   0x0C  flags                   4 bytes  (bit 31 = encrypted)
///   0x10  AES-256-CBC IV          16 bytes
///   0x20+ AES-256-CBC encrypted body
///
/// After decryption (relative to file offset 0x20):
///   0x20  header_size             uint16
///   0x22  header_size_comp        uint16  (non-zero if zlib-compressed)
///   0x24  data_size               uint32  (0x30720 uncompressed)
///   0x28  data_size_comp          uint32
///   0x2C  save_flags              uint32  (bit 0=header zlib, bit 1=data zlib)
///   0x30  data CRC                uint32
///   0x40+ header  (may be zlib)
///   ...   game data  (may be zlib)
///
/// Key insight: the AES key is a static value, identical in every retail
/// copy of P5R PC. Works with any P5R PC installation; Atlus did not derive
/// it per-account, unlike P5 Strikers.
/// </summary>
public static class Decryption
{
    // Static AES-256 key, public knowledge; the same value ships with every
    // retail copy of P5R PC. Sourced from fiber-saveutil/save.py (zarroboogs).
    private static readonly byte[] AesKey = Convert.FromBase64String(
        "3lOZS0kYSoOOtkC4c7IDfvNXnxIprUPTlUGVC3yBJF0=");

    private const uint EncryptedFlag = 0x80000000;
    private const int FileHeaderSize = 0x20;

    public class SaveContents
    {
        /// <summary>The decrypted and decompressed game data block.</summary>
        public required byte[] Data { get; init; }

        /// <summary>Calendar day from the save header (display only).</summary>
        public ushort CalendarDay { get; init; }

        /// <summary>Playtime in seconds from the save header (display only).</summary>
        public uint PlaytimeSeconds { get; init; }

        /// <summary>Protagonist level from the header (display only).</summary>
        public byte Level { get; init; }
    }

    /// <summary>
    /// Reads, decrypts and decompresses a P5R save file.
    /// The input bytes are never modified; the file on disk is never touched.
    /// </summary>
    public static SaveContents Read(byte[] fileBytes)
    {
        if (fileBytes.Length < FileHeaderSize + 16)
            throw new InvalidDataException("Save file too small to be valid.");

        // Read file header
        var magic = System.Text.Encoding.ASCII.GetString(fileBytes, 0, 4);
        if (magic != "DATA")
            throw new InvalidDataException($"Invalid save file magic: expected 'DATA', got '{magic}'.");

        var flags = BitConverter.ToUInt32(fileBytes, 0x0C);
        var iv = new byte[16];
        Array.Copy(fileBytes, 0x10, iv, 0, 16);

        // Decrypt body if the encrypted flag is set
        byte[] body;
        if ((flags & EncryptedFlag) != 0)
        {
            body = DecryptAes(fileBytes, FileHeaderSize, iv);
        }
        else
        {
            body = new byte[fileBytes.Length - FileHeaderSize];
            Array.Copy(fileBytes, FileHeaderSize, body, 0, body.Length);
        }

        // Inner header (offsets relative to start of decrypted body)
        var headerSize = BitConverter.ToUInt16(body, 0x00);
        var headerSizeComp = BitConverter.ToUInt16(body, 0x02);
        var dataSize = BitConverter.ToUInt32(body, 0x04);
        var dataSizeComp = BitConverter.ToUInt32(body, 0x08);
        var saveFlags = BitConverter.ToUInt32(body, 0x0C);

        var headerCompressed = (saveFlags & 1) != 0;
        var dataCompressed = (saveFlags & 2) != 0;

        // headerSizeComp stores an encoded value with a 0x40 bias when compressed;
        // subtract it to get the actual byte count on disk.
        // dataSizeComp is already the true byte count, no bias applied.
        var headerActualComp = headerCompressed ? (uint)(headerSizeComp - 0x40) : headerSize;

        // Read header block (for display info only, never persisted)
        var headerBytes = ExtractBlock(
            body,
            startOffset: 0x20,
            rawSize: headerSize,
            compSize: headerActualComp,
            compressed: headerCompressed);

        var (calendarDay, playtime, level) = ParseHeaderDisplayInfo(headerBytes);

        // Skip past the header block to find the data block. Aligned to 16 bytes.
        var dataStart = AlignUp(0x20 + (int)headerActualComp, 16);

        var dataBytes = ExtractBlock(
            body,
            startOffset: dataStart,
            rawSize: dataSize,
            compSize: dataSizeComp,
            compressed: dataCompressed);

        return new SaveContents
        {
            Data = dataBytes,
            CalendarDay = calendarDay,
            PlaytimeSeconds = playtime,
            Level = level,
        };
    }

    private static byte[] DecryptAes(byte[] source, int offset, byte[] iv)
    {
        using var aes = Aes.Create();
        aes.Key = AesKey;
        aes.IV = iv;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.None; // file is exactly block-aligned

        using var decryptor = aes.CreateDecryptor();
        var inputLength = source.Length - offset;
        // Round down to a multiple of 16 just in case
        inputLength -= inputLength % 16;
        return decryptor.TransformFinalBlock(source, offset, inputLength);
    }

    private static byte[] ExtractBlock(byte[] body, int startOffset, uint rawSize, uint compSize, bool compressed)
    {
        if (compressed)
        {
            // Caller is responsible for passing the true byte count (any encoding
            // bias has already been stripped before this call).
            var compLength = (int)compSize;
            if (startOffset + compLength > body.Length)
                throw new InvalidDataException("Compressed block extends past end of file.");

            using var compressed_stream = new MemoryStream(body, startOffset, compLength);
            using var zlib = new ZLibStream(compressed_stream, CompressionMode.Decompress);
            using var output = new MemoryStream(checked((int)rawSize));
            zlib.CopyTo(output);
            return output.ToArray();
        }
        else
        {
            if (startOffset + rawSize > body.Length)
                throw new InvalidDataException("Uncompressed block extends past end of file.");

            var result = new byte[rawSize];
            Array.Copy(body, startOffset, result, 0, (int)rawSize);
            return result;
        }
    }

    /// <summary>
    /// Pulls a few display-only fields from the save header so the user can
    /// pick the right slot. These values are shown in the UI and immediately
    /// discarded; never written to JSON, never sent anywhere.
    ///
    /// Header layout (from save.py _unpack_header):
    ///   0x00  playtime  uint32
    ///   0x04  day       uint16
    ///   0x06  time      byte
    ///   0x07  playthrough byte
    ///   0x08  difficulty byte
    ///   0x09  level     byte
    /// </summary>
    private static (ushort day, uint playtime, byte level) ParseHeaderDisplayInfo(byte[] header)
    {
        if (header.Length < 0x10) return (0, 0, 0);
        // Playtime is a frame counter running at 60fps; divide to get seconds.
        var playtimeFrames = BitConverter.ToUInt32(header, 0);
        var playtime = playtimeFrames / 60u;
        var day = BitConverter.ToUInt16(header, 4);
        var level = header[9];
        return (day, playtime, level);
    }

    private static int AlignUp(int value, int alignment)
        => (value + (alignment - 1)) & ~(alignment - 1);
}
