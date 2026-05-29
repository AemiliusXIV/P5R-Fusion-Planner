# P5R Fusion Planner: How it works

## The web app

The P5R Fusion Planner is a browser tool for Persona 5 Royal. It covers every persona in the game and helps you figure out what to fuse, what you already have, and what you still need.

**Browsing personas.** Every persona in the game is listed with its stats, skills, elemental affinities, and arcana. You can filter by name, arcana, or whether you own or wishlist it. The Fusion Ingredient filter lets you type any persona's name and see every persona you can fuse it into.

**Planning fusions.** Tap any persona to see every recipe that produces it. The Fusion Tree goes further: pick a target and it maps out the entire ingredient chain, all the way down to personas you already own. The whole chain opens by default and scales to fit the screen; at every step you can swap to a different recipe if an alternative suits you better. Prefer to drill down a layer at a time instead? Turn off auto-expand in Settings and each node opens on click.

**Tracking your collection.** Mark personas as owned or wishlisted. The fusion tree stops expanding at anything you already have, so you only see what's left to fuse. Wishlisted personas get a gold star and can be filtered to a separate view.

**Confidant requirements.** Some high-level personas can only be fused once a particular Confidant (Social Link) is at max rank. The planner flags these in the fusion tree so you know what's gated before you waste ingredients.

**DLC personas.** If you own DLC persona packs, toggle them on in settings. The planner adds them to the list and includes them in fusion recipes.

**Offline use.** After your first visit, the app works with no internet connection. It can also be installed to your home screen or taskbar like a regular app.

---

## How fusion works

Persona fusion in P5R combines two personas to produce a third. The rules (simplified):

- Every persona belongs to an **arcana** (The Fool, The Magician, The Empress, and so on)
- Fusing two personas from different arcanas produces a persona in a third arcana, determined by a fixed combination table that's the same for every playthrough
- The resulting persona's level is the average of the two ingredients, rounded up to the next persona in that arcana at or above that level
- Some arcana combinations produce the same result arcana; the game has a defined priority order to handle ties
- **Special fusions** require three or more specific personas and always produce the same result regardless of level
- **Rare personas** (Treasure Demons) fuse with normal personas using their own separate rules

All of this runs entirely in your browser. No server calculates anything, and no data about your fusions is sent anywhere.

---

## The save reader companion

The companion (`P5RCompanion.exe`) is a small Windows app that reads your Persona 5 Royal PC save file and imports your owned personas into the planner, so you don't have to mark them all by hand.

### How to use it

1. Open `P5RCompanion.exe`
2. It finds your P5R save folder automatically. If it doesn't, click **Browse** and navigate to your save folder manually (usually inside `%AppData%\Roaming\SEGA\P5R\Steam\`)
3. Your save slots appear in the list. Click the one you want to read
4. Click **Read Selected Save**
5. You'll see how many owned personas were found, along with your save's day, playtime, and level
6. Then either:
   - Click **Open in Browser** to open the planner and import automatically
   - Click **Copy Link** to copy a link you can paste into your browser's address bar, or into the Paste Import field on the planner's Settings page
   - Click **Save JSON** to save the raw import file if you want to keep a copy

Your wishlist entries and notes are never overwritten by an import from the save file. Only the owned status is updated.

### What it reads

Two parts of your save:

- The **persona compendium**: the list of personas you have registered in the Velvet Room. This becomes your owned list. It doesn't read those personas' stats, skills, or traits, only which ones you have.
- Three values from the save header (your **calendar day, playtime, and level**), shown on screen so you can confirm you picked the right save slot. These are displayed only: not added to the import, not saved, not sent anywhere.

It does **not** read:
- Your protagonist's name
- Your in-game money or items
- Your story progress or which scenes you've seen
- Confidant ranks or relationship data
- Any character dialogue or choices

---

## Privacy

**Your save file is never modified.** The file is opened as read-only, copied entirely into memory, and the file handle is closed before any processing begins. Nothing is written back.

**No data leaves your machine.** The companion makes no network connections. The list of owned personas is encoded into a URL link. That link uses a hash fragment (the `#` part of the URL), which browsers never send to a server — it stays entirely on your side. Clicking "Open in Browser" opens the planner the same way you'd open any website; the import data is decoded locally in your browser.

**The web app stores nothing outside your browser.** Your collection, wishlist, settings, and DLC toggles are saved in your browser's local storage. They never leave your device, and no account is required.

**No analytics or tracking.** Neither the web app nor the companion makes any background requests. There are no analytics, no telemetry, no crash reports.

**The decryption key is not a personal credential.** P5R PC save files are encrypted with a static AES-256 key that Atlus ships identically in every retail copy of the game. It is not tied to your account or your Steam ID. This key is documented publicly in the open-source [fiber-saveutil](https://github.com/zarroboogs/fiber-saveutil) project, which this companion's decryption logic is ported from.

---

## Security warnings

When you first run the companion, Windows SmartScreen or your antivirus may show a warning. Neither means anything is wrong. Here's what's actually happening:

**SmartScreen (Windows)**
SmartScreen checks whether a downloaded executable is signed with a publisher certificate. This one isn't, because certificates cost several hundred dollars a year. Unsigned apps from the internet always trigger the prompt regardless of what they do. Click **More info → Run anyway** to proceed.

**Antivirus flags**
Some antivirus tools flag self-contained .NET executables because they're large bundled files (the app ships with its own copy of the .NET runtime included) and because the app reads files from disk. Both are normal and expected for this type of application. If you want to verify the file yourself, the full source code is in this repo.

**Download only from the official source**
Get the companion only from the [official releases page](https://github.com/AemiliusXIV/P5R-Fusion-Planner/releases). The app makes no network connections, so it cannot send your data anywhere; a copy obtained from somewhere else could be altered to do exactly that. Every release lists a SHA-256 checksum, so you can confirm the file you downloaded matches the published build before running it.

**What the checksum is for**
A SHA-256 checksum is a short fingerprint of the exact file that was built and published. After downloading, you can generate the same fingerprint from your own copy and compare the two: if they match, your file is identical to the published build and hasn't been tampered with on the way to you. On Windows, run `Get-FileHash .\P5RCompanion-1.0.2.exe` in PowerShell and check the result against the value in the release notes. It's optional, just there if you want the extra certainty.

For the full picture of what the app reads and what it does with it, see the [Privacy](#privacy) section above.

---

Web app: https://aemiliusxiv.github.io/P5R-Fusion-Planner/
Source code: https://github.com/AemiliusXIV/P5R-Fusion-Planner
