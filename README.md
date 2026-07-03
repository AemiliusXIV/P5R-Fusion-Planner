# P5R Fusion Planner

A Persona 5 Royal fusion calculator and collection planner built as a modern PWA with a faithful P5 aesthetic.

**Live app:** https://aemiliusxiv.github.io/P5R-Fusion-Planner/

## Features

- **Full fusion calculator**: all 232 Royal personas, binary fusion, same-arcana downrank, rare (Treasure Demon) fusions, and all 24 special multi-ingredient fusions
- **Recursive Fusion Tree**: pick any target persona and see a full ingredient chain down to personas you already own, with swappable recipe alternatives at every node
- **Owned & Wishlist tracking**: mark personas as owned or wishlisted; the fusion tree stops branching at anything you already have
- **Confidant awareness**: each arcana's ultimate persona is gated behind maxing that Confidant; those are flagged across the app, and the fusion tree marks them locked or unlocked to match your progress
- **Ultimates view**: the 23 arcana ultimates in one place, with the ones you can fuse now sorted to the top and any you already have dropped to the bottom
- **Skill browser**: searchable list of all 525 skills with element, cost, and which personas learn them
- **DLC toggles**: enable or disable each DLC persona group; the entire fusion engine updates accordingly
- **Import / Export**: save your collection as JSON and reload it across devices
- **PWA**: installable on Android and desktop, works fully offline

## Companion: save reader

A small Windows app that reads your P5R PC save file and imports your owned personas into the planner automatically. No manual marking needed.

Download the `.exe` from [Releases](https://github.com/AemiliusXIV/P5R-Fusion-Planner/releases).

See [docs/how-it-works.md](docs/how-it-works.md) for a full walkthrough, details on what data is read, and a privacy breakdown.

## Credits — Built on the shoulders of giants

**[chinhodado's Persona 5 Calculator](https://github.com/chinhodado/persona5_calculator)** — the fusion engine and game data this project is built on. chinhodado built and has maintained what is genuinely the definitive fusion reference for Persona 5. Accurate fusion logic, meticulously correct data for every persona, skill, and arcana combination across both the original release and Royal. The fusion math is his. The data is his. This project adapts that work and rebuilds the interface with new features on top.

**Original project:** https://github.com/chinhodado/persona5_calculator
**Original live calculator:** https://chinhodado.github.io/persona5_calculator/

chinhodado's calculator in turn credits:
- https://github.com/arantius/persona-fusion-calculator
- https://github.com/Heimdall409/persona4-fusion-calculator
- https://github.com/aqiu384/aqiu384.github.io/tree/master/p5-tool

**[fiber-saveutil](https://github.com/zarroboogs/fiber-saveutil)** by zarroboogs — the companion's save file decryption logic is based on this project. It documents the P5R PC save format and the static AES key Atlus ships with every retail copy of the game.

**[KingdomSaveEditor](https://github.com/Xeeynamo/KingdomSaveEditor)** by Xeeynamo — the persona ID lookup table used by the companion reader is adapted from KHSave.LibPersona5.

## License

The fusion engine and game data adapted from chinhodado/persona5_calculator are used under the **Apache License 2.0**. See [LICENSE](LICENSE) and [NOTICE](NOTICE) for full details and attribution.

New code written for this project (UI components, Fusion Tree planner, Zustand store, PWA configuration) is also released under Apache 2.0.

PERSONA 5 ROYAL is a trademark of Atlus Co., Ltd. SEGA is a registered trademark or trademark of SEGA Corporation. This project is an unofficial fan-made tool and is not affiliated with, endorsed by, or sponsored by Atlus Co., Ltd. or SEGA Corporation. All game content, characters, names, and related assets are the property of their respective owners. No commercial use is intended or made.
