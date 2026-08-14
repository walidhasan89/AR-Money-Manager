# Release Process

## Versioning

Semantic Versioning (`MAJOR.MINOR.PATCH`):
- `0.x.y` while pre-MVP/MVP is being built (breaking schema/UX changes expected).
- `1.0.0` = first complete MVP (Phases 1–8 done) considered "daily-driveable."
- `MINOR` = new feature (e.g., PDF export, AI insights).
- `PATCH` = bug fix, no new feature.

## GitHub Releases

- Each release is tagged (`v1.0.0`) and published as a GitHub Release with:
  - Changelog excerpt for that version (from `CHANGELOG.md`).
  - Windows installer (`.msi` and/or `.exe` via Tauri bundler) attached as a binary asset.
  - SHA-256 checksum of the installer listed in the release notes.

## Windows builds

- Built via `tauri build` targeting `x86_64-pc-windows-msvc`.
- Code signing: not required for MVP (self-published GitHub tool); revisit if distribution grows (unsigned installers trigger Windows SmartScreen warnings — acceptable tradeoff for v1, documented in README so users aren't alarmed).

## Installer strategy

- Tauri's built-in bundler produces the Windows installer directly — no separate installer framework needed.
- Installer includes: app binary, first-run creates the app-data directory and initializes a fresh SQLite DB with seed categories.

## Release checklist

1. All tests pass (`docs/testing/TESTING_STRATEGY.md`).
2. Manual smoke test on a clean Windows machine/VM: install → first run → add income → add expense → set budget → view dashboard → backup → restore → uninstall cleanly.
3. `CHANGELOG.md` updated, "Unreleased" section rolled into the new version heading.
4. Version bumped in `package.json` / `tauri.conf.json` / `Cargo.toml`.
5. Tag pushed, GitHub Release drafted with installer + checksum + changelog excerpt.
6. Public README (root `README.md`) reviewed for accuracy against the actual shipped feature set.

## Changelog process

`CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/) format: `Added` / `Changed` / `Fixed` / `Removed` under each version, with an always-current `Unreleased` section at the top that PRs append to.

## Public GitHub README requirements (for public release, Phase 9)

- What the app does, in 2–3 sentences, above the fold.
- Screenshot/GIF of the dashboard (glass/futuristic UI is a differentiator — show it).
- Download link to the latest Windows Release.
- Explicit privacy statement: local-only, no account, no telemetry.
- Build-from-source instructions for contributors.
- License.
