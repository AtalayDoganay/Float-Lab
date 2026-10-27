// The small WebGL stage Rosie stands on: a transparent canvas, a perspective
// camera and flat cel lighting (one warm key for the shading bands, a soft
// hemisphere so the shadow side stays coloured). No tone mapping, so her
// colours stay as bright as they are authored. Returns null when WebGL is
// unavailable, in which case the layer shows the sprite instead.

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
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 50);
  camera.position.set(0, 0.05, 6.2);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xfff4f6, 0xc9d8cf, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(-2.2, 3.6, 4.5);
  scene.add(key);

  const root = new THREE.Group();
  scene.add(root);

  return {
    renderer,
    scene,
    camera,
    root,
    render() { renderer.render(scene, camera); },
    setSize(w, h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); },
    dispose() { renderer.dispose(); },
  };
}
