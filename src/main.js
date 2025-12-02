import { CONFIG } from './config.js';
import { postInputUpdate } from './input.js';
import { GameStateManager } from './gameState.js';
import { Player } from './player.js';

const canvas = document.getElementById(CONFIG.canvasId);
const ctx = canvas.getContext('2d');

const player = new Player();
const stateManager = new GameStateManager({ player });

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let lastTime = 0;

function getViewport() {
  return { width: canvas.width, height: canvas.height };
}

function gameLoop(timestamp) {
  if (!lastTime) {
    lastTime = timestamp;
  }

  const deltaTime = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  stateManager.update(deltaTime);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stateManager.render(ctx, getViewport());

  postInputUpdate();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
