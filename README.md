# TicketDocs

**Automated activity tracking and ticket documentation generator for IT support teams.**

TicketDocs monitors your desktop activity, categorizes what you're working on, and generates professional ticket documentation using local AI—so you can focus on solving problems instead of writing about them.

---

## What Is This?

TicketDocs is a desktop app that:
- **Tracks your activity** - Monitors active windows and applications to understand what you're working on
- **Categorizes automatically** - Uses pattern matching to detect ticket systems, development tools, and work contexts
- **Generates documentation** - Transforms your activity timeline into professional ticket resolutions using local LLM (Ollama)
- **Protects privacy** - Sanitizes sensitive data (credit cards, SSNs, API keys) before processing

Built with Tauri + React for a fast, native desktop experience with minimal resource usage.

---

## Why Would You Use This?

**If you're an IT support engineer, DevOps, or SRE:**
- Stop context-switching between fixing issues and documenting what you did
- Generate accurate ticket resolutions based on actual work performed
- Maintain detailed activity logs for audits and retrospectives
- Never forget what you did to solve that weird bug last week

**The problem:** Writing ticket documentation is tedious, interrupts flow state, and is often done from memory (leading to incomplete or inaccurate notes).

**The solution:** TicketDocs runs silently in the background, tracks everything you do, and generates documentation on-demand. You do the work, it writes the docs.

---

## What Would You Use It For?

### Primary Use Cases

**1. Ticket Resolution Documentation**
- Monitor your troubleshooting session (checking logs, running commands, testing fixes)
- Select the relevant activities from your timeline
- Generate a professional resolution note with steps taken and outcome
- Copy to ServiceNow/Jira/your ticket system

**2. Activity Logging for Compliance**
- Automatic tracking of all application and window usage
- Privacy-safe logging (sensitive data sanitized)
- Searchable activity history
- Export activity logs for audits

**3. Time Tracking & Retrospectives**
- See exactly how long you spent on each task
- Review your activity timeline to understand where time went
- Generate summaries of work performed during a sprint/shift

**4. Knowledge Base Creation**
- Turn your problem-solving sessions into reusable documentation
- Build a library of solutions based on real work
- Share resolution patterns with your team

---

## How Would You Use It?

### Setup (First Time)

1. **Install Ollama**
   ```bash
   # macOS
   brew install ollama

   # Start Ollama service
   ollama serve

   # Pull a model (e.g., llama3)
   ollama pull llama3
   ```

2. **Grant Permissions**
   - On macOS: System Settings → Privacy & Security → Screen Recording
   - Enable TicketDocs to monitor window titles and app names

3. **Configure Settings**
   - Set your preferred Ollama model
   - Add app/title patterns for auto-categorization
   - Configure exclusions for personal apps/windows

### Daily Workflow

1. **Start Monitoring**
   - Launch TicketDocs
   - Monitoring starts automatically (runs in system tray)
   - Continue working normally—the app tracks in the background

2. **Work on a Ticket**
   - Open your ticket system (ServiceNow, Jira, etc.)
   - Troubleshoot the issue (check logs, run commands, test fixes)
   - TicketDocs captures all your activity

3. **Generate Documentation**
   - Open TicketDocs timeline view
   - Select activities related to the ticket (drag to select or click individual items)
   - Click "Generate Resolution"
   - Review and edit the AI-generated documentation
   - Copy to your ticket system

4. **Refine Over Time**
   - Add custom patterns to auto-categorize your frequently used tools
   - Build templates for common ticket types
   - Adjust settings to filter out noise (personal browsing, etc.)

### Example Scenario

```
You get a ticket: "Production API returning 500 errors"

1. You investigate:
   - Open CloudWatch logs
   - SSH into production server
   - Check database connections
   - Find a memory leak in a worker process
   - Restart the service
   - Monitor for 30 minutes to confirm fix

2. TicketDocs captures:
   - CloudWatch window (log analysis)
   - Terminal sessions (SSH commands)
   - Database client (connection checks)
   - Service restart commands
   - Monitoring dashboards

3. You generate docs:
   - Select those activities (30-minute window)
   - Click "Generate Resolution"
   - TicketDocs produces:
     "Investigated production API errors via CloudWatch logs.
      Identified memory leak in worker process consuming 8GB RAM.
      Restarted service using systemctl restart api-worker.
      Monitored for 30 minutes post-restart - no further errors.
      Resolution: Memory leak in worker process, restarted service."

4. You copy to ticket, mark resolved, move on.
```

---

## Features

### Core Functionality
- ✅ **Activity Monitoring** - Track active windows, applications, and process paths
- ✅ **Smart Categorization** - Pattern-based auto-detection of ticket systems, dev tools, etc.
- ✅ **Privacy Sanitization** - Automatically removes credit cards, SSNs, API keys from logs
- ✅ **Local LLM Generation** - Uses Ollama (fully private, runs on your machine)
- ✅ **Timeline View** - Visual activity history with filtering and search
- ✅ **Custom Templates** - Define resolution note formats for different ticket types
- ✅ **Settings Management** - Configurable patterns, exclusions, and preferences

### Technical Details
- **Built with:** Tauri (Rust) + React + TypeScript
- **Database:** SQLite (local, encrypted activity storage)
- **LLM:** Ollama integration (llama3, mixtral, or any Ollama-compatible model)
- **Platforms:** macOS (primary), Linux support planned
- **Privacy:** All processing local, no cloud services, sanitized data

---

## Installation

### Prerequisites
- macOS 11+ (Big Sur or later)
- Ollama installed and running
- Screen Recording permission

### Build from Source

```bash
# Clone the repository
git clone https://github.com/samueladad75-byte/TicketDocs.git
cd TicketDocs

# Install dependencies
pnpm install

# Build the app
pnpm tauri build

# Or run in development
pnpm tauri dev
```

The built app will be in `src-tauri/target/release/bundle/`.

### Development Modes (Normal vs Lean)

Use normal mode when you want faster rebuilds and don't mind local build artifacts:

```bash
pnpm tauri dev
```

Use lean mode when disk space is tight:

```bash
pnpm dev:lean
```

`pnpm dev:lean` starts the app with temporary cache paths for Rust (`CARGO_TARGET_DIR`) and Vite (`VITE_CACHE_DIR`). Those temporary artifacts are removed automatically when the process exits.

### Cleanup Commands

Targeted cleanup (heavy build artifacts only, keeps dependencies):

```bash
pnpm clean:heavy
```

Full local cleanup (all reproducible local caches/artifacts, including `node_modules`):

```bash
pnpm clean:local
```

Tradeoff summary:
- **Normal dev (`pnpm tauri dev`)**: uses more disk, starts/rebuilds faster after first run.
- **Lean dev (`pnpm dev:lean`)**: uses less persistent disk, but startup is slower because Rust/Vite caches are rebuilt each run.

---

## Configuration

### Settings Panel

Access via the Settings tab in the app:

- **Ollama Model**: Choose which model to use for generation (llama3, mixtral, etc.)
- **App Context**: Set your primary ticket system (ServiceNow, Jira, etc.)
- **Exclusions**: Apps/windows to ignore (e.g., Slack, personal browsing)
- **Patterns**: Define regex patterns to categorize activities

### Custom Patterns

Add patterns to auto-categorize activities:

```json
{
  "app_pattern": "ServiceNow",
  "title_pattern": "INC\\d+",
  "category": "Incident Management"
}
```

---

## Privacy & Security

- **No telemetry** - Zero data sent to external servers
- **Local processing** - All LLM generation happens on your machine via Ollama
- **Data sanitization** - Credit cards, SSNs, API keys stripped before storage
- **Encrypted storage** - SQLite database stored locally
- **Permission-based** - Only monitors what you explicitly grant access to

---

## Development

### Tech Stack
- **Frontend:** React 18 + TypeScript + Tailwind CSS
- **Backend:** Rust (Tauri)
- **Database:** SQLite with sqlx
- **LLM:** Ollama API integration
- **State:** Zustand stores
- **Testing:** Vitest

### Project Structure
```
TicketDocs/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── hooks/             # Custom React hooks
│   ├── stores/            # Zustand state stores
│   └── lib/               # Utilities and types
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── commands/      # Tauri commands (API)
│   │   ├── db/            # Database layer
│   │   ├── llm/           # LLM integration
│   │   ├── monitor/       # Activity monitoring
│   │   └── pattern/       # Pattern matching
│   └── migrations/        # Database migrations
└── README.md
```

### Running Tests

```bash
# Rust tests
cd src-tauri
cargo test

# TypeScript tests
pnpm test
```

---

## Roadmap

- [ ] Windows/Linux support
- [ ] Browser extension for web-based tracking
- [ ] Team collaboration (shared templates, pattern libraries)
- [ ] Advanced analytics (time spent per category, productivity insights)
- [ ] Export to multiple formats (Markdown, JSON, CSV)
- [ ] Integration plugins (ServiceNow API, Jira API)

---

## Contributing

Contributions welcome! This project follows conventional commits and uses:
- Rust with `cargo fmt` and `clippy`
- TypeScript strict mode
- React functional components only

See issues for planned features and bugs.

---

## License

MIT License - see LICENSE file for details.

---

## Credits

Built by IT support engineers, for IT support engineers who'd rather fix problems than write about fixing problems.

**Stack:**
- [Tauri](https://tauri.app/) - Desktop app framework
- [Ollama](https://ollama.ai/) - Local LLM runtime
- [React](https://react.dev/) - UI framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
