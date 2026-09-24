# Deploying UTD InkFormulator Pro on the Austin RackStation (RS1221RP-EIAUS)

Deployment target is the **web sandbox** set up 2026-08-04 (see the sandbox
design doc): site files live on the **`websites`** shared folder, and the app
runs as an nginx container created through **Portainer**. Web Station is *not*
used — installing DSM packages is outside the sandbox ground rules.

The app itself is a **fully static, self-contained web app** — everything it
needs is in this repo's [`dist/`](dist) folder. No internet access is required
at runtime. (Only exception: the optional background-music button in the header
streams from YouTube and silently does nothing on a LAN-only network.)

## Prerequisites

- The `ei-web-aleksey` DSM and Portainer accounts (see the handoff doc —
  **change both passwords first if you haven't**; that doc was sent with
  passwords in plaintext and must never be committed to this repo).
- Access to the Austin LAN (`192.168.1.111`) or the electroninks tailnet
  (`100.91.87.103` — substitute it in every URL below when remote).

## Step 1 — copy the app to the websites share

Mount the share over SMB (Windows: map `\\192.168.1.111\websites` as a network
drive; macOS: ⌘K → `smb://192.168.1.111/websites`), then copy this repo's
`dist` folder so you end up with:

```
websites/inkformulator/dist/index.html
websites/inkformulator/dist/assets/index-*.js
websites/inkformulator/dist/assets/index-*.css
```

(File Station at `http://192.168.1.111:5000` works too for one-off uploads.)

## Step 2 — create the Portainer stack

1. Portainer: `http://192.168.1.111:9000`, log in as `ei-web-aleksey`.
2. **Stacks → Add stack**, name it `inkformulator`.
3. Paste the contents of [docker-compose.yml](docker-compose.yml) into the web
   editor and **Deploy the stack**. Portainer pulls `nginx:alpine` (~4 MB).

The compose file binds `/volume1/websites/inkformulator/dist` read-only into
the container and publishes port **8081** (inside the 8080–8099 range reserved
for this sandbox). It follows the sandbox ground rules: no host paths outside
`/volume1/websites`, no `--privileged`.

## Step 3 — open the app

- Austin LAN: **http://192.168.1.111:8081**
- Tailnet: **http://100.91.87.103:8081**

Update the InkFormulator link in SOP F056 (step PRE-2) to this address when
retiring the Cloud Run URL.

## Updating to a new version

Replace the contents of `websites/inkformulator/dist/` with the new `dist/`
from this repo. The bind mount is live — no container restart needed. Users may
need a hard refresh (Ctrl+F5) to drop cached assets.

## Notes

- **Do not** bind ports outside 8080–8099. In particular 80/443/5000/5001
  (DSM), 9000/9443 (Portainer), and 5566 (replication) are taken.
- **Backups**: the `websites` folder replicates offsite nightly at 01:10 with
  30-day immutable snapshots, so the deployed app is covered — but the source
  of truth is this git repo.
- **App type** (for IT review): single-page static app, prebuilt React. No
  server-side code, no external calls at runtime, nothing stored on the NAS;
  all calculations run in the browser.
- **Rebuilding from source**: `npm ci && npm run build` (Node 20+) regenerates
  `dist/`. Not needed for deployment — `dist/` in this repo is the release
  build (tagged, e.g. `v1.0.3`).
