# Security notes

This document explains what the companion save reader does and does not do,
for the benefit of automated scanners and human reviewers alike.

## What the companion tool does

The companion (`companion/`) is a small Windows desktop utility that reads a
Persona 5 Royal PC save file and imports the player's owned personas into
the web-based fusion planner.

Besides the persona compendium, it reads three values from the save header
(calendar day, playtime, and protagonist level) only to display them on screen,
so the user can confirm they selected the right save slot. These values are not
included in the import and not written anywhere.

## What it does not do

- **No process access.** The tool never calls `OpenProcess`, `ReadProcessMemory`,
  or any equivalent. It has no knowledge of whether the game is running.
- **No screen capture or OCR.** All data comes from the save file on disk.
- **No network access.** The tool makes no outbound connections. The only
  action that touches the network is the user clicking "Open in Browser",
  which opens the user's default browser to a URL they can inspect.
- **No write access to the save file.** The file is opened with
  `FileAccess.Read` only. It is copied into memory and the handle is
  immediately closed. The original file on disk is never modified.
- **No Steam account interaction.** The tool does not read Steam credentials,
  tokens, or any account information.

## The AES key in Decryption.cs

The base64 value in `Decryption.cs` is a static AES-256 key that Atlus
ships identically in every retail copy of Persona 5 Royal for PC. It is
not a personal credential, not a secret, and not derived from any user
account. It is documented publicly in the open-source
[fiber-saveutil](https://github.com/zarroboogs/fiber-saveutil) project
(Apache 2.0), from which this project's decryption logic is ported.
The key decrypts the player's own save file on their own machine; it has
no value or effect outside that context.

## Win32 API usage

The companion uses no Win32 APIs beyond what WPF requires for rendering.
It uses only standard .NET file I/O (`FileStream`, `MemoryStream`) and
`System.Diagnostics.Process.Start` to open a browser URL.

## Data flow summary

```
Save file on disk
  → FileStream (read-only) → byte[] in memory → file handle closed
  → AES-CBC decrypt (in memory, .NET Aes class)
  → zlib decompress (in memory, .NET ZLibStream)
  → read 464 compendium entries at offset 0x3F40
  → build JSON string
  → URL-encode as hash fragment (never sent to a server)
  → user clicks "Open in Browser" → browser opens local URL
```

Nothing leaves the machine except the URL the user explicitly opens.
