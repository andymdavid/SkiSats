const hudState = {
  elapsedTime: 0,
};

export function resetHUD() {
  hudState.elapsedTime = 0;
}

export function updateHUD(dt = 0) {
  hudState.elapsedTime += dt;
}

export function getElapsedTime() {
  return hudState.elapsedTime;
}

export function formatDistance(distance) {
  return `${Math.floor(distance)} m`;
}

export function formatTime(seconds) {
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function renderHUD(ctx, canvasWidth, canvasHeight, playerDistance, sats = 0) {
  const padding = 12;
  const panelWidth = 180;
  const panelHeight = 90;
  const x = padding;
  const y = padding;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(x, y, panelWidth, panelHeight);

  ctx.fillStyle = '#ffffff';
  ctx.font = '14px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const lines = [
    `DISTANCE: ${formatDistance(playerDistance)}`,
    `TIME: ${formatTime(hudState.elapsedTime)}`,
    `SATS: ${sats}`,
  ];

  let lineY = y + 12;
  lines.forEach((line) => {
    ctx.fillText(line, x + 12, lineY);
    lineY += 22;
  });

  ctx.restore();
}
