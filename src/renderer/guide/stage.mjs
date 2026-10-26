// The small WebGL stage Rosie stands on: a transparent canvas, a perspective
// camera, soft lights, and an environment made from a tiny procedural room so
// the velvet reads as cloth. Returns null when WebGL is unavailable, in
// which case the layer shows the sprite instead.

function room(THREE) {
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), new THREE.MeshBasicMaterial({ color: 0xcfc8c0, side: THREE.BackSide })));
  const panel = (x, y, z, w, h, color) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    scene.add(m);
  };
  panel(-5, 8, 6, 8, 6, 0xffffff);
  panel(6, 3, 5, 5, 4, 0xdfe9ff);
  panel(0, 6, -8, 10, 4, 0xffd9e0);
  return scene;
}

export function createStage(THREE, canvas, { width, height, pixelRatio = 1 }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(pixelRatio, 2));
  renderer.setSize(width, height, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 50);
  camera.position.set(0, 0.05, 6.2);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xfff1f3, 0x5a6a60, 1.0));
  const key = new THREE.DirectionalLight(0xfff4ea, 2.2);
  key.position.set(-2.5, 4, 5);
  const fill = new THREE.DirectionalLight(0xdfe9ff, 0.8);
  fill.position.set(3, 1.5, 4);
  const rim = new THREE.DirectionalLight(0xffd0da, 1.3);
  rim.position.set(0, 3, -4);
  scene.add(key, fill, rim);

  let environment = null;
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    environment = pmrem.fromScene(room(THREE), 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.4;
    pmrem.dispose();
  } catch {
    environment = null;
  }

  const root = new THREE.Group();
  scene.add(root);

  return {
    renderer,
    scene,
    camera,
    root,
    render() { renderer.render(scene, camera); },
    setSize(w, h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); },
    dispose() {
      if (environment) environment.dispose();
      renderer.dispose();
    },
  };
}
