const inputState = {
  initialized: false,
  target: null,
  keysDown: new Set(),
  keysPressed: new Set(),
};

function handleKeyDown(event) {
  if (!event.repeat) {
    inputState.keysPressed.add(event.code);
  }
  inputState.keysDown.add(event.code);
}

function handleKeyUp(event) {
  inputState.keysDown.delete(event.code);
}

export function initializeInput(target = typeof window !== 'undefined' ? window : null) {
  if (inputState.initialized || !target) {
    return;
  }

  inputState.target = target;
  inputState.target.addEventListener('keydown', handleKeyDown);
  inputState.target.addEventListener('keyup', handleKeyUp);
  inputState.initialized = true;
}

function ensureInitialized() {
  if (!inputState.initialized) {
    initializeInput();
  }
}

export function isLeftPressed() {
  ensureInitialized();
  return (
    inputState.keysDown.has('ArrowLeft') || inputState.keysDown.has('KeyA')
  );
}

export function isRightPressed() {
  ensureInitialized();
  return (
    inputState.keysDown.has('ArrowRight') || inputState.keysDown.has('KeyD')
  );
}

export function wasKeyPressed(code) {
  ensureInitialized();
  return inputState.keysPressed.has(code);
}

export function postInputUpdate() {
  ensureInitialized();
  inputState.keysPressed.clear();
}

initializeInput();
