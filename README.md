# P5R Fusion Planner

A Persona 5 Royal fusion calculator and collection planner built as a modern PWA with a faithful P5 aesthetic.

**Live app:** https://aemiliusxiv.github.io/P5RFusionCalc/

## Features

- **Full fusion calculator**: all 464 Royal personas, binary fusion, same-arcana downrank, rare (Treasure Demon) fusions, and all 24 special multi-ingredient fusions
- **Recursive Fusion Tree**: pick any target persona and see a full ingredient chain down to personas you already own, with swappable recipe alternatives at every node
- **Owned & Wishlist tracking**: mark personas as owned or wishlisted; the fusion tree stops branching at anything you already have
- **Confidant awareness**: personas locked behind Social Link ranks are flagged in the fusion tree so you know what you need before you fuse
- **Skill browser**: searchable list of all 925 skills with element, cost, and which personas learn them
- **DLC toggles**: enable or disable each DLC persona group; the entire fusion engine updates accordingly
- **Import / Export**: save your collection as JSON and reload it across devices
- **PWA**: installable on Android and desktop, works fully offline

## Built on the shoulders of giants

This project would not exist without **[chinhodado's Persona 5 Calculator](https://github.com/chinhodado/persona5_calculator)**.

chinhodado built and has maintained what is genuinely the definitive fusion reference for Persona 5. Accurate fusion logic, meticulously correct data for every persona, skill, and arcana combination across both the original release and Royal. It's a project that the Persona community has relied on for years, and that reliability comes from real care and attention to detail. If you haven't seen the original, it's well worth a visit.

This project adapts chinhodado's fusion engine and game data (licensed Apache 2.0) and rebuilds the interface as a React PWA with new features on top. The fusion math is his. The data is his. The years of keeping it accurate and up to date are his. The new UI, Fusion Tree planner, Owned/Wishlist system, and PWA packaging are built on that foundation, and that foundation is solid.

**Original project:** https://github.com/chinhodado/persona5_calculator
**Original live calculator:** https://chinhodado.github.io/persona5_calculator/

chinhodado's calculator also credits its own upstream sources:
- https://github.com/arantius/persona-fusion-calculator
- https://github.com/Heimdall409/persona4-fusion-calculator
- https://github.com/aqiu384/aqiu384.github.io/tree/master/p5-tool

## Companion: save reader

A small Windows app that reads your P5R PC save file and imports your owned personas into the planner automatically. No manual marking needed.

Download the `.exe` from [Releases](https://github.com/AemiliusXIV/P5RFusionCalc/releases).

See [docs/how-it-works.md](docs/how-it-works.md) for a full walkthrough, details on what data is read, and a privacy breakdown.

## License

The fusion engine and game data adapted from chinhodado/persona5_calculator are used under the **Apache License 2.0**. See [LICENSE](LICENSE) and [NOTICE](NOTICE) for full details and attribution.

New code written for this project (UI components, Fusion Tree planner, Zustand store, PWA configuration) is also released under Apache 2.0.

Persona 5 Royal is a trademark of Atlus / Sega. This is a fan-made tool with no commercial purpose.
