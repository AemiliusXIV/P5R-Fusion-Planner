# companion/ -- Licensing Resolution Record

This file replaces KNOWN_ISSUES.md, which blocked distribution of the companion
binary until two licensing questions were settled. Both are now resolved. The
analysis and the changes made are recorded here.

*Resolved: 2026-07-12 by AemiliusXIV*

---

## Issue 1 -- fiber-saveutil (no upstream license): resolved

**Source:** https://github.com/zarroboogs/fiber-saveutil

The upstream repository still carries no LICENSE file and has been dormant
since December 2022, so a response from the author is not a realistic path.

Resolution rests on what was actually taken. A direct comparison of
`companion/Decryption.cs` against fiber-saveutil's `save.py` shows the two
share only facts about the save format: the container layout (magic, CRC,
flags, IV, block offsets), the flag bit meanings, and the static AES-256 key.
Every one of those is a property of Persona 5 Royal itself, established by
Atlus, and merely documented by fiber-saveutil. Copyright protects the
expression of a program, not facts or methods of operation, and none of
fiber-saveutil's expression appears in the companion: the C# has its own
structure, its own types and helpers, its own error handling, and it even
interprets the compressed-header-size field differently (as a biased size
rather than an end offset). No code was copied or translated.

**Changes made:** the "license status unconfirmed / do not distribute" notices
in LICENSE, NOTICE and the code comments were replaced with an accurate
statement: fiber-saveutil is credited as the public documentation of the save
format, and the companion implements that format in its own code. The credit
is retained because it is deserved, not because it is required.

## Issue 2 -- KingdomSaveEditor persona ID table (GPL v3): resolved

**Source:** https://github.com/Xeeynamo/KingdomSaveEditor (KHSave.LibPersona5)

`companion/Resources/persona-ids.txt` is adapted from a GPL v3 project, and
GPL v3 material cannot be redistributed under Apache 2.0. Rather than lean on
the shaky argument that a factual ID table is uncopyrightable, the companion
takes the compliant route: **the companion save reader is now licensed under
GPL v3** (Option B of the original document). See `companion/LICENSE`.

This works because the companion is a standalone program. It lives in its own
project (`P5RCompanion.csproj`), builds to its own binary, and shares no code
with the web application; the only connection between the two is a URL the
user opens in a browser. The web application under the repository root remains
Apache 2.0 and contains no GPL material.

**Changes made:** `companion/LICENSE` added (GPL v3), LICENSE and NOTICE
updated to state the split licensing, README License section updated to match.

---

## Practical notes

- Corresponding source for the released binaries is this public repository,
  satisfying GPL v3's source availability requirement.
- Future companion release notes should state the GPL v3 license and link
  `companion/LICENSE`.
- Anyone forking the companion must keep it under GPL v3. Forking the web
  application alone stays Apache 2.0.
