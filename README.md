# UTD InkFormulator Pro

Precision formulation calculators for UT Dots silver nanoparticle inks (SOP F055/F056).
All tabs model the one-pot process — **mix → centrifuge → decant** — where the insoluble
fraction of the nano (default solubility 85%) is removed with the pellet, so recipes hit
the requested final ink mass and concentration after decanting.

**Tabs**: QC Solid · Stock · One Pot · Solvents · Dilution/Conc · Conc To · Solubility

**Preset / Custom** (selector in the header): preset mode drives concentrations and
solvent matrices from the standard UT Dots formulations — solvent systems **IJ**
(4:1 Longifolene : Eucalyptol) and **TE** (1:1 TEB : Eucalyptol), concentrations
27% / 36% / 45%, named UTD25/UTD40/UTD60 per system. Custom mode keeps free entry.
QC Solid is a pure measurement and is unaffected by the selector.

**Stock** sizes a batch from the solute you already have: enter the amount on hand
and a concentration, and it returns the solvent to add and the ink you will end up
with — for using up solute before it ages out.

**Solubility** supports iterative additions: add solute (and solvent) to an existing
ink, re-measure solid content after centrifuge & decant, and solubility is reported
per addition as well as cumulatively. A falling per-addition figure means the solvent
is approaching saturation.

The app is a fully self-contained static site: no internet access needed at runtime
(styling, fonts, and libraries are all bundled).

> **Deploying to the Austin RackStation?** Start with [HANDOFF.md](HANDOFF.md),
> then [DEPLOY_NAS.md](DEPLOY_NAS.md) for the steps.

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
