# Sandstorm — PHP Relay Timeline Server

**Author:** David (Detroit, MI) — Firmware & Systems Engineer  
**Status:** Production — deployed at [icssolution.net/Sandstorm](https://icssolution.net/Sandstorm)  
**Part of:** [Demolition Derby](https://github.com/SuperiorNetworks/demolition-derby) — Phase 1

---

## What This Is

Sandstorm is a browser-based relay timeline controller. It runs on a PHP web server and communicates with an ESP32 T-Display S3 board via cloud polling. The browser never talks directly to the ESP32 — instead it writes commands to the server queue, and the ESP32 polls the server every second to pick them up.

This design solves a real constraint: the deployed server is HTTPS, and browsers block HTTPS pages from posting directly to local HTTP devices. Cloud polling sidesteps that entirely.

---

## Architecture

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

## Server Files

```
sandstorm-php/
├── index.html              ← Main browser UI
├── assets/
│   ├── app.js              ← Frontend JavaScript
│   └── style.css           ← Styles
├── api/
│   ├── common.php          ← Shared config and helpers
│   ├── audio.php           ← Audio file metadata
│   ├── clear_queue.php     ← Flush ESP queue for a device
│   ├── control.php         ← Relay control state
│   ├── esp_queue.php       ← Queue read/write for ESP polling
│   ├── live_payload.php    ← Live timeline payload delivery
│   ├── load.php            ← Load saved session
│   ├── load_waveform.php   ← Load waveform data
│   ├── manual_relay.php    ← Manual relay on/off commands
│   ├── save.php            ← Save session to disk
│   ├── save_waveform.php   ← Save waveform data
│   └── upload_audio.php    ← Audio file upload handler
└── data/                   ← Runtime data (not committed to git)
    ├── sessions/           ← Named session JSON files
    ├── uploads/            ← Uploaded audio files
    └── esp_queue/          ← Per-device queue payloads
```

---

## Deployment

### Fresh Server Install

1. Upload the contents of this folder to your server:
   ```
   https://icssolution.net/Sandstorm/
   ```

2. Make these folders writable by PHP:
   ```
   data/
   data/sessions/
   data/uploads/
   data/esp_queue/
   ```

3. Hard refresh the browser after upload:
   ```
   Ctrl + F5
   ```

### Useful Test URLs

```
# Check what is queued for the T-Display
https://icssolution.net/Sandstorm/api/esp_queue.php?device=tdisplay1

# Clear the queue for the T-Display
https://icssolution.net/Sandstorm/api/clear_queue.php?device=tdisplay1
```

---

## Live Control — Important Notes

When using Live Control in the browser, use the **device name only**:

```
tdisplay1
```

Do **not** use the local IP address:

```
10.0.0.54       ← WRONG — browser will block this
http://10.0.0.54 ← WRONG — mixed content error
```

**Reason:** The server is HTTPS. Browsers block HTTPS pages from posting directly to local HTTP ESP devices. The cloud-poll architecture routes all commands through the server.

---

## Live Control Workflow

1. Open the Sandstorm page in the browser.
2. Live Control should show `tdisplay1` in the device list.
3. Click **Send Live Timeline**.
4. Device status should update to `Queued for tdisplay1`.
5. The T-Display S3 polls the server and picks up the command within 1 second.

---

## Phase 1 Relay Map

| Relay | Assignment | Structure |
|-------|-----------|-----------|
| R1 | Channel 1 | TBD by Dwain |
| R2 | Channel 2 | TBD by Dwain |
| R3 | Channel 3 | TBD by Dwain |
| R4 | Channel 4 | TBD by Dwain |

*Phase 1 uses 4 channels. Phase 2 expands to 16 channels via I/O expander.*

---

## Related

- **Firmware:** [`../firmware/sandstorm-esp32/`](../firmware/sandstorm-esp32/) — ESP32 T-Display S3 relay controller
- **Updated firmware (V1):** [`../sandstorm-v2/`](../sandstorm-v2/) — David's Version 1.0 upload (June 2026)
- **React editor:** [`../detonator-react/`](../detonator-react/) — companion show-control editor
- **Master project:** [demolition-derby](https://github.com/SuperiorNetworks/demolition-derby)

---

*This README was drafted by Dwain (Manus AI) based on David's deployment notes. David — please review and update with anything I missed.*
