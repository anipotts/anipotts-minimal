# Demo Capture Scripts

Programmatically record project demos from scripted browser flows.

## Requirements
- Node.js
- Playwright (`@playwright/test` already exists in this workspace)
- Optional: `ffmpeg` for GIF/poster generation

## Capture one project
```bash
node scripts/demos/capture-project-demo.mjs anipotts-home
```

## Capture all scenarios
```bash
node scripts/demos/capture-all-demos.mjs
```

## Scenario location
- `scripts/demos/scenarios/<slug>.json`

## Output location
- `apps/www/public/media/demos/<slug>/demo.webm`
- `apps/www/public/media/demos/<slug>/demo.gif` (if ffmpeg exists)
- `apps/www/public/media/demos/<slug>/poster.jpg` (if ffmpeg exists)
- `apps/www/public/media/demos/<slug>/manifest.json`
