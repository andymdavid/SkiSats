import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

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

  const bodyGeometry = new THREE.CapsuleGeometry(3, 8, 4, 8);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xf25f5c });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 5;
  group.add(body);

  const headGeometry = new THREE.SphereGeometry(3, 16, 16);
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffe0bd });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 10;
  group.add(head);

  const skiGeometry = new THREE.BoxGeometry(12, 0.6, 2);
  const skiMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const skis = new THREE.Mesh(skiGeometry, skiMaterial);
  skis.position.y = 1;
  group.add(skis);

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
  const geometry = new THREE.CylinderGeometry(2.2, 2.2, 0.8, 16);
  const material = new THREE.MeshStandardMaterial({ color: 0xf4b942, metalness: 0.1, roughness: 0.6 });
  const coin = new THREE.Mesh(geometry, material);
  coin.rotation.x = Math.PI / 2;
  coin.visible = false;
  return coin;
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
    mesh.position.x = coin.x * rendererConfig.xScale;
    mesh.position.z = -depth * rendererConfig.depthScale;
    mesh.position.y = 3;
    mesh.visible = true;
  });

  for (let i = coins.length; i < coinMeshes.length; i += 1) {
    if (coinMeshes[i]) {
      coinMeshes[i].visible = false;
    }
  }
}
