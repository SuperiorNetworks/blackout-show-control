# DETONATOR React Editor

**Stack:** React 19 + TypeScript + Tailwind 4 + shadcn/ui + Vite  
**Status:** Development — simulation-first, no live relay connection yet  
**Part of:** [Demolition Derby](https://github.com/SuperiorNetworks/demolition-derby) — Phase 1

---

## What This Is

DETONATOR React is a browser-based show-control editor for planning and simulating relay-triggered structural collapse sequences. It is a companion tool to David's Sandstorm PHP app — they share the same relay concept but are independent applications with different stacks and different data formats.

**This editor is simulation-first.** It is designed for Dwain to plan sequences, test timing, and visualize the 3×2 Iron District city grid before any physical relay fires. It does not connect to the ESP32 or the Sandstorm server in its current state.

---

## Features

| Tab | What It Does |
|-----|-------------|
| **Project** | Name the project, set team info, configure the 6-structure city grid |
| **Timeline** | Build a cue timeline with relay trigger markers and audio sync |
| **Visuals** | Manage visual cue states and color assignments per structure |
| **Cameras** | Reference camera positions (overhead, street, interior) |
| **Relay Test** | Simulate relay fire sequences with LED grid feedback |
| **Live Control** | Placeholder for future Sandstorm server integration |
| **Logs** | Event log of all simulated actions |
| **Simulation** | 3×2 Iron District city grid with staged collapse animations |

---

## Running Locally

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Install and Start

```bash
cd detonator-react
pnpm install
pnpm dev
```

The app will start at `http://localhost:3000`.

### Build for Production

```bash
pnpm build
```

Output goes to `dist/`.

---

## Project Structure

```
detonator-react/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   └── Editor.tsx          ← Main 8-tab editor shell
│   │   ├── components/
│   │   │   └── tabs/               ← One component per tab
│   │   │       ├── ProjectTab.tsx
│   │   │       ├── TimelineTab.tsx
│   │   │       ├── VisualsTab.tsx
│   │   │       ├── CamerasTab.tsx
│   │   │       ├── RelayTestTab.tsx
│   │   │       ├── LiveControlTab.tsx
│   │   │       ├── LogsTab.tsx
│   │   │       └── SimulationTab.tsx
│   │   ├── contexts/
│   │   │   └── ThemeContext.tsx     ← Dark/Light palette toggle
│   │   └── index.css               ← Industrial Dark Console design tokens
│   └── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Design System

The editor uses the **Industrial Dark Console** palette by default, with a toggle to **Outdoor Sunlight** mode for use in bright field conditions.

Design tokens are defined in `client/src/index.css`. The palette toggle is managed by `ThemeContext`.

---

## Data Persistence

All project data is saved to `localStorage` in the browser. There is no server dependency. Use the **Project** tab to save, load, and create new sessions by name.

---

## Phase 1 Relay Map

| Relay | Assignment |
|-------|-----------|
| R1 | Channel 1 |
| R2 | Channel 2 |
| R3 | Channel 3 |
| R4 | Channel 4 |

*Phase 1 uses 4 channels. The simulation supports up to 16.*

---

## Related

- **David's PHP app:** [`../sandstorm-php/`](../sandstorm-php/) — the live production relay server
- **Firmware:** [`../firmware/sandstorm-esp32/`](../firmware/sandstorm-esp32/) — ESP32 T-Display S3 relay controller
- **Master project:** [demolition-derby](https://github.com/SuperiorNetworks/demolition-derby)
