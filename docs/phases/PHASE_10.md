# Phase 10 — Optional AI Features (Future, opt-in only)

## Objective
Layer optional, explicitly-triggered AI insights on top of the stable, already-shipped core — never required, never automatic, never in the critical path.

## Features / Tasks (pick individually, not as a bundle)
- "Where did my money go?" — natural-language monthly summary generated from already-computed local aggregates (Reports data), sent to an external LLM API only on explicit user action.
- Unusual spending detection — local statistical logic (e.g., category spend > N standard deviations from trailing average) can actually ship AI-free; only the "explain it in plain language" layer needs a model call.
- Saving suggestions.
- "Can I afford this?" — takes a hypothetical amount + category, checks against remaining budget, answers locally (no AI needed) or with an AI-generated explanation (opt-in).

## Dependencies
Phases 1–9 complete and stable. This phase should not begin until the core app has been in daily real-world use and is trusted.

## Architectural constraints (non-negotiable)
- Isolated to `features/ai-insights`.
- Any API key stored via OS keychain, never plaintext.
- Every AI call is user-initiated (a button press), never background/scheduled.
- The app remains 100% functional with this feature entirely absent/disabled.
- Only already-locally-computed aggregate numbers are sent externally — never raw transaction-level data with notes/merchant text, unless the user explicitly opts into a richer analysis and is told exactly what's being sent.

## Expected output
Optional delight on top of a trustworthy core, never a dependency of it.

## Testing requirements
- Verify the app builds, runs, and passes all Phase 1–9 tests with this feature module entirely removed/disabled.
- Verify exactly what data payload is sent externally matches what's documented and consented to.

## Definition of Done
- [ ] Feature is fully optional and clearly labeled as sending data externally when used.
- [ ] Core app functionality is verified unaffected with the feature off.
- [ ] API key handling reviewed against the security model in `docs/architecture/ARCHITECTURE.md`.
