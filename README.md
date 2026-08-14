# Personal Finance Manager (Desktop)

A simple, fast, privacy-first, offline-first personal finance manager for Windows desktop, built with **Tauri 2 + React + TypeScript + SQLite**.

This repository is currently in the **planning/documentation phase**. No application code has been written yet. This is intentional — see `MASTER_PROMPT.md` for why.

## Why this app exists

Answer six questions, fast, without sending your financial data anywhere:

1. How much money did I earn this month?
2. Where did my money go?
3. How much have I saved?
4. How much money is remaining?
5. Am I overspending?
6. Can I stay within my monthly budget?

## Core principles

- **Local-first.** Your data lives in a SQLite file on your machine. No account, no cloud, no sync required.
- **Fast daily entry.** Adding an expense should take ~10 seconds.
- **Simple over feature-rich.** Every feature must solve a real money-management problem.
- **Beautiful but not bloated.** A modern glass/futuristic dashboard aesthetic with smooth animation — but it never gets in the way of speed.

## Tech stack

| Layer | Choice |
|---|---|
| Shell | Tauri 2 (Rust) |
| UI | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Animation | Framer Motion |
| Database | SQLite (via `tauri-plugin-sql`) |
| State | Zustand |
| Forms/validation | React Hook Form + Zod |

See `docs/architecture/ARCHITECTURE.md` for the full rationale.

## Where to start reading

| If you want to... | Read |
|---|---|
| Understand the product | `docs/product/PRD.md` |
| Give Claude Code full context in one shot | `MASTER_PROMPT.md` |
| Set persistent rules for Claude Code in this repo | `CLAUDE.md` |
| See what gets built, in what order | `ROADMAP.md` and `docs/phases/` |
| Understand the database | `docs/database/SCHEMA.md` |
| Understand the visual design language | `docs/ui-ux/DESIGN_SYSTEM.md` |

## Project status

📋 **Phase 0 — Product Planning** (this documentation set)

## License

TBD by owner before public release (see `docs/release/RELEASE_PROCESS.md`).
