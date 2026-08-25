// Use a direct module URL so the scene also works in browsers without import-map support.
import * as THREE from './vendor/three.module.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe8edf2);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.25, 6);

const cameraTarget = new THREE.Vector3(0, 0, 0);
const cameraOffset = camera.position.clone().sub(cameraTarget);
const spherical = new THREE.Spherical().setFromVector3(cameraOffset);

function updateCamera() {
  spherical.makeSafe();
  camera.position.copy(cameraTarget).add(cameraOffset.setFromSpherical(spherical));
  camera.lookAt(cameraTarget);
}

updateCamera();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const pointer = { active: false, button: -1, x: 0, y: 0 };

renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());

renderer.domElement.addEventListener('pointerdown', (event) => {
  if (event.button !== 1 && event.button !== 2) return;
  event.preventDefault();
  pointer.active = true;
  pointer.button = event.button;
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  renderer.domElement.setPointerCapture(event.pointerId);
});

renderer.domElement.addEventListener('pointermove', (event) => {
  if (!pointer.active) return;

  const deltaX = event.clientX - pointer.x;
  const deltaY = event.clientY - pointer.y;
  pointer.x = event.clientX;
  pointer.y = event.clientY;

  if (pointer.button === 2) {
    spherical.theta -= deltaX * 0.006;
    spherical.phi -= deltaY * 0.006;
  } else if (pointer.button === 1) {
    const distance = spherical.radius;
    const worldUnitsPerPixel = (2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / window.innerHeight;
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
    cameraTarget.addScaledVector(right, -deltaX * worldUnitsPerPixel);
    cameraTarget.addScaledVector(up, deltaY * worldUnitsPerPixel);
  }

  updateCamera();
});

function endPointer(event) {
  if (!pointer.active || event.button !== pointer.button) return;
  pointer.active = false;
  pointer.button = -1;
  if (renderer.domElement.hasPointerCapture(event.pointerId)) {
    renderer.domElement.releasePointerCapture(event.pointerId);
  }
}

renderer.domElement.addEventListener('pointerup', endPointer);
renderer.domElement.addEventListener('pointercancel', endPointer);

renderer.domElement.addEventListener('wheel', (event) => {
  event.preventDefault();
  spherical.radius = THREE.MathUtils.clamp(spherical.radius * Math.exp(event.deltaY * 0.001), 0.5, 50);
  updateCamera();
}, { passive: false });

const face = new THREE.Group();
scene.add(face);

const loader = new GLTFLoader();
loader.load('./welly.glb', (gltf) => {
  const model = gltf.scene;
  model.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  const initialBounds = new THREE.Box3().setFromObject(model);
  const initialSize = initialBounds.getSize(new THREE.Vector3());
  model.scale.setScalar(3 / Math.max(initialSize.x, initialSize.y, initialSize.z));

  const bounds = new THREE.Box3().setFromObject(model);
  model.position.sub(bounds.getCenter(new THREE.Vector3()));
  model.position.y -= 0.15;
  face.add(model);
}, undefined, (error) => {
  console.error('Could not load welly.glb', error);
});

scene.add(new THREE.HemisphereLight(0xffffff, 0x4b5563, 2.5));

const fpsElement = document.querySelector('#fps');
const sweepToggle = document.querySelector('#sweep-toggle');
let sweepEnabled = true;

sweepToggle.addEventListener('click', () => {
  sweepEnabled = !sweepEnabled;
  sweepToggle.textContent = sweepEnabled ? 'Stop sweep' : 'Resume sweep';
  sweepToggle.setAttribute('aria-pressed', String(!sweepEnabled));
});

let lastFrameTime = performance.now();
let accumulatedTime = 0;
let frameCount = 0;

function animate(now) {
  requestAnimationFrame(animate);

  const elapsed = now - lastFrameTime;
  lastFrameTime = now;
  accumulatedTime += elapsed;
  frameCount += 1;

  if (accumulatedTime >= 500) {
    fpsElement.textContent = `FPS: ${Math.round((frameCount * 1000) / accumulatedTime)}`;
    accumulatedTime = 0;
    frameCount = 0;
  }

  // Animate the avatar independently of the user's camera point of view.
  if (sweepEnabled) {
    face.rotation.y = Math.sin(now * 0.0012) * 0.45;
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

requestAnimationFrame(animate);
