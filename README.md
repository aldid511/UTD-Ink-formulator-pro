# UTD InkFormulator Pro

Precision formulation calculators for UT Dots silver nanoparticle inks (SOP F055/F056).
All tabs model the one-pot process — **mix → centrifuge → decant** — where the insoluble
fraction of the nano (default solubility 85%) is removed with the pellet, so recipes hit
the requested final ink mass and concentration after decanting.

**Tabs**: One Pot · Solvents · Dilution/Conc · Conc To · QC Solid · Solubility

The app is a fully self-contained static site: no internet access needed at runtime
(styling, fonts, and libraries are all bundled).

## Run locally

Prerequisites: Node.js 20+

```
npm install
npm run dev        # dev server at http://localhost:3000
```

## Deploy

- **Austin RackStation (primary)** — see [DEPLOY_NAS.md](DEPLOY_NAS.md): copy
  [`dist/`](dist) to the `websites` share, deploy the Portainer stack, app at
  port 8081. No build tools needed on the NAS.
- **Cloud Run** — `gcloud run deploy utd-inkformulator-pro --source . --region us-west1`
  (uses the [Dockerfile](Dockerfile)).
- **Windows desktop (portable exe)** — `npm run electron:build` → `dist_electron/`.

## Build from source

```
npm ci
npm run build      # regenerates dist/
```
