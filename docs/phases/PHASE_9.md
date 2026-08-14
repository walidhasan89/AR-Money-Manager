# Phase 9 — GitHub / Public Release

## Objective
Package and publish the MVP as a public, installable Windows application.

## Features / Tasks
- Public-facing root `README.md` finalized per `docs/release/RELEASE_PROCESS.md` requirements (screenshot/GIF of the glass dashboard, privacy statement, download link).
- `CONTRIBUTING.md` finalized.
- License chosen and added.
- `tauri build` producing a signed-or-documented-as-unsigned Windows installer.
- GitHub Release `v1.0.0` published with installer + checksum + changelog.
- Repo hygiene pass: issue templates (optional), clear folder structure, no leftover dev artifacts committed.

## Dependencies
Phase 8 complete.

## Expected output
Anyone can find the repo, understand what it is and that it's private/local, download the installer, and run it on Windows with no setup beyond the installer.

## Testing requirements
- Clean-machine install test (no dev tools) per `RELEASE_PROCESS.md` checklist.
- Verify installer checksum matches published value.

## Definition of Done
- [ ] `v1.0.0` tagged and released on GitHub with working installer download.
- [ ] Public README accurately represents the shipped feature set (no aspirational claims about unshipped AI features).
- [ ] Fresh install → first run → core flows all verified on a clean Windows environment.
