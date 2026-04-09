import { shuffle } from 'lodash';
import { IHex } from '../hexBg';
import { deg } from '../utils';
import { scene } from './setup';

const elements: THREE.Object3D[] = [];

export function addHexBg(initialHexBg: IHex[], hexGeo: THREE.Geometry) {
  const materials: THREE.MeshBasicMaterial[] = [
    'hexA',
    'hexB',
    'hexC',
  ].map(name => {
    const textureA = new THREE.TextureLoader().load(`/shooter/textures/${name}.png`);
    return new THREE.MeshBasicMaterial({ map: textureA });
  });

  initialHexBg.forEach(hex => {
    const element = new THREE.Mesh(hexGeo, shuffle(materials)[0]);

    element.position.x = hex.x;
    element.position.y = hex.y;
    element.position.z = -10;
    element.rotation.z = deg(-120);
    scene.add(element);
    elements.push(element);
  });
}

export function updateHexInScene(hex: IHex, index: number) {
  const hexObject = elements[index];
  hexObject.position.x = hex.x;
  hexObject.position.y = hex.y;
}

export function flipHex(hex: IHex, index: number) {
  const hexObject = elements[index];
  hexObject.rotation.x =
    hexObject.rotation.x >= deg(180)
      ? deg(180)
      : hexObject.rotation.x + hex.flipSpeed;
}

export function flipBackHex(hex: IHex, index: number) {
  const hexObject = elements[index];
  hexObject.rotation.x =
    hexObject.rotation.x <= deg(0)
      ? deg(0)
      : hexObject.rotation.x - hex.flipSpeed;
}
