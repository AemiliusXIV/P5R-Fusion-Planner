# companion/ -- Open Licensing Issues

**Do not distribute the companion binary until both issues below are resolved.**

This file will be removed (or replaced with a RESOLVED.md) once both items have
been addressed. The main P5R Fusion Planner web application is not affected by
either issue; only the companion/ Windows save reader is blocked.

---

## Issue 1 -- fiber-saveutil: no license file found

**Source:** https://github.com/zarroboogs/fiber-saveutil
**Author:** zarroboogs
**Status:** Awaiting response from author

The fiber-saveutil repository contains no LICENSE file and no in-file license
headers. Default copyright law applies, meaning all rights are reserved.

The companion save reader's decryption logic is based on this project.

**Required action:**
Contact zarroboogs (GitHub: @zarroboogs) and request either:
- Addition of an Apache 2.0 (or compatible permissive) LICENSE file to the repo, or
- Written permission to incorporate the decryption logic into this Apache 2.0 project.

Alternatively, reimplement the decryption logic independently without reference to
the fiber-saveutil source.

**Fallback if no response is received within a reasonable period:**
Replace the derived decryption code with an independent implementation.

---

## Issue 2 -- KingdomSaveEditor: GPL v3 compatibility

**Source:** https://github.com/Xeeynamo/KingdomSaveEditor
**Author:** Luciano Ciccariello (Xeeynamo)
**License:** GNU General Public License, Version 3
**Status:** Awaiting resolution

The persona ID lookup table at `companion/Resources/persona-ids.txt` is adapted
from the `KHSave.LibPersona5` component of KingdomSaveEditor, which is GPL v3.

GPL v3 and Apache 2.0 are license-incompatible: GPL v3 code cannot be incorporated
into an Apache 2.0 project and redistributed under Apache 2.0 terms.

The copyrightability of a factual enumeration table (integer IDs to character names)
is legally uncertain, particularly given that the underlying data originates with
Atlus, not the author of KingdomSaveEditor. However, this uncertainty is not a
substitute for a clean resolution.

**Required actions (choose one):**

Option A -- Replace the table with independently derived data.
Re-derive persona-ids.txt directly from game files or from an Apache-licensed or
public-domain source. This is the recommended path.

Option B -- Relicense companion/ under GPL v3 as a separate component.
This is viable only if companion/ is a fully independent binary with no compile-time
linkage to the Apache 2.0 main application.

Option C -- Seek a separate written licence from Xeeynamo.
Request permission to use the table under Apache 2.0-compatible terms. The repo is
archived but the author may be reachable.

---

*Last reviewed: 2026-05-26 by AemiliusXIV*
