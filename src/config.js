export const CONFIG = {
  canvasId: 'game-canvas',
  backgroundColor: '#0f2a3d',
  slopeWidth: 120,
  playerBaseSpeed: 18,
  playerHorizontalSpeed: 7,
  viewDistance: 250,
  projection: {
    horizontalScale: 1.25,
    verticalScale: 1.1,
  },
  slopeScreen: {
    horizonRatio: 0.25,
    bottomRatio: 0.92,
  },
  markerSpacing: 20,
  obstacles: {
    spawnInterval: 30,
    probability: 0.55,
    minX: -50,
    maxX: 50,
    size: 6,
  },
  coins: {
    spawnInterval: 40,
    probability: 0.5,
    minX: -45,
    maxX: 45,
    size: 5,
    color: '#f4b942',
    collisionRadius: 3.5,
    satsPerCoin: 1,
  },
  collisions: {
    playerRadius: 4,
    obstacleRadius: 5,
  },
  GAME_STATES: {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER',
  },
};
