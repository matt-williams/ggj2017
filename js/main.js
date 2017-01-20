var scene, camera, renderer;
var geometry, material, mesh;

var t = 0;
init();
animate();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
  camera.rotation.x = -Math.PI / 2;
  camera.position.set(0, 6, 0);

  var directionalLight = new THREE.DirectionalLight(0x7f7f7f, 2);
  directionalLight.position.set(0, 1, 0);
  scene.add(directionalLight);

  var ambientLight = new THREE.AmbientLight(0x808080);
  scene.add(ambientLight);

  geometry = new THREE.PlaneBufferGeometry(10, 10, 50, 50);
  geometry.rotateX(-Math.PI / 2);
  var material = new THREE.MeshBasicMaterial({color: 0xffff00, wireframe: true});
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, -10, 0);
  scene.add(mesh);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.getElementById("container").appendChild(renderer.domElement);
}

function animate() {
  requestAnimationFrame(animate);

  t++;
  var vertices = geometry.attributes.position.array;
  for (var i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3) {
    vertices[j + 1] = Math.sin(((i % 50) + Math.floor(i / 50) + t) * 0.5);
  }
  geometry.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
}
