import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
import { isLeftPressed, isRightPressed } from './input.js';

let renderer;
let scene;
let camera;
let containerElement;
let slopeGroup;
let playerMesh;
let rendererConfig = {
  xScale: 1,
  depthScale: 1,
  viewDistance: 200,
  behindDistance: 10,
  cameraHeight: 70,
  cameraOffsetZ: 120,
  cameraLookForward: 80,
};
const obstacleMeshes = [];
const coinMeshes = [];

function createGroundPlane() {
  const geometry = new THREE.PlaneGeometry(2000, 2000, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0xf8fbff });
  const ground = new THREE.Mesh(geometry, material);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  return ground;
}

function createPlayerMesh() {
  const group = new THREE.Group();
  const bodyGroup = new THREE.Group();

  // Head
  const headGeometry = new THREE.SphereGeometry(2.5, 16, 16);
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffe0bd });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 14;
  bodyGroup.add(head);

  // Helmet/goggles accent
  const helmetGeometry = new THREE.SphereGeometry(2.7, 16, 16);
  const helmetMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
  const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
  helmet.position.y = 14.5;
  helmet.scale.y = 0.6;
  bodyGroup.add(helmet);

  // Torso (jacket)
  const torsoGeometry = new THREE.BoxGeometry(4, 7, 3);
  const torsoMaterial = new THREE.MeshStandardMaterial({ color: 0x4a90e2 });
  const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
  torso.position.y = 9;
  bodyGroup.add(torso);

  // Left arm
  const armGeometry = new THREE.CapsuleGeometry(0.8, 6, 4, 8);
  const armMaterial = new THREE.MeshStandardMaterial({ color: 0x4a90e2 });
  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(-3, 9, 0);
  leftArm.rotation.z = Math.PI / 6;
  bodyGroup.add(leftArm);

  // Right arm
  const rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(3, 9, 0);
  rightArm.rotation.z = -Math.PI / 6;
  bodyGroup.add(rightArm);

  // Legs/pants
  const legGeometry = new THREE.CapsuleGeometry(1.2, 6, 4, 8);
  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });
  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(-1.3, 4.5, 0);
  bodyGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
  rightLeg.position.set(1.3, 4.5, 0);
  bodyGroup.add(rightLeg);

  // Left ski pole
  const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 12, 8);
  const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const leftPole = new THREE.Mesh(poleGeometry, poleMaterial);
  leftPole.position.set(-4.5, 8, 2);
  leftPole.rotation.x = Math.PI / 8;
  bodyGroup.add(leftPole);

  // Right ski pole
  const rightPole = new THREE.Mesh(poleGeometry, poleMaterial);
  rightPole.position.set(4.5, 8, 2);
  rightPole.rotation.x = Math.PI / 8;
  bodyGroup.add(rightPole);

  group.add(bodyGroup);

  // Left ski
  const skiGeometry = new THREE.BoxGeometry(1.5, 0.4, 10);
  const skiMaterial = new THREE.MeshStandardMaterial({ color: 0xff4444 });
  const leftSki = new THREE.Mesh(skiGeometry, skiMaterial);
  leftSki.position.set(-1.3, 0.8, 0);
  group.add(leftSki);

  // Right ski
  const rightSki = new THREE.Mesh(skiGeometry, skiMaterial);
  rightSki.position.set(1.3, 0.8, 0);
  group.add(rightSki);

  // Store references for animation
  group.userData.bodyGroup = bodyGroup;
  group.userData.leftSki = leftSki;
  group.userData.rightSki = rightSki;

  group.position.y = 0;
  return group;
}

function createObstacleMesh() {
  const group = new THREE.Group();

  const trunkGeometry = new THREE.CylinderGeometry(2.66, 2.66, 16, 6);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, flatShading: true });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 8;
  group.add(trunk);

  const foliageGeometry = new THREE.ConeGeometry(13.33, 32, 6);
  const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x1f8a4b, flatShading: true });
  const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
  foliage.position.y = 32;
  group.add(foliage);

  group.visible = false;
  return group;
}

function createCoinMesh() {
  const group = new THREE.Group();

  // Main coin body with beveled edge
  const coinGeometry = new THREE.CylinderGeometry(3, 3, 0.6, 32);
  const coinMaterial = new THREE.MeshStandardMaterial({
    color: 0xffc233,
    metalness: 0.8,
    roughness: 0.2
  });
  const coinBody = new THREE.Mesh(coinGeometry, coinMaterial);
  coinBody.rotation.x = Math.PI / 2;
  group.add(coinBody);

  // Coin rim/edge (darker)
  const rimGeometry = new THREE.CylinderGeometry(3.1, 3.1, 0.5, 32);
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4a017,
    metalness: 0.9,
    roughness: 0.4
  });
  const rim = new THREE.Mesh(rimGeometry, rimMaterial);
  rim.rotation.x = Math.PI / 2;
  rim.scale.set(1, 1, 1);
  group.add(rim);

  // Create Bitcoin "₿" symbol as flat embossed geometry
  const symbolMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4a017,
    metalness: 0.9,
    roughness: 0.3
  });

  // Front face symbol
  const symbolFront = createBitcoinSymbol(symbolMaterial);
  symbolFront.position.z = 0.35;
  group.add(symbolFront);

  // Back face symbol
  const symbolBack = createBitcoinSymbol(symbolMaterial);
  symbolBack.position.z = -0.35;
  symbolBack.rotation.y = Math.PI;
  group.add(symbolBack);

  group.visible = false;
  group.userData.spinSpeed = 2 + Math.random() * 1.5;
  group.userData.bounceOffset = Math.random() * Math.PI * 2;

  return group;
}

function createBitcoinSymbol(material) {
  const symbolGroup = new THREE.Group();

  // Create a flatter, more coin-like "B" with stripes through it
  // Vertical stripes of the B
  const stripe1Geometry = new THREE.BoxGeometry(0.3, 3.5, 0.15);
  const stripe1 = new THREE.Mesh(stripe1Geometry, material);
  stripe1.position.set(-0.6, 0, 0);
  symbolGroup.add(stripe1);

  const stripe2Geometry = new THREE.BoxGeometry(0.3, 3.5, 0.15);
  const stripe2 = new THREE.Mesh(stripe2Geometry, material);
  stripe2.position.set(0.6, 0, 0);
  symbolGroup.add(stripe2);

  // Top arc of B
  const arcTop = new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.25, 8, 16, Math.PI),
    material
  );
  arcTop.rotation.z = -Math.PI / 2;
  arcTop.position.set(0.1, 0.9, 0);
  symbolGroup.add(arcTop);

  // Bottom arc of B
  const arcBottom = new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.25, 8, 16, Math.PI),
    material
  );
  arcBottom.rotation.z = -Math.PI / 2;
  arcBottom.position.set(0.1, -0.9, 0);
  symbolGroup.add(arcBottom);

  // Vertical bar of B
  const barGeometry = new THREE.BoxGeometry(0.35, 4, 0.15);
  const bar = new THREE.Mesh(barGeometry, material);
  bar.position.set(-0.3, 0, 0);
  symbolGroup.add(bar);

  return symbolGroup;
}

function getOrCreateObstacleMesh(index) {
  if (!slopeGroup) {
    return null;
  }
  if (!obstacleMeshes[index]) {
    const mesh = createObstacleMesh();
    obstacleMeshes[index] = mesh;
    slopeGroup.add(mesh);
  }
  return obstacleMeshes[index];
}

function getOrCreateCoinMesh(index) {
  if (!slopeGroup) {
    return null;
  }
  if (!coinMeshes[index]) {
    const mesh = createCoinMesh();
    coinMeshes[index] = mesh;
    slopeGroup.add(mesh);
  }
  return coinMeshes[index];
}

export function init3DRenderer(container, config = {}) {
  if (!container) {
    console.warn('3D renderer container missing.');
    return;
  }

  containerElement = container;
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  rendererConfig = {
    xScale: config?.render3d?.xScale ?? 1.1,
    depthScale: config?.render3d?.depthScale ?? 0.2,
    viewDistance: config?.render3d?.viewDistance ?? config?.viewDistance ?? 220,
    behindDistance: config?.render3d?.behindDistance ?? 20,
    cameraHeight: config?.render3d?.cameraHeight ?? 70,
    cameraOffsetZ: config?.render3d?.cameraOffsetZ ?? 130,
    cameraLookForward: config?.render3d?.cameraLookForward ?? 85,
  };

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87cefa);
  scene.fog = new THREE.Fog(0x87cefa, 80, 380);

  slopeGroup = new THREE.Group();
  const slopeAngleRad = THREE.MathUtils.degToRad(config?.slope?.angleDeg ?? 12);
  slopeGroup.rotation.x = -slopeAngleRad;
  scene.add(slopeGroup);

  camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1500);
  camera.position.set(0, 50, 120);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  renderer = new THREE.WebGLRenderer({ antialias: false });
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height);
  renderer.setClearColor(0x87cefa, 1);

  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.95);
  directionalLight.position.set(50, 100, 40);
  scene.add(directionalLight);

  const ground = createGroundPlane();
  slopeGroup.add(ground);

  playerMesh = createPlayerMesh();
  slopeGroup.add(playerMesh);

  return {
    renderer,
    scene,
    camera,
    container: containerElement,
  };
}

export function resize3DRenderer(width, height) {
  if (!renderer || !camera) {
    return;
  }
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

export function render3DFrame() {
  if (!renderer || !scene || !camera) {
    return;
  }
  renderer.render(scene, camera);
}

export function updatePlayer3D(player) {
  if (!playerMesh || !player) {
    return;
  }
  playerMesh.position.x = player.x * rendererConfig.xScale;
  playerMesh.position.z = 0;

  // Calculate lean based on input
  let targetLean = 0;
  if (isLeftPressed()) {
    targetLean = 0.35;
  } else if (isRightPressed()) {
    targetLean = -0.35;
  }

  // Smooth lean transition
  const leanSpeed = 8;
  const currentLean = playerMesh.rotation.z || 0;
  playerMesh.rotation.z = currentLean + (targetLean - currentLean) * 0.15;

  // Lean the body more dramatically
  if (playerMesh.userData.bodyGroup) {
    playerMesh.userData.bodyGroup.rotation.z = playerMesh.rotation.z * 1.5;
  }

  // Tilt skis to show edge control
  if (playerMesh.userData.leftSki && playerMesh.userData.rightSki) {
    const skiTilt = playerMesh.rotation.z * 2;
    playerMesh.userData.leftSki.rotation.x = skiTilt;
    playerMesh.userData.rightSki.rotation.x = skiTilt;
  }
}

export function updateCamera3D(/* player */) {
  if (!camera || !playerMesh) {
    return;
  }
  camera.position.x = playerMesh.position.x;
  camera.position.y = playerMesh.position.y + rendererConfig.cameraHeight;
  camera.position.z = playerMesh.position.z + rendererConfig.cameraOffsetZ;
  camera.lookAt(
    playerMesh.position.x,
    playerMesh.position.y,
    playerMesh.position.z - rendererConfig.cameraLookForward,
  );
}

export function updateObstacles3D(obstacles = [], playerDistance = 0) {
  if (!obstacles) {
    obstacles = [];
  }
  obstacles.forEach((obstacle, index) => {
    const mesh = getOrCreateObstacleMesh(index);
    if (!mesh) {
      return;
    }
    const depth = obstacle.y - playerDistance;
    if (depth < -rendererConfig.behindDistance || depth > rendererConfig.viewDistance) {
      mesh.visible = false;
      return;
    }
    mesh.position.x = obstacle.x * rendererConfig.xScale;
    mesh.position.z = -depth * rendererConfig.depthScale;
    mesh.position.y = 0;
    mesh.visible = true;
  });

  for (let i = obstacles.length; i < obstacleMeshes.length; i += 1) {
    if (obstacleMeshes[i]) {
      obstacleMeshes[i].visible = false;
    }
  }
}

export function updateCoins3D(coins = [], playerDistance = 0) {
  if (!coins) {
    coins = [];
  }
  const time = Date.now() * 0.001; // Convert to seconds

  coins.forEach((coin, index) => {
    const mesh = getOrCreateCoinMesh(index);
    if (!mesh) {
      return;
    }
    const depth = coin.y - playerDistance;
    if (depth < -rendererConfig.behindDistance || depth > rendererConfig.viewDistance) {
      mesh.visible = false;
      return;
    }

    // Base position
    mesh.position.x = coin.x * rendererConfig.xScale;
    mesh.position.z = -depth * rendererConfig.depthScale;

    // Higher off ground + subtle bouncing animation
    const baseHeight = 8;
    const bounceHeight = 1.5;
    const bounceSpeed = 2.5;
    const bounce = Math.sin(time * bounceSpeed + mesh.userData.bounceOffset) * bounceHeight;
    mesh.position.y = baseHeight + bounce;

    // Spinning animation
    mesh.rotation.y = time * mesh.userData.spinSpeed;

    mesh.visible = true;
  });

  for (let i = coins.length; i < coinMeshes.length; i += 1) {
    if (coinMeshes[i]) {
      coinMeshes[i].visible = false;
    }
  }
}
