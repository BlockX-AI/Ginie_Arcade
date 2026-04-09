import { scene } from './setup';

const texture = new THREE.TextureLoader().load('/shooter/textures/space.png');
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(3, 3);
const geo = new THREE.PlaneBufferGeometry(40, 40, 1);
const material = new THREE.MeshBasicMaterial({ map: texture });
const plane: THREE.Object3D = new THREE.Mesh(geo, material);
plane.position.z = -20;

export function addPlaneBg() {
  scene.add(plane);
}

export function updatePlaneInScene(isForward: boolean) {
  if (isForward) {
    texture.offset.y += 0.001;
  } else {
    texture.offset.y -= 0.001;
  }
}
