// Use a direct module URL so the scene also works in browsers without import-map support.
import * as THREE from './vendor/three.module.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe8edf2);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.25, 6);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
document.querySelector('#fallback-face').hidden = true;

const face = new THREE.Group();
scene.add(face);

// BoxGeometry arguments are width, height, and depth.
const head = new THREE.Mesh(
  new THREE.BoxGeometry(2, 3, 2),
  new THREE.MeshStandardMaterial({ color: 0xf2c29b })
);
face.add(head);
const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x5a3b2d });
face.add(new THREE.LineSegments(new THREE.EdgesGeometry(head.geometry), outlineMaterial));

const eyeGeometry = new THREE.CircleGeometry(0.16, 32);
const eyeMaterial = new THREE.MeshBasicMaterial({
  color: 0x1d1d1d,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
});
const frontSurfaceZ = 1; // The front face is at z = depth / 2.

for (const x of [-0.5, 0.5]) {
  const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  eye.position.set(x, 0.35, frontSurfaceZ);
  face.add(eye);
}

const nose = new THREE.Mesh(
  new THREE.CircleGeometry(0.18, 3),
  new THREE.MeshBasicMaterial({ color: 0xd8895f })
);
nose.rotation.z = Math.PI / 2;
nose.position.set(0, -0.05, 1.01);
face.add(nose);
face.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(
  [new THREE.Vector3(0, 0.18, 1.012), new THREE.Vector3(-0.16, -0.09, 1.012), new THREE.Vector3(0.16, -0.09, 1.012)]
), outlineMaterial));

const mouth = new THREE.Mesh(
  new THREE.PlaneGeometry(0.62, 0.1),
  new THREE.MeshBasicMaterial({ color: 0x7a2e2e })
);
mouth.position.set(0, -0.62, 1.01);
face.add(mouth);
face.add(new THREE.LineSegments(new THREE.EdgesGeometry(mouth.geometry), outlineMaterial));

scene.add(new THREE.HemisphereLight(0xffffff, 0x4b5563, 2.5));

const fpsElement = document.querySelector('#fps');
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

  // Sweep the face to reveal both sides while keeping the motion gentle.
  face.rotation.y = Math.sin(now * 0.0012) * 0.45;

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

requestAnimationFrame(animate);

