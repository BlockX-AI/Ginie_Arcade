import { values } from 'lodash';

export interface IGeometriesDictionary {
  [key: string]: THREE.Geometry;
}

const objectLoader = new THREE.ObjectLoader();

const gameScenePromise = new Promise(resolve => {
  objectLoader.load('shooter/meshes/gameScene.json', scene => {
    resolve(extractGeoByNames(scene, ['xShip', 'asteroidA', 'hex']));
  });
});

function extractGeoByNames(scene: THREE.Object3D, names: string[]) {
  const SUFFIX = 'Geo';

  return names.reduce(
    (object, name) => {
      const object3d = scene.getObjectByName(name);
      const geometry = values(
        objectLoader.parseGeometries(object3d.toJSON().geometries)
      )[0];

      return Object.assign(object, { [name + SUFFIX]: geometry });
    },
    {} as IGeometriesDictionary
  );
}

export { gameScenePromise };
