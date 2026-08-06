# Deploying UTD InkFormulator Pro on the Synology RS1221RP+

The app is a **fully static, self-contained web app**. Everything it needs is in the
[`dist/`](dist) folder of this repository — no internet access, database, or build
tools are required on the NAS. (Only exception: the optional background-music button
in the header streams from YouTube and will do nothing on a LAN-only network.)

There are two ways to host it. **Method A (Web Station) is the simplest** and uses
DSM's built-in web server. Method B (Container Manager / Docker) isolates the app in
a container and is preferable if the `web` share is already used for something else.

---

## Method A — Web Station (recommended)

1. **Install Web Station**: DSM → Package Center → search "Web Station" → Install.
   When prompted for a back-end, install **nginx** (Apache also works).
   Installing Web Station creates a shared folder named **`web`** on volume 1.
2. **Copy the app**: create a folder `inkformulator` inside the `web` share and copy
   the **contents of `dist/`** into it (via File Station drag-and-drop, or over SMB:
   `\\<NAS-IP>\web\inkformulator\`). You should end up with:
   ```
   /volume1/web/inkformulator/index.html
   /volume1/web/inkformulator/assets/index-*.js
   /volume1/web/inkformulator/assets/index-*.css
   ```
3. **Open the app**: browse to `http://<NAS-IP>/inkformulator/`
   The app uses relative asset paths, so it works from any subfolder without
   further Web Station configuration.
4. *(Optional)* **Friendly URL / HTTPS**: DSM → Control Panel → Login Portal →
   Advanced → Reverse Proxy lets you map e.g. `https://ink.yourdomain.local` to the
   folder above. Not required for LAN use.

**Updating to a new version**: replace the contents of `web/inkformulator/` with the
new `dist/` contents. Users may need a hard refresh (Ctrl+F5).

---

## Method B — Container Manager (Docker)

Works on the RS1221RP+ (AMD Ryzen V1500B, x86_64 — standard `linux/amd64` images run natively).

1. **Install Container Manager**: DSM → Package Center → "Container Manager" → Install
   (this creates the `docker` shared folder).
2. **Copy this repository folder** (at minimum `docker-compose.yml` and `dist/`) to
   `/volume1/docker/inkformulator/` (File Station or SMB).
3. **Create the project**: Container Manager → Project → Create →
   - Project name: `inkformulator`
   - Path: `/volume1/docker/inkformulator`
   - Source: *Use existing docker-compose.yml*
   → Next → Done. Container Manager pulls `nginx:alpine` (~4 MB) and starts the app.
   - *If the NAS has no internet access*: on any machine with Docker run
     `docker pull nginx:alpine && docker save nginx:alpine -o nginx-alpine.tar`,
     copy the tar to the NAS, and import it via Container Manager → Image → Add →
     From File before creating the project.
4. **Open the app**: `http://<NAS-IP>:8080/`
   To use a different port, change the left-hand side of `"8080:80"` in
   `docker-compose.yml`.
5. If DSM's firewall is enabled, allow the chosen port: Control Panel → Security →
   Firewall → Edit Rules.

**Updating to a new version**: replace the `dist/` folder and restart the project
(Container Manager → Project → `inkformulator` → Action → Restart). The container
serves the folder read-only, so a restart is only needed to clear nginx's file cache.

---

## Notes for IT

- **App type**: single-page static app (React, prebuilt). No server-side code, no
  external calls at runtime, no data leaves the browser. Recipes are computed
  client-side; nothing is stored on the NAS.
- **Browser support**: any modern Chromium/Firefox/Edge. No IE.
- **Printing**: recipe cards print via the browser; the print stylesheet is
  black-on-white regardless of theme.
- **Source & rebuild**: `npm ci && npm run build` regenerates `dist/` from source
  (Node 20+). Not needed for deployment — `dist/` in this repo is the release build.
- **Versioning**: this repo tags releases (`v1.0.0`, ...). The version deployed to
  the NAS is whatever `dist/` contents you copy; check the git tag you cloned.
