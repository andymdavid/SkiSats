import { CONFIG } from './config.js';

const worldState = {
  markers: [],
  obstacles: [],
  coins: [],
  initialized: false,
  nextSpawnY: 0,
  nextObstacleY: 0,
  nextCoinY: 0,
};

function randomX() {
  const halfWidth = CONFIG.slopeWidth / 2;
  return (Math.random() * 2 - 1) * halfWidth;
}

function nextSpacing() {
  const variance = 0.6 + Math.random() * 0.8;
  return CONFIG.markerSpacing * variance;
}

function createMarker(y) {
  return { x: randomX(), y };
}

function randomObstacleX() {
  const halfSlope = CONFIG.slopeWidth / 2;
  const { minX, maxX } = CONFIG.obstacles;
  const clampedMin = Math.max(minX, -halfSlope);
  const clampedMax = Math.min(maxX, halfSlope);
  return clampedMin + Math.random() * (clampedMax - clampedMin);
}

function randomCoinX() {
  const halfSlope = CONFIG.slopeWidth / 2;
  const { minX, maxX } = CONFIG.coins;
  const clampedMin = Math.max(minX, -halfSlope);
  const clampedMax = Math.min(maxX, halfSlope);
  return clampedMin + Math.random() * (clampedMax - clampedMin);
}

function getBaseScale(canvasWidth) {
  const unitsToPixels = (canvasWidth / CONFIG.slopeWidth) * 0.5;
  return unitsToPixels * CONFIG.projection.horizontalScale;
}

export function initWorld() {
  worldState.markers = [];
  worldState.obstacles = [];
  worldState.coins = [];
  worldState.nextSpawnY = 0;
  worldState.nextObstacleY = 0;
  worldState.nextCoinY = 0;
  worldState.initialized = true;
}

export function resetWorld(playerDistance = 0) {
  if (!worldState.initialized) {
    initWorld();
  } else {
    worldState.markers.length = 0;
  }

  let markerY = playerDistance;
  const limit = playerDistance + CONFIG.viewDistance;
  while (markerY < limit) {
    markerY += nextSpacing();
    worldState.markers.push(createMarker(markerY));
  }
  worldState.nextSpawnY = markerY;
  worldState.obstacles.length = 0;
  worldState.nextObstacleY = playerDistance + CONFIG.obstacles.spawnInterval;
  worldState.coins.length = 0;
  worldState.nextCoinY = playerDistance + CONFIG.coins.spawnInterval;
}

export function updateWorld(dt, playerDistance) {
  if (!worldState.initialized) {
    resetWorld(playerDistance);
  }

  worldState.markers = worldState.markers.filter((marker) => marker.y >= playerDistance);
  worldState.obstacles = worldState.obstacles.filter((obstacle) => obstacle.y >= playerDistance);
  worldState.coins = worldState.coins.filter((coin) => coin.y >= playerDistance);

  const visibleLimit = playerDistance + CONFIG.viewDistance;
  let spawnY = Math.max(worldState.nextSpawnY, worldState.markers.reduce((max, marker) => Math.max(max, marker.y), playerDistance));

  while (spawnY < visibleLimit) {
    spawnY += nextSpacing();
    worldState.markers.push(createMarker(spawnY));
  }

  worldState.nextSpawnY = spawnY;

  spawnObstacles(playerDistance);
  spawnCoins(playerDistance);
}

function spawnObstacles(playerDistance) {
  const { spawnInterval, probability } = CONFIG.obstacles;
  if (!worldState.nextObstacleY) {
    worldState.nextObstacleY = playerDistance + spawnInterval;
  }

  while (playerDistance >= worldState.nextObstacleY) {
    worldState.nextObstacleY += spawnInterval;
    if (Math.random() < probability) {
      const obstacleY = playerDistance + CONFIG.viewDistance;
      worldState.obstacles.push({ x: randomObstacleX(), y: obstacleY });
    }
  }
}

function spawnCoins(playerDistance) {
  const { spawnInterval, probability } = CONFIG.coins;
  if (!worldState.nextCoinY) {
    worldState.nextCoinY = playerDistance + spawnInterval;
  }

  while (playerDistance >= worldState.nextCoinY) {
    worldState.nextCoinY += spawnInterval;
    if (Math.random() < probability) {
      const coinY = playerDistance + CONFIG.viewDistance;
      worldState.coins.push({ x: randomCoinX(), y: coinY });
    }
  }
}

function projectPoint(entity, playerDistance, canvasWidth, canvasHeight) {
  const depth = entity.y - playerDistance;
  if (depth < 0 || depth > CONFIG.viewDistance) {
    return { visible: false };
  }

  const t = depth / CONFIG.viewDistance;
  const horizonY = canvasHeight * CONFIG.slopeScreen.horizonRatio;
  const bottomY = canvasHeight * CONFIG.slopeScreen.bottomRatio;
  const screenY = bottomY - t * (bottomY - horizonY);

  const widthFactor = 1 - 0.5 * t;
  const centerX = canvasWidth / 2;
  const baseScale = getBaseScale(canvasWidth);
  const screenX = centerX + entity.x * baseScale * widthFactor;

  const scale = 1 - 0.7 * t;

  return {
    visible: true,
    screenX,
    screenY,
    scale,
  };
}

export function renderWorld(ctx, playerDistance, canvasWidth, canvasHeight) {
  const horizonY = canvasHeight * CONFIG.slopeScreen.horizonRatio;
  const bottomY = canvasHeight * CONFIG.slopeScreen.bottomRatio;
  const centerX = canvasWidth / 2;
  const halfSlope = CONFIG.slopeWidth / 2;
  const baseScale = getBaseScale(canvasWidth);
  const widthFactorBottom = 1 - 0.5 * 0;
  const widthFactorTop = 1 - 0.5 * 1;
  const bottomHalfWidth = halfSlope * baseScale * widthFactorBottom;
  const topHalfWidth = halfSlope * baseScale * widthFactorTop;

  ctx.save();
  ctx.fillStyle = '#bfe3ff';
  ctx.fillRect(0, 0, canvasWidth, horizonY);
  ctx.fillStyle = '#f6fbff';
  ctx.fillRect(0, horizonY, canvasWidth, canvasHeight - horizonY);

  ctx.beginPath();
  ctx.moveTo(centerX - topHalfWidth, horizonY);
  ctx.lineTo(centerX + topHalfWidth, horizonY);
  ctx.lineTo(centerX + bottomHalfWidth, bottomY);
  ctx.lineTo(centerX - bottomHalfWidth, bottomY);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  const markers = [...worldState.markers].sort((a, b) => b.y - a.y);
  ctx.fillStyle = '#8a9aac';
  markers.forEach((marker) => {
    const projection = projectPoint(marker, playerDistance, canvasWidth, canvasHeight);
    if (!projection.visible) {
      return;
    }

    const radius = 6 * projection.scale;
    ctx.beginPath();
    ctx.ellipse(
      projection.screenX,
      projection.screenY,
      radius * 0.6,
      radius,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  });

  ctx.restore();
}

export function renderObstacles(ctx, playerDistance, canvasWidth, canvasHeight) {
  const sorted = [...worldState.obstacles].sort((a, b) => b.y - a.y);
  ctx.save();
  ctx.fillStyle = '#5c5c5c';
  sorted.forEach((obstacle) => {
    const projection = projectPoint(obstacle, playerDistance, canvasWidth, canvasHeight);
    if (!projection.visible) {
      return;
    }

    const size = CONFIG.obstacles.size * projection.scale * 1.5;
    ctx.beginPath();
    ctx.rect(projection.screenX - size / 2, projection.screenY - size, size, size);
    ctx.fill();
  });
  ctx.restore();
}

export function renderCoins(ctx, playerDistance, canvasWidth, canvasHeight) {
  const sorted = [...worldState.coins].sort((a, b) => b.y - a.y);
  ctx.save();
  ctx.fillStyle = CONFIG.coins.color;
  sorted.forEach((coin) => {
    const projection = projectPoint(coin, playerDistance, canvasWidth, canvasHeight);
    if (!projection.visible) {
      return;
    }

    const radius = CONFIG.coins.size * projection.scale * 1.5;
    ctx.beginPath();
    ctx.arc(projection.screenX, projection.screenY, radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

export function collectCoinsForPlayer(player) {
  const playerY = player.distance;
  const playerRadius = CONFIG.collisions.playerRadius;
  const coinRadius = CONFIG.coins.collisionRadius;
  const radiusSum = playerRadius + coinRadius;
  const radiusSquared = radiusSum * radiusSum;

  let collected = 0;
  worldState.coins = worldState.coins.filter((coin) => {
    const dx = coin.x - player.x;
    const dy = coin.y - playerY;
    const hit = dx * dx + dy * dy <= radiusSquared;
    if (hit) {
      collected += 1;
      return false;
    }
    return true;
  });

  return collected;
}

export function checkPlayerObstacleCollision(player) {
  const playerY = player.distance;
  const playerRadius = CONFIG.collisions.playerRadius;
  const obstacleRadius = CONFIG.collisions.obstacleRadius;
  const radiusSum = playerRadius + obstacleRadius;
  const radiusSquared = radiusSum * radiusSum;

  return worldState.obstacles.some((obstacle) => {
    const dx = obstacle.x - player.x;
    const dy = obstacle.y - playerY;
    return dx * dx + dy * dy <= radiusSquared;
  });
}

initWorld();
