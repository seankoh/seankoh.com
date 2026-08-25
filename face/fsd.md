# Functional Specification Document â€” Version 1

## Purpose

Provide a minimal browser-based Three.js scene that displays an animated, outlined 3D face.

## Functional requirements

- The scene runs locally in Google Chrome or Microsoft Edge.
- Three.js renders a cuboid head with dimensions: width **2**, depth **2**, height **3**.
- The raised camera provides a slight view of the head's top surface.
- Exactly two flat circular eye dots appear on the cuboid's front face with doubled horizontal spacing.
- A triangular nose and rectangular mouth appear on the front face.
- Dark outlines improve visibility around the head, nose, and mouth.
- The face sweeps gently left and right continuously.
- Rendering uses `requestAnimationFrame`, targeting the display refresh rate (approximately 60 FPS on a 60 Hz display).
- A small on-screen counter shows the measured frames per second.
- The page polls a local version endpoint and reloads automatically after project file changes.

## Explicitly out of scope

- Jaw geometry or movement
- Six-degree-of-freedom controls or tracking
- AI
- ESP32 integration
- WebSockets

## Files

- `vendor/three.core.js` - locally served Three.js core module.

- `index.html` â€” page shell, import map, and FPS display styling.
- `main.js` â€” Three.js scene, head, eyes, continuous rendering, and FPS measurement.
- `vendor/three.module.js` â€” locally served Three.js runtime module.
- `serve.ps1` â€” dependency-free local web server.

## Running locally

1. From this project folder, run `powershell -ExecutionPolicy Bypass -File .\\serve.ps1`.
2. Open `http://localhost:8000` in Chrome or Edge.

The local server also provides `/__version` for automatic live reload.

