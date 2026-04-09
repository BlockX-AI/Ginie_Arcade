import { random } from 'lodash';
import { IEnemy } from '../enemies';
import { scene } from './setup';

const texture = new THREE.TextureLoader().load('/shooter/textures/asteroidA.png');

export const enemyElements: THREE.Mesh[] = [];

export function addEnemies(
  initialEnemies: IEnemy[],
  asteroidGeo: THREE.Geometry
) {
  const OFFSCREEN = 9999;

  initialEnemies.forEach(() => {
    const material = new THREE.MeshLambertMaterial({
      map: texture,
      opacity: 1,
      flatShading: false,
      transparent: true,
    } as THREE.MaterialParameters);

    const element = new THREE.Mesh(asteroidGeo, material);

    element.position.y = OFFSCREEN;
    scene.add(element);
    enemyElements.push(element);
  });
}

export function updateEnemyInScene(enemy: IEnemy) {
  const OFFSCREEN = 9999;
  const element = enemyElements[enemy.id];

  if (!element) {
    return;
  }

  if (enemy.isDestroyed) {
    element.scale.x = random(0.9, 2, true);
    element.scale.y = random(0.9, 2, true);
  } else {
    element.scale.x = 1;
    element.scale.y = 1;
  }

  if (enemy.isActive) {
    element.position.x = enemy.x;
    element.position.y = enemy.y;
    element.rotation.x = enemy.rotation + 0.1;
    element.rotation.y = enemy.rotation + 0.1;
    element.rotation.z = enemy.rotation;
    element.children.forEach((child: THREE.Mesh) => {
      child.material.opacity = enemy.opacity;
    });
    _updateColors(element, enemy);
  } else {
    element.position.y = OFFSCREEN;
  }
}

export function resetEnemiesAppearanceInScene(enemies: IEnemy[]) {
  enemies.forEach(enemy => {
    const element = enemyElements[enemy.id];

    if (!element) {
      return;
    }

    const material = element.material as THREE.MeshBasicMaterial;
    material.color.setHex(0x2c88d8);
  });
}

function _updateColors(element: THREE.Mesh, enemy: IEnemy) {
  const { energy, velocity } = enemy;

  if (velocity > 0.1) {
    _updateChildrenColor(element, 0xdb3ad0);
  } else {
    _updateChildrenColor(element, 0x78a5ec);
  }

  if (enemy.isDestroyed) {
    _updateChildrenColor(element, 0xff0000);
  }

  switch (energy) {
    case 3:
      _updateChildrenEmissive(element, 0xb7bbc0);
      break;
    case 2:
      _updateChildrenEmissive(element, 0x73adcf);
      break;
    default:
      _updateChildrenEmissive(element, 0x000000);
  }
}

function _updateChildrenColor(element: THREE.Mesh, color: number) {
  const material = element.material as THREE.MeshPhongMaterial;
  material.color.setHex(color);
}

function _updateChildrenEmissive(element: THREE.Mesh, color: number) {
  const material = element.material as THREE.MeshPhongMaterial;
  material.emissive.setHex(color);
}
