import { CONFIG } from './config.js';
import { isLeftPressed, isRightPressed } from './input.js';

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.distance = 0;
    this.speed = CONFIG.playerBaseSpeed;
  }

  update(dt = 0) {
    this.distance += this.speed * dt;

    let horizontalInput = 0;
    if (isLeftPressed()) {
      horizontalInput -= 1;
    }
    if (isRightPressed()) {
      horizontalInput += 1;
    }

    if (horizontalInput !== 0) {
      this.x += horizontalInput * CONFIG.playerHorizontalSpeed * dt;
    }

    const halfSlope = CONFIG.slopeWidth / 2;
    this.x = Math.max(-halfSlope, Math.min(halfSlope, this.x));
  }

  render(ctx, canvasWidth, canvasHeight) {
    const centerX = canvasWidth / 2;
    const baseScale = (canvasWidth / CONFIG.slopeWidth) * 0.5 * CONFIG.projection.horizontalScale;
    const screenX = centerX + this.x * baseScale;
    const baseY = canvasHeight * CONFIG.slopeScreen.bottomRatio;

    const bodyWidth = 18;
    const bodyHeight = 28;
    const headRadius = 9;

    ctx.save();

    ctx.fillStyle = '#f25f5c';
    ctx.fillRect(screenX - bodyWidth / 2, baseY - bodyHeight, bodyWidth, bodyHeight);

    ctx.beginPath();
    ctx.arc(screenX, baseY - bodyHeight - headRadius, headRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffe0bd';
    ctx.fill();

    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX - 16, baseY + 4);
    ctx.lineTo(screenX + 16, baseY - 4);
    ctx.moveTo(screenX - 16, baseY + 8);
    ctx.lineTo(screenX + 16, baseY);
    ctx.stroke();

    ctx.restore();
  }
}
