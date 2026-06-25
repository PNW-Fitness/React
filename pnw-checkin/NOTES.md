# PNW Fitness Guest Check-In App — Architecture Notes

## What This Is
A standalone desktop app for PNW Fitness (independent gym) that replaces a paper-based guest check-in process. Staff use it to capture a guest's ID photo, collect a signed liability waiver, and generate a PDF per guest. The PDF is saved to a local folder that OneDrive syncs automatically.

**Target hardware:** Microsoft Surface Go 2, 4 GB RAM, Windows 11

## Key Architecture Decisions

### Tauri 2, not Electron
The Surface Go 2 only has 4 GB of RAM. Electron bundles its own Chromium instance (~150 MB just for the renderer process), which would compete with the app's own memory needs. Tauri uses the system-installed WebView2 (already present on all Windows 11 machines), so the renderer overhead is near zero. Tauri apps also produce much smaller installer binaries.

### No Microsoft Graph API
OneDrive sync is handled entirely by the OneDrive desktop client running on the Surface. The app simply writes PDF files into a designated local folder (e.g. `C:\Users\...\OneDrive\PNW Fitness\Waivers\`). OneDrive picks them up and syncs to the cloud on its own schedule — no OAuth, no Graph API calls, no internet dependency at write time.

### JavaScript, not TypeScript
Chosen to keep the project approachable for future maintainers who may not be familiar with TypeScript. The project is small enough that TypeScript's benefits don't outweigh the added complexity.

### PDF generation: pdf-lib
`pdf-lib` runs entirely in the browser/WebView context (no server needed), has no native dependencies, and can embed images and draw signature paths directly. It will be used to compose the final per-guest PDF from the captured ID photo and drawn signature.

## Stack
| Layer | Choice |
|---|---|
| Desktop shell | Tauri 2 |
| Frontend | React 19 (Vite) |
| Language | JavaScript (JSX) |
| Package manager | npm |
| PDF generation | pdf-lib (to be added) |
| File export | Tauri `fs` plugin writing to a configurable local OneDrive folder |

## Folder Structure (src/)
```
src/
  components/
    IdCapture/       # Camera capture of guest ID photo
    SignaturePad/    # Touch/mouse signature drawing canvas
  lib/
    pdfGenerator/    # Composes captured photo + signature into a PDF via pdf-lib
    fileExport/      # Writes the completed PDF to the configured local folder path
  App.jsx
  main.jsx
```

## What Has NOT Been Implemented Yet
- ID photo capture (camera/file input)
- Signature pad canvas
- PDF generation logic
- File export / folder path configuration
- Any UI beyond the default Tauri+React scaffold

Features are being added one at a time after each scaffold review.
