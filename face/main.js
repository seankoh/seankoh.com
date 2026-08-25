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

const cameraTarget = new THREE.Vector3(0, 0, 0);
const orbit = {
  radius: camera.position.distanceTo(cameraTarget),
  azimuth: 0,
  elevation: Math.asin((camera.position.y - cameraTarget.y) / camera.position.distanceTo(cameraTarget)),
};
let pointerDrag = null;

function updateCameraPosition() {
  const horizontalRadius = orbit.radius * Math.cos(orbit.elevation);
  camera.position.set(
    cameraTarget.x + horizontalRadius * Math.sin(orbit.azimuth),
    cameraTarget.y + orbit.radius * Math.sin(orbit.elevation),
    cameraTarget.z + horizontalRadius * Math.cos(orbit.azimuth)
  );
  camera.lookAt(cameraTarget);
}

renderer.domElement.addEventListener('pointerdown', (event) => {
  if (event.button !== 1 && event.button !== 2) return;
  event.preventDefault();
  pointerDrag = {
    x: event.clientX,
    y: event.clientY,
    mode: event.button === 1 ? 'pan' : 'orbit',
  };
  renderer.domElement.setPointerCapture(event.pointerId);
  renderer.domElement.style.cursor = event.button === 1 ? 'move' : 'grabbing';
});

renderer.domElement.addEventListener('pointermove', (event) => {
  if (!pointerDrag) return;
  const deltaX = event.clientX - pointerDrag.x;
  const deltaY = event.clientY - pointerDrag.y;
  pointerDrag.x = event.clientX;
  pointerDrag.y = event.clientY;

  if (pointerDrag.mode === 'orbit') {
    orbit.azimuth -= deltaX * 0.008;
    orbit.elevation = THREE.MathUtils.clamp(orbit.elevation + deltaY * 0.008, -1.35, 1.35);
  } else {
    const distanceScale = orbit.radius * 0.0015;
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
    cameraTarget.addScaledVector(right, -deltaX * distanceScale);
    cameraTarget.addScaledVector(up, deltaY * distanceScale);
  }
  updateCameraPosition();
});

function releasePointer(event) {
  pointerDrag = null;
  if (renderer.domElement.hasPointerCapture(event.pointerId)) {
    renderer.domElement.releasePointerCapture(event.pointerId);
  }
  renderer.domElement.style.cursor = 'default';
}

renderer.domElement.addEventListener('pointerup', releasePointer);
renderer.domElement.addEventListener('pointercancel', releasePointer);
renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());
renderer.domElement.addEventListener('wheel', (event) => {
  event.preventDefault();
  orbit.radius = THREE.MathUtils.clamp(orbit.radius * Math.exp(event.deltaY * 0.001), 2.5, 15);
  updateCameraPosition();
}, { passive: false });
renderer.domElement.style.cursor = 'default';
renderer.domElement.style.touchAction = 'none';

const face = new THREE.Group();
scene.add(face);

let activeModel = face;
let uploadedModel = null;
let animationMixer = null;
let previousAnimationTime = performance.now();
let sweepEnabled = false;
let sweepPhase = 0;

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

const modelSelect = document.querySelector('#model-select');
const glbInput = document.querySelector('#glb-input');
const modelStatus = document.querySelector('#model-status');
const sweepToggle = document.querySelector('#sweep-toggle');
const mouseLegend = document.querySelector('#mouse-legend');
const legendToggle = document.querySelector('#legend-toggle');
let gltfLoader = null;

async function refreshModelOptions() {
  try {
    const response = await fetch('./models.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const models = await response.json();
    const uploadOption = modelSelect.querySelector('option[value="upload"]');

    for (const model of models) {
      const option = document.createElement('option');
      option.value = model.url;
      option.textContent = model.name;
      modelSelect.insertBefore(option, uploadOption);
    }
  } catch (error) {
    console.error('Could not discover GLB models.', error);
  }
}

refreshModelOptions();

legendToggle.addEventListener('click', () => {
  const collapsed = mouseLegend.classList.toggle('collapsed');
  legendToggle.textContent = collapsed ? '' : '−';
  legendToggle.setAttribute('aria-label', collapsed ? 'Show mouse controls' : 'Minimize mouse controls');
  legendToggle.setAttribute('aria-expanded', String(!collapsed));
});

sweepToggle.addEventListener('click', () => {
  sweepEnabled = !sweepEnabled;
  sweepToggle.textContent = sweepEnabled ? 'Stop sweep' : 'Start sweep';
  sweepToggle.setAttribute('aria-pressed', String(sweepEnabled));
});

function showGeneratedFace() {
  face.visible = true;
  if (uploadedModel) uploadedModel.visible = false;
  activeModel = face;
  modelStatus.textContent = 'Generated face box';
}

function disposeModel(model) {
  model.traverse((object) => {
    if (!object.isMesh) return;
    object.geometry?.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material) continue;
      for (const value of Object.values(material)) {
        if (value?.isTexture) value.dispose();
      }
      material.dispose();
    }
  });
  scene.remove(model);
}

function fitModelToView(model) {
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  if (bounds.isEmpty()) throw new Error('The GLB does not contain visible geometry.');

  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = 3 / Math.max(size.x, size.y, size.z);
  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
}

async function loadGlb(source, label, selectedValue, revokeObjectUrl = false) {
  if (!gltfLoader) {
    modelStatus.textContent = 'Loading GLB support…';
    try {
      const { GLTFLoader } = await import('https://unpkg.com/three@0.180.0/examples/jsm/loaders/GLTFLoader.js');
      gltfLoader = new GLTFLoader();
    } catch (error) {
      modelSelect.value = 'generated';
      showGeneratedFace();
      modelStatus.textContent = 'GLB loader could not be downloaded';
      console.error(error);
      return;
    }
  }

  modelStatus.textContent = `Loading ${label}…`;

  gltfLoader.load(source, (gltf) => {
    if (revokeObjectUrl) URL.revokeObjectURL(source);
    try {
      fitModelToView(gltf.scene);
      if (uploadedModel) disposeModel(uploadedModel);
      uploadedModel = gltf.scene;
      scene.add(uploadedModel);
      face.visible = false;
      activeModel = uploadedModel;

      animationMixer = gltf.animations.length ? new THREE.AnimationMixer(uploadedModel) : null;
      if (animationMixer) animationMixer.clipAction(gltf.animations[0]).play();

      if (selectedValue === 'uploaded') {
        let uploadedOption = modelSelect.querySelector('option[value="uploaded"]');
        if (!uploadedOption) {
          uploadedOption = document.createElement('option');
          uploadedOption.value = 'uploaded';
          modelSelect.insertBefore(uploadedOption, modelSelect.lastElementChild);
        }
        uploadedOption.textContent = label;
      }
      modelSelect.value = selectedValue;
      modelStatus.textContent = label;
    } catch (error) {
      modelSelect.value = 'generated';
      showGeneratedFace();
      modelStatus.textContent = error.message;
    }
  }, undefined, (error) => {
    if (revokeObjectUrl) URL.revokeObjectURL(source);
    modelSelect.value = 'generated';
    showGeneratedFace();
    modelStatus.textContent = `Could not load ${label}`;
    console.error(error);
  });
}

modelSelect.addEventListener('change', () => {
  if (modelSelect.value === 'generated') {
    showGeneratedFace();
  } else if (modelSelect.value === 'uploaded' && uploadedModel) {
    face.visible = false;
    uploadedModel.visible = true;
    activeModel = uploadedModel;
    modelStatus.textContent = modelSelect.selectedOptions[0].textContent;
  } else if (modelSelect.value === 'upload') {
    modelSelect.value = uploadedModel ? 'uploaded' : 'generated';
    glbInput.click();
  } else {
    const option = modelSelect.selectedOptions[0];
    loadGlb(modelSelect.value, option.textContent, modelSelect.value);
  }
});

glbInput.addEventListener('change', () => {
  const [file] = glbInput.files;
  if (file) {
    const objectUrl = URL.createObjectURL(file);
    loadGlb(objectUrl, file.name, 'uploaded', true);
  }
  glbInput.value = '';
});

const fpsElement = document.querySelector('#fps');
let lastFrameTime = performance.now();
let accumulatedTime = 0;
let frameCount = 0;

function animate(now) {
  const elapsed = now - lastFrameTime;
  lastFrameTime = now;
  accumulatedTime += elapsed;
  frameCount += 1;

  if (accumulatedTime >= 500) {
    fpsElement.textContent = `FPS: ${Math.round((frameCount * 1000) / accumulatedTime)}`;
    accumulatedTime = 0;
    frameCount = 0;
  }

  const animationDelta = Math.min((now - previousAnimationTime) / 1000, 0.1);
  previousAnimationTime = now;
  animationMixer?.update(animationDelta);

  if (sweepEnabled) {
    sweepPhase += animationDelta * 1.2;
    activeModel.rotation.y = Math.sin(sweepPhase) * 0.45;
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setAnimationLoop(animate);

