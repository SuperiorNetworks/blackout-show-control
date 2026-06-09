# DETONATOR

**Browser-based relay show-control system for Demolition Derby**  
**Team:** David (Detroit, MI) · Dwain (Dayton, OH)  
**Phase 1 Deadline:** July 10, 2026 — live 4-channel relay fire over the internet

> Part of the [Demolition Derby](https://github.com/SuperiorNetworks/demolition-derby) project suite.

---

## What Is In This Repo

This repo contains **two independent applications** and the **ESP32 firmware** that connects them to the physical relay board. They share the same relay concept but are built with different stacks and serve different purposes.

| Folder | What It Is | Status |
|--------|-----------|--------|
| [`sandstorm-php/`](sandstorm-php/) | David's PHP relay timeline server | **Production** — live at icssolution.net/Sandstorm |
| [`sandstorm-v2/`](sandstorm-v2/) | David's Version 1.0 update package (June 2026) | Pending deployment |
| [`detonator-react/`](detonator-react/) | React show-control editor (simulation-first) | Development |
| [`firmware/sandstorm-esp32/`](firmware/sandstorm-esp32/) | ESP32 T-Display S3 relay controller | Deployed on board |

---

## App 1 — Sandstorm PHP Server (David's App)

**Location:** [`sandstorm-php/`](sandstorm-php/)  
**Author:** David — Firmware & Systems Engineer, Detroit MI  
**Live URL:** [icssolution.net/Sandstorm](https://icssolution.net/Sandstorm)

Sandstorm is a PHP web app that accepts relay timeline commands from the browser and queues them for the ESP32 to pick up. The ESP32 polls the server every second — this cloud-poll design avoids the HTTPS/HTTP mixed-content problem that would occur if the browser tried to POST directly to the local ESP32.

**Quick start:** See [`sandstorm-php/README.md`](sandstorm-php/README.md) for full deployment instructions.

### How It Works

```
Browser (HTTPS)
    ↓ POST to api/esp_queue.php
icssolution.net/Sandstorm (PHP server)
    ↑ GET api/esp_queue.php?device=tdisplay1
T-Display S3 (ESP32, polls every 1 second)
    ↓ activates relay pins
Physical relay board → structures
```

---

## App 2 — DETONATOR React Editor

**Location:** [`detonator-react/`](detonator-react/)  
**Author:** Dwain — Research, Documentation & Safety Lead, Dayton OH  
**Stack:** React 19 + TypeScript + Tailwind 4 + shadcn/ui + Vite

The DETONATOR React editor is a simulation-first show-control tool for planning relay sequences, visualizing the 3×2 Iron District city grid, and testing timing before any physical relay fires. It saves all data to `localStorage` — no server required.

**Quick start:** See [`detonator-react/README.md`](detonator-react/README.md) for local dev setup.

### Tabs

| Tab | Purpose |
|-----|---------|
| Project | Name the project, configure the 6-structure city grid |
| Timeline | Build cue timeline with relay trigger markers and audio sync |
| Visuals | Manage visual cue states per structure |
| Cameras | Reference camera positions |
| Relay Test | Simulate relay fire sequences with LED grid feedback |
| Live Control | Future Sandstorm server integration |
| Logs | Event log of all simulated actions |
| Simulation | 3×2 city grid with staged collapse animations |

---

## Firmware

**Location:** [`firmware/sandstorm-esp32/`](firmware/sandstorm-esp32/)

The ESP32 T-Display S3 firmware polls the Sandstorm server every second and activates relay pins based on the queued timeline. WiFi credentials are **not** stored in the repo — edit the constants at the top of the `.ino` file before flashing:

```cpp
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";
const char* DEVICE_NAME = "tdisplay1";
```

David's Version 1.0 firmware update is in [`sandstorm-v2/Relay Controller/`](sandstorm-v2/Relay%20Controller/).

---

## Phase 1 Relay Map

| Relay | Channel | Assignment |
|-------|---------|-----------|
| R1 | 1 | TBD |
| R2 | 2 | TBD |
| R3 | 3 | TBD |
| R4 | 4 | TBD |

*Phase 1 uses 4 channels. Phase 2 expands to 16 via I/O expander (MCP23017 or PCF8575).*

---

## Team

| Name | Location | Role |
|------|---------|------|
| **David** | Detroit, MI | Firmware & Systems Engineer — ESP32 programming, relay logic, hardware board architecture, Sandstorm app development |
| **Dwain** | Dayton, OH | Research, Documentation & Safety Lead — project organization, build replication, testing, safety officer |

---

## Project Suite

| Repo | Purpose |
|------|---------|
| [demolition-derby](https://github.com/SuperiorNetworks/demolition-derby) | Master hub — full project plan, Gantt, budget, phase gates, board design |
| [detonator](https://github.com/SuperiorNetworks/detonator) | This repo — browser show-control editor + PHP server + firmware |
| [downrange-document](https://github.com/SuperiorNetworks/downrange-document) | Sensor analytics + Blender pipeline |

---

## Safety

This project uses **non-energetic mechanical alternatives** for all physical testing. No explosive recipes, ignition circuits, or pyrotechnic modification instructions are included anywhere in this codebase. All relay outputs are tested with safe consumer-grade mechanical loads before any field deployment.

See [demolition-derby/README.md](https://github.com/SuperiorNetworks/demolition-derby) for the full safety section.

---

## Repo Audit

A structural audit of this repo was completed on June 9, 2026. See [`docs/REPO-AUDIT.md`](docs/REPO-AUDIT.md) for the full report, including what was changed and why.
