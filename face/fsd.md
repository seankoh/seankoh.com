# Functional Specification Document — Version 2

## Purpose

Provide a minimal browser-based Three.js scene that displays an animated 3D face model.

## Functional requirements

- The scene runs locally in Google Chrome or Microsoft Edge.
- Three.js loads the face from the local `welly.glb` asset using `GLTFLoader`.
- The loaded model is uniformly scaled so its largest dimension is **3 scene units**.
- The model is centered in the scene and shifted slightly downward for framing.
- A perspective camera presents the face from a slightly raised position.
- Hemisphere lighting makes the model visible without external lighting assets.
- The avatar sweeps gently left and right continuously.
- Avatar animation continues independently while the user moves the camera.
- A button in the top-right corner pauses the avatar at its current sweep angle and resumes the animation on demand.
- Scrolling the mouse wheel zooms the camera in or out.
- Dragging with the middle mouse button pans the camera and its point of view.
- Dragging with the right mouse button orbits the camera around its current point of view.
- An on-screen graphical legend explains the mouse controls.
- The mouse-control legend can be minimized to a small dot and restored.
- Rendering uses `requestAnimationFrame`, targeting the display refresh rate (approximately 60 FPS on a 60 Hz display).
- A small on-screen counter shows the measured frames per second and updates approximately twice per second.
- The renderer resizes with the browser window and accounts for the device pixel ratio.
- The page polls a local version endpoint and reloads automatically after project file changes.

## Explicitly out of scope

- Jaw geometry or movement
- Six-degree-of-freedom controls or tracking
- AI
- ESP32 integration
- WebSockets

## Files

- `index.html` — page shell, FPS display styling, and automatic reload polling.
- `main.js` — Three.js scene, GLB loading, animation, responsive rendering, and FPS measurement.
- `welly.glb` — 3D face model displayed by the scene.
- `vendor/three.core.js` — locally served Three.js core module used by the runtime module.
- `vendor/three.module.js` — locally served Three.js runtime module.
- `vendor/GLTFLoader.js` — locally served Three.js GLTF loader.
- `utils/BufferGeometryUtils.js` — geometry utilities imported by the GLTF loader.
- `serve.ps1` — dependency-free local web server and version endpoint.

## Running locally

1. From this project folder, run `powershell -ExecutionPolicy Bypass -File .\serve.ps1`.
2. Open `http://localhost:8000` in Chrome or Edge.

The local server also provides `/__version` for automatic live reload.
