# TicketDocumentation

[![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)](#) [![Rust](https://img.shields.io/badge/Rust-dea584?style=flat-square&logo=rust&logoColor=white)](#) [![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](#)

> You fix the problem. TicketDocs writes the resolution note — based on what you actually did, not what you remember doing

TicketDocumentation monitors your desktop activity, categorizes what you're working on, and generates professional ticket documentation using a local LLM via Ollama. No cloud. Sensitive data (credit cards, SSNs, API keys) is sanitized before processing. Built with Tauri + React for a fast, native desktop experience with minimal resource usage.

## Features

- **Activity monitoring** — tracks active windows and applications in real time to build a timeline of what you worked on
- **Automatic categorization** — pattern matching detects ticket systems, development tools, log viewers, and work contexts without any manual tagging
- **Local LLM generation** — transforms your activity timeline into a professional ticket resolution using Ollama; no API key, no upload, no token cost
- **Privacy-first** — credit cards, SSNs, and API keys are scrubbed from activity data before it reaches the LLM
- **Timeline selection** — choose which activities to include; exclude unrelated windows before generating the note
- **Audit-ready logs** — activity logs are stored in SQLite for retrospectives, audits, and "what did I do last Tuesday" lookups

## Quick Start

### Prerequisites

- macOS (primary target; Windows/Linux planned)
- Node.js 18+
- Rust stable toolchain (via [rustup](https://rustup.rs))
- [Ollama](https://ollama.com) running locally
  ```bash
  ollama pull llama3.2
  ```

### Installation

```bash
git clone https://github.com/saagpatel/TicketDocumentation.git
cd TicketDocumentation
pnpm install
```

### Usage

```bash
# Start Ollama (if not already running)
ollama serve

# Development mode
pnpm tauri dev

# Run tests
pnpm test

# Production build
pnpm tauri build
```

Grant Accessibility permission when prompted on first launch — macOS requires this for active window monitoring.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop shell | Tauri 2 |
| Frontend | React 18, TypeScript, Tailwind CSS |
| State | Zustand |
| Backend | Rust (activity monitoring, pattern matching) |
| Database | SQLite via sqlx |
| LLM | Ollama API (local inference) |
| Tests | Vitest |

## Architecture

The Rust backend runs two independent loops: an activity monitor that polls the macOS Accessibility API for the frontmost window and application name, and a pattern matcher that classifies each window into a work category. Both write to SQLite via sqlx with async transactions. The LLM pipeline is invoked on demand — the frontend sends a slice of the activity log to a Tauri command, the Rust backend sanitizes the data, builds a structured prompt, and streams the Ollama response back via Tauri events. The frontend never has direct access to raw activity data.

## License

MIT
