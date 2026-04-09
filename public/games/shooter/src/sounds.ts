import { Howl } from 'howler';

export const blasterSound = new Howl({
  src: ['sounds/blaster.ogg', 'sounds/blaster.mp3'],
});

export const hitSound = new Howl({
  src: ['sounds/hit.ogg', 'sounds/hit.mp3'],
});

export const wooshSound = new Howl({
  src: ['sounds/woosh.ogg', 'sounds/woosh.mp3'],
});

export const explosionSound = new Howl({
  src: ['sounds/explosion.ogg', 'sounds/explosion.mp3'],
});
