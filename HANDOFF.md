# Handoff — UTD InkFormulator Pro → Austin RackStation

**To:** Michael Bell
**From:** Aleksey Didenko
**Repo:** https://github.com/ElectroninksInc/UTDInkFormulatorPro
**Version:** v1.0.3

## What this is

An internal web calculator used during silver ink synthesis (SOP F056). It sizes
nano and solvent charges so that after mix → centrifuge → decant the ink lands on
the requested mass and concentration. R&D currently reaches it at a Google Cloud
Run URL; the goal is to move it in-house onto the Austin RackStation web sandbox
and retire the cloud instance.

## What it needs from the NAS

Almost nothing — it is a **static site**. The prebuilt app is committed in
[`dist/`](dist) (~305 KB, three files).

| | |
|---|---|
| Runtime | nginx serving static files |
| Server-side code | None |
| Database | None |
| Secrets / env vars | None |
| Internet access at runtime | None¹ |
| Build tools on the NAS | None |
| DSM packages to install | None |
| Persistent storage | None (nothing is written) |

¹ One exception: an optional background-music button in the header points at
YouTube. It silently does nothing on a LAN-only network; everything else is local.

## Deployment

Full instructions: **[DEPLOY_NAS.md](DEPLOY_NAS.md)**. In short:

1. Copy this repo's `dist/` folder to `/volume1/websites/inkformulator/dist`
   (over SMB as `\\192.168.1.111\websites\inkformulator\`).
2. Portainer → Stacks → Add stack → paste [docker-compose.yml](docker-compose.yml)
   → Deploy. It pulls `nginx:alpine` (~4 MB).
3. Verify at **http://192.168.1.111:8081** (tailnet: `http://100.91.87.103:8081`).

I have the `ei-web-aleksey` DSM and Portainer accounts and can do steps 1–2
myself if you'd rather just review — your call.

## How it sits against the sandbox ground rules

Written deliberately to stay inside the sandbox boundaries from your
2026-08-04 design doc:

- **Port 8081** — inside the reserved 8080–8099 range; avoids 80/443/5000/5001
  (DSM), 9000/9443 (Portainer), 5566 (replication).
- **Bind mount is `/volume1/websites/inkformulator/dist`, mounted read-only**
  (`:ro`) — no host paths outside the `websites` share.
- **No `--privileged`**, no extra capabilities, no host networking, no access to
  the Docker socket.
- **No DSM-level changes** — no packages, services, or scheduled tasks. (This is
  why the deploy uses a container rather than Web Station, which would have
  required installing a package.)
- Content lives on `websites`, so it inherits the nightly 01:10 offsite
  replication and 30-day immutable snapshots already in place.

## Updating later

Replace the files in `websites/inkformulator/dist/`. The bind mount is live, so
no container restart is needed — users may just need Ctrl+F5. Releases are
tagged in the repo (`v1.0.3`), and `npm ci && npm run build` on Node 20+
reproduces `dist/` byte-for-byte if you ever want to verify the artifact.

## What I need back

The final URL, so I can update the InkFormulator link in SOP F056 (step PRE-2)
and we can retire the Cloud Run service.

## Note unrelated to this app

The 2026-08-04 design doc flagged that DSM email notifications are disabled, so
a failed replication task or degraded drive would go unannounced. Flagging it
here only because it seemed more consequential than this deployment.
