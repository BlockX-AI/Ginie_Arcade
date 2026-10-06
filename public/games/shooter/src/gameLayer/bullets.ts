import { IBullet } from '../bullets';
import { scene } from './setup';

export const bulletElements: THREE.Mesh[] = [];

export function addBullets(bullets: IBullet[]) {
  bullets.forEach(bullet => {
    const geometry = new THREE.ConeGeometry(0.1, bullet.height, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const element = new THREE.Mesh(geometry, material);

    element.position.y = bullet.y;
    scene.add(element);
    bulletElements.push(element);
  });
}

export function updateBullet(bullet: IBullet) {
  const OFFSCREEN = 9999;
  const element = bulletElements[bullet.id];

  if (bullet.isActive) {
    element.position.x = bullet.x;
    element.position.y = bullet.y;
  } else {
    element.position.y = OFFSCREEN;
  }
}
