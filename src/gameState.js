import { CONFIG } from './config.js';
import { wasKeyPressed } from './input.js';
import {
  resetWorld,
  updateWorld,
  checkPlayerObstacleCollision,
  checkPlayerShrubCollision,
  collectCoinsForPlayer,
} from './world.js';
import {
  resetHUD,
  updateHUD,
  renderHUD,
  getElapsedTime,
  formatDistance,
  formatTime,
} from './hud.js';

const { GAME_STATES } = CONFIG;

export class GameStateManager {
  constructor({ player, onCrash, onReset }) {
    this.player = player;
    this.currentState = GAME_STATES.MENU;
    this.currentSats = 0;
    this.lastRunStats = null;
    this.onCrash = onCrash;
    this.onReset = onReset;
  }

  setState(newState) {
    this.currentState = newState;
  }

  startRun() {
    this.player.reset();
    resetWorld(this.player.distance);
    resetHUD();
    this.currentSats = 0;
    this.lastRunStats = null;
    this.setState(GAME_STATES.PLAYING);
    // Reset player animation to normal
    if (this.onReset) {
      this.onReset();
    }
  }

  handleGameOver() {
    this.lastRunStats = {
      distance: this.player.distance,
      time: getElapsedTime(),
      sats: this.currentSats,
    };
    this.setState(GAME_STATES.GAME_OVER);
    // Trigger crash animation
    if (this.onCrash) {
      this.onCrash();
    }
  }

  update(dt) {
    switch (this.currentState) {
      case GAME_STATES.MENU:
        if (wasKeyPressed('Enter')) {
          this.startRun();
        }
        break;
      case GAME_STATES.PLAYING:
        this.player.update(dt);
        updateWorld(dt, this.player.distance);
        updateHUD(dt, this.player.distance, this.currentSats);
        const collected = collectCoinsForPlayer(this.player);
        if (collected > 0) {
          this.currentSats += collected * CONFIG.coins.satsPerCoin;
        }

        // Check shrub collisions - strict single shrub processing with cooldown
        if (this.player.shrubCollisionCooldown <= 0) {
          const collidedShrubs = checkPlayerShrubCollision(this.player);
          if (collidedShrubs.length > 0) {
            // Find the closest shrub
            let closestShrub = null;
            let minDistanceSquared = Infinity;

            collidedShrubs.forEach((shrub) => {
              const dx = shrub.x - this.player.x;
              const dy = shrub.y - this.player.distance;
              const distSquared = dx * dx + dy * dy;

              // Only consider shrubs within very close range (3 units)
              if (distSquared < 9 && distSquared < minDistanceSquared) {
                minDistanceSquared = distSquared;
                closestShrub = shrub;
              }
            });

            // Only process if we found a very close shrub
            if (closestShrub && !closestShrub.processed) {
              if (this.player.speed >= CONFIG.shrubs.fireSpeedThreshold) {
                // High speed - set shrub on fire
                closestShrub.isOnFire = true;
              } else {
                // Low speed - slow down player
                this.player.speed *= CONFIG.shrubs.speedSlowdown;
              }
              closestShrub.processed = true;
              // Set cooldown to prevent processing another shrub immediately
              this.player.shrubCollisionCooldown = 0.5;
            }
          }
        }

        if (checkPlayerObstacleCollision(this.player)) {
          this.handleGameOver();
        }
        break;
      case GAME_STATES.GAME_OVER:
        if (wasKeyPressed('Enter')) {
          this.startRun();
        }
        break;
      default:
        break;
    }
  }

  render(ctx, viewport) {
    switch (this.currentState) {
      case GAME_STATES.MENU:
        this.renderMenu(ctx, viewport);
        break;
      case GAME_STATES.PLAYING:
        this.renderPlaying(ctx, viewport);
        break;
      case GAME_STATES.GAME_OVER:
        this.renderGameOver(ctx, viewport);
        break;
      default:
        break;
    }
  }

  renderMenu(ctx, { width, height }) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 42, 61, 0.85)';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';

    ctx.font = `${Math.max(32, Math.floor(width * 0.05))}px 'Segoe UI', sans-serif`;
    ctx.fillText('SkiSats', width / 2, height / 2 - 20);

    ctx.font = `${Math.max(16, Math.floor(width * 0.02))}px 'Segoe UI', sans-serif`;
    ctx.fillText('Press ENTER to start', width / 2, height / 2 + 30);
    ctx.restore();
  }

  renderPlaying(ctx, { width, height }) {
    renderHUD(ctx, width, height, this.player.distance, this.currentSats);
  }

  renderGameOver(ctx, { width, height }) {
    const stats = this.lastRunStats || {
      distance: this.player.distance,
      time: getElapsedTime(),
      sats: this.currentSats,
    };

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '48px "Segoe UI", sans-serif';
    ctx.fillText('GAME OVER', width / 2, height / 2 - 80);

    ctx.font = '24px "Segoe UI", sans-serif';
    ctx.fillText(`DISTANCE: ${formatDistance(stats.distance)}`, width / 2, height / 2 - 20);
    ctx.fillText(`TIME: ${formatTime(stats.time)}`, width / 2, height / 2 + 20);
    ctx.fillText(`SATS: ${stats.sats}`, width / 2, height / 2 + 60);

    ctx.font = '20px "Segoe UI", sans-serif';
    ctx.fillText('Press ENTER to restart', width / 2, height / 2 + 110);
    ctx.restore();
  }
}
