# RLM v4 GUI - Web Visualizer

Next.js Web GUI for **RLM v4** with Self-Verification, Session Management, and Real-time Progress Tracking.

Built with [shadcn/ui](https://ui.shadcn.com) and Next.js 16.

## Features

### v4.0 Features
- **Self-Verification UI** - Visualize verification status, confidence scores, and attempts
- **Live Session Management** - Create and manage persistent REPL sessions
- **Real-time Progress Tracking** - Watch completions as they happen
- **Confidence Scoring** - Visual confidence indicators (High/Medium/Low)
- **Stats Dashboard** - Global and session-specific verification statistics
- **Context Versioning** - Browse context history for each session

### Original Features
- **Log File Upload** - Upload and visualize RLM execution traces
- **Iteration Timeline** - Step through each RLM iteration
- **Code Block Visualization** - Syntax highlighted code with execution results
- **Dark/Light Theme** - Full theme support

## Getting Started

### Prerequisites
- Node.js 18+
- RLM v4 Server running (default: `http://localhost:5006`)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the GUI.

### Production Build

```bash
npm run build
npm start
```

## Configuration

Set the RLM v4 server URL via environment variable:

```bash
RLM_V4_URL=http://localhost:5006 npm run dev
```

Or create a `.env.local` file:
```
RLM_V4_URL=http://localhost:5006
```

## API Endpoints

The GUI connects to the RLM v4 MCP Server on port 5006:

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Server health check |
| `GET/POST /sessions` | Session management |
| `POST /sessions/:id/complete` | Run completion |
| `GET /sessions/:id/progress` | Real-time progress |
| `GET /verification/stats` | Global verification stats |
| `POST /tools/rlm_completion_verified` | Verified completion |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     RLM v4 GUI (Next.js)                         │
│                      localhost:3000                              │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard                                                       │
│  ├── Log Files Tab (original feature)                           │
│  ├── Live Sessions Tab (v4)                                     │
│  └── Stats Tab (v4)                                             │
├─────────────────────────────────────────────────────────────────┤
│  Components                                                      │
│  ├── SessionManager - Create/manage sessions                    │
│  ├── LiveCompletionPanel - Prompt input with verification       │
│  ├── ProgressTracker - Real-time progress display               │
│  ├── VerificationPanel - Verification status & attempts         │
│  ├── ConfidenceDisplay - Confidence indicators                  │
│  └── StatsDashboard - Verification statistics                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 RLM v4 MCP Server (Flask)                        │
│                      localhost:5006                              │
├─────────────────────────────────────────────────────────────────┤
│  Self-Verification | Sessions | Graphiti | Memclawz             │
└─────────────────────────────────────────────────────────────────┘
```

## Development

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main dashboard
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── Dashboard.tsx      # Main dashboard
│   ├── LogViewer.tsx      # Log file viewer
│   ├── SessionManager.tsx # Session management (v4)
│   ├── LiveCompletionPanel.tsx # Live completion (v4)
│   ├── VerificationPanel.tsx   # Verification UI (v4)
│   ├── ProgressTracker.tsx     # Progress tracking (v4)
│   ├── ConfidenceDisplay.tsx   # Confidence indicators (v4)
│   └── StatsDashboard.tsx      # Stats dashboard (v4)
└── lib/
    ├── api.ts             # RLM v4 API client
    ├── types.ts           # TypeScript types
    ├── parse-logs.ts      # Log file parser
    └── hooks/             # React hooks
        ├── useSession.ts
        ├── useCompletion.ts
        └── useStats.ts
```

## License

MIT

---

**Part of the RLM v4 Ecosystem** - [github.com/haddock-development/rlm_v4](https://github.com/haddock-development/rlm_v4)
