# Detonator Repo Audit Report

**Prepared by:** Dwain Henderson Jr. (Superior Networks LLC) via Manus AI  
**Date:** June 9, 2026  
**Repo:** [SuperiorNetworks/detonator](https://github.com/SuperiorNetworks/detonator)  
**Status:** Pre-fix — changes listed here have NOT yet been applied

---

## Overview

This audit was conducted to assess the current structure of the `detonator` repo before Phase 1 development accelerates toward the July 10, 2026 deadline. The repo contains **two completely separate systems** that are not yet clearly distinguished from each other. This document identifies what is correct, what needs to change, and the specific fixes recommended.

---

## What the Repo Contains Right Now

| System | Location in Repo | What It Is |
|--------|-----------------|-----------|
| **David's PHP Web App** | `web-app/` | The real, working, deployed Sandstorm app at `icssolution.net/Sandstorm` |
| **React Show-Control Editor** | `client/`, `server/`, `package.json`, etc. | A separate browser-based show-control editor (Industrial Dark Console) |
| **ESP32 Firmware** | `firmware/sandstorm-esp32/` | The `.ino` file that runs on the T-Display S3 board |
| **Deployment Docs** | `docs/DEPLOYMENT.md` | Server deployment guide for David's PHP app |

---

## What Is Correct — Do Not Change

| Item | Status |
|------|--------|
| `firmware/sandstorm-esp32/sandstorm_relay_controller.ino` | Correctly placed, WiFi credentials scrubbed, accurate |
| `docs/DEPLOYMENT.md` | Accurate — matches David's actual server setup at icssolution.net |
| Phase 1 Relay Map (R1–R4) in README | Correct — matches firmware relay assignments |
| Engineers table (David / Dwain, locations, roles) | Correct |
| Program links (demolition-derby, detonator, downrange-document) | Correct |
| Git history | All commits intact — David's original upload recoverable at commit `c9c5310` |

---

## Problems Identified

### Problem 1 — Two Apps, No Folder Separation (Most Critical)

Right now, `client/`, `web-app/`, `server/`, `package.json`, and `firmware/` all live at the same level in the repo. There is no clear signal about which system is which or which one a developer should use. If David clones this repo today, it is not obvious that `web-app/` is his live production app and `client/` is the React editor.

**Recommended fix — reorganize into two named subfolders:**

```
detonator/
├── sandstorm-php/          ← rename web-app/ to this
│   ├── api/
│   ├── assets/
│   ├── data/
│   └── index.html
├── detonator-react/        ← move client/, server/, package.json here
│   ├── client/
│   ├── server/
│   └── package.json
├── firmware/
│   └── sandstorm-esp32/
├── docs/
│   └── DEPLOYMENT.md
└── README.md
```

---

### Problem 2 — README Conflates Two Independent Apps

The current README describes the React editor and David's PHP app as if they are one integrated system. They are not — they are two independent apps that share the same relay concept but have different UIs, different stacks, and different data formats.

Specific mismatches in the current README:

| README Claims | Reality |
|--------------|---------|
| "Session save/load — Named sessions stored as JSON on the server" | **David's PHP app only** — the React editor saves to `localStorage`, not a server |
| "Shared start sync — Multiple devices can start the same sequence at the same epoch ms" | **David's PHP app only** — not implemented in the React editor |
| "TFT status display — T-Display S3 screen shows mode, relay states, and countdown" | **Firmware only** — neither browser app controls this directly |

**Recommended fix:** Rewrite the README with two clearly labeled sections — one for `sandstorm-php/` (David's live app) and one for `detonator-react/` (the React editor).

---

### Problem 3 — `data/` Folder Should Not Be in the Repo

`web-app/data/` contains live session data, queue files, and demo audio placeholders. These are **runtime files** — they should be created by the server on first run, not committed to GitHub. Committing them means:

- Every developer who clones the repo gets David's demo session baked in
- Any real session data David saves on his server could accidentally get committed in a future push

**Recommended fix:** Add a `.gitignore` inside `sandstorm-php/data/` that preserves the folder structure but excludes all runtime content:

```
# sandstorm-php/data/.gitignore
*
!.gitignore
```

---

### Problem 4 — No Root `.gitignore`

There is no `.gitignore` at the repo root. This means `node_modules/`, build artifacts, and any future `.env` files with credentials could be committed accidentally.

**Recommended fix:** Add a root `.gitignore` covering both the PHP app and the React app:

```
node_modules/
dist/
.env
*.env.local
sandstorm-php/data/sessions/
sandstorm-php/data/uploads/
sandstorm-php/data/esp_queue/
```

---

### Problem 5 — No Per-App README Files

Neither `web-app/` (David's PHP app) nor `client/` (the React editor) has its own README. This means there is no quick-start guide for either system. David should be able to open `sandstorm-php/README.md` and know exactly how to deploy his app. A new developer should be able to open `detonator-react/README.md` and know how to run the React editor locally.

**Recommended fix:** Add a `README.md` to each app subfolder.

---

## Recommended Fixes — Summary Table

| # | Change | Who Does It | Estimated Effort |
|---|--------|-------------|-----------------|
| 1 | Rename `web-app/` → `sandstorm-php/` and move React files into `detonator-react/` | Dwain / Manus | 10 min |
| 2 | Rewrite root README with two separate app sections | Dwain / Manus | 15 min |
| 3 | Add root `.gitignore` and `sandstorm-php/data/.gitignore` | Dwain / Manus | 5 min |
| 4 | Add `sandstorm-php/README.md` — David's app, his server, his authorship | **David writes, Dwain pushes** | 20 min |
| 5 | Add `detonator-react/README.md` — React editor quick-start | Dwain / Manus | 10 min |

---

## Note for David

Item 4 is the one that should come from you. It is your app, your server (`icssolution.net/Sandstorm`), and your deployment process. Manus can write a draft and you edit it, or you can write it from scratch and Dwain will push it. Either way works.

Also — if you have not already done so, **change your WiFi password**. The original credentials were found in the firmware `.ino` file that was uploaded to this repo and have since been scrubbed. The network name and password are no longer in the repo, but you should rotate the password as a precaution.

---

*This audit was prepared as a pre-fix reference. Once all five changes are applied, this file will be updated to reflect the completed state.*
