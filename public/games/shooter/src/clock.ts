const MAX_TIME = 9999;
let time = 0;

export function clockReset() {
  time = 0;
}

export function clockGet() {
  return time / 60;
}

export function clockUpdate() {
  time = time + 1 <= MAX_TIME ? time + 1 : MAX_TIME;
}
