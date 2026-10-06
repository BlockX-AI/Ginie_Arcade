const GAME_HEIGHT = 750;
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
  window.innerWidth / -100,
  window.innerWidth / 100,
  window.innerHeight / 100,
  window.innerHeight / -100,
  -1000,
  1000
);
const renderer = new THREE.WebGLRenderer({ alpha: true });
const pointLight = new THREE.PointLight(0xffffff, 4, 200);
const ambientLight = new THREE.AmbientLight(0xfff, 1);
const pixelRatio = window.devicePixelRatio;

renderer.setSize(
  window.innerWidth * pixelRatio,
  window.innerHeight * pixelRatio
);
document.body.appendChild(renderer.domElement);
window.addEventListener('resize', updateSize);
updateSize();
pointLight.position.set(0, 4, 100);
scene.add(pointLight);
scene.add(ambientLight);

function updateSize() {
  renderer.setSize(
    window.innerWidth * pixelRatio,
    window.innerHeight * pixelRatio
  );
  camera.left = window.innerWidth / -100;
  camera.right = window.innerWidth / 100;
  camera.top = window.innerHeight / 100;
  camera.bottom = window.innerHeight / -100;
  camera.zoom = window.innerHeight / GAME_HEIGHT;
  camera.updateProjectionMatrix();
}

export { scene, camera, renderer };
