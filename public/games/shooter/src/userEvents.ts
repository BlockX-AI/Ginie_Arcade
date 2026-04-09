export let isMoveLeft = false;
export let isMoveRight = false;
export let isShoot = false;
export let mouseX = 0;

const SPACE = 32;
const ARROW_LEFT = 37;
const ARROW_RIGHT = 39;

addEvents();

function addEvents() {
  window.addEventListener('keydown', handleKeydown, false);
  window.addEventListener('keyup', handleKeyup, false);

  window.addEventListener('mousemove', handleMouseMove, false);
  document.addEventListener('touchmove', handleTouchMove, false);
  document.addEventListener('touchstart', handleTouchStart, false);
  document.addEventListener('touchend', handleTouchEnd, false);
}

function removeEvents() {
  window.removeEventListener('keydown', handleKeydown, false);
  window.removeEventListener('keyup', handleKeyup, false);

  window.removeEventListener('mousemove', handleMouseMove, false);
  document.removeEventListener('touchmove', handleTouchMove, false);
  document.removeEventListener('touchstart', handleTouchStart, false);
  document.removeEventListener('touchend', handleTouchEnd, false);
}

export function resetUserEvents(time: number = 1000) {
  isMoveLeft = false;
  isMoveRight = false;
  isShoot = false;

  if (time) {
    removeEvents();
    setTimeout(addEvents, time);
  }
}

function handleMouseMove(event: MouseEvent) {
  updateMouseX(event.x);
}

function handleTouchMove(event: TouchEvent) {
  const touch = event.touches[0];
  const x = touch.clientX;

  updateMouseX(x);
}

function handleTouchStart() {
  isShoot = true;
}

function handleTouchEnd() {
  isShoot = false;
}

let prevXpos = 0;
function updateMouseX(x: number) {
  const boundryWidth = window.innerWidth / 2 - window.innerHeight * 9 / 16 / 2;
  let xPos = 0;

  if (x <= boundryWidth) {
    xPos = boundryWidth;
  } else if (x >= window.innerWidth - boundryWidth) {
    xPos = window.innerWidth - boundryWidth;
  } else {
    xPos = x;
  }

  mouseX = (xPos - boundryWidth) / (window.innerWidth - boundryWidth * 2);

  if (mouseX < prevXpos) {
    isMoveLeft = true;
    isMoveRight = false;
  }

  if (mouseX > prevXpos) {
    isMoveLeft = false;
    isMoveRight = true;
  }

  if (mouseX === prevXpos) {
    isMoveLeft = false;
    isMoveRight = false;
  }

  prevXpos = mouseX;
}

function handleKeydown(event: KeyboardEvent) {
  const { keyCode } = event;

  switch (keyCode) {
    case ARROW_LEFT:
      isMoveLeft = true;
      break;
    case ARROW_RIGHT:
      isMoveRight = true;
      break;
    case SPACE:
      isShoot = true;
      break;
    default:
      break;
  }
}

function handleKeyup(event: KeyboardEvent) {
  const { keyCode } = event;

  switch (keyCode) {
    case ARROW_LEFT:
      isMoveLeft = false;
      break;
    case ARROW_RIGHT:
      isMoveRight = false;
      break;
    case SPACE:
      isShoot = false;
      break;
    default:
      break;
  }
}
