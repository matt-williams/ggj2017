var scene, camera, renderer;
var geometry, material, mesh;
var pointLight;

var t = 0;
var WIDTH = 200;
var HEIGHT = 200;
var velocity = new Float64Array(WIDTH * HEIGHT);
var fields = [new Float64Array(WIDTH * HEIGHT), new Float64Array(WIDTH * HEIGHT)];
var field = fields[0];

var touch = document.getElementById("container");
var mc = new Hammer(touch);
var touchCoordX = 0;
var touchCoordY = 0;

mc.on("tap press", function(ev) {
    console.log(ev.type + " gesture detected.");
    touchCoordX = ev.center.x / touch.offsetWidth;
    touchCoordY = ev.center.y / touch.offsetHeight;
//    var timeElapsed = ev.deltaTime;
});

init();
animate();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
  camera.rotation.x = -Math.PI / 2;
  camera.position.set(0, 6, 0);

  pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(-10, 0, -5);
  scene.add(pointLight);

  geometry = new THREE.PlaneBufferGeometry(20, 20, WIDTH - 1, HEIGHT - 1);
  geometry.rotateX(-Math.PI / 2);
  var material = new THREE.MeshPhongMaterial({color: 0x00ddddd, shininess: 75});
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, -10, 0);
  scene.add(mesh);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.getElementById("container").appendChild(renderer.domElement);
}

function animate() {
  requestAnimationFrame(animate);

  velocity[Math.floor(touchCoordX * WIDTH) + Math.floor(touchCoordY * HEIGHT) * WIDTH] += Math.sin(t * 0.3);
  velocity[Math.floor(-1 + touchCoordX * WIDTH) + Math.floor(touchCoordY * HEIGHT) * WIDTH] += 0.5 * Math.sin(t * 0.3);
  velocity[Math.floor(1 + touchCoordX * WIDTH) + Math.floor(touchCoordY * HEIGHT) * WIDTH] += 0.5 * Math.sin(t * 0.3);
  velocity[Math.floor(touchCoordX * WIDTH) + Math.floor(-1 + touchCoordY * HEIGHT) * WIDTH] += 0.5 * Math.sin(t * 0.3);
  velocity[Math.floor(touchCoordX * WIDTH) + Math.floor(1 + touchCoordY * HEIGHT) * WIDTH] += 0.5 * Math.sin(t * 0.3);
  t++;
  var newField = fields[1];
  for (var z = 1; z < HEIGHT - 1; z++) {
    for (var x = 1; x < WIDTH - 1; x++) {
      var height = field[x + z * WIDTH];
      var average = (field[x + (z - 1) * WIDTH] + field[x + (z + 1) * WIDTH] + field[x - 1 + z * WIDTH] + field[x + 1 + z * WIDTH]) / 4;
      velocity[x + z * WIDTH] = (velocity[x + z * WIDTH] + (average - height) * 2) * 0.99;
      newField[x + z * WIDTH] = height + velocity[x + z * WIDTH];
    }
  }
  fields[0] = newField;
  fields[1] = field;
  field = newField;

  var normals = geometry.attributes.normal.array;
  for (var z = 1; z < HEIGHT; z++) {
    for (var x = 1; x < WIDTH; x++) {
      var vector1 = [-2, (field[(x - 1) + z * WIDTH] - field[(x + 1) + z * WIDTH]), 0];
      var vector2 = [0, (field[x + (z - 1) * WIDTH] - field[x + (z + 1) * WIDTH]), 2];
      normals[0 + (x * 3) + (z * 3 * WIDTH)] = (vector1[1] * vector2[2]) - (vector1[2] * vector2[1]);
      normals[1 + (x * 3) + (z * 3 * WIDTH)] = (vector1[2] * vector2[0]) - (vector1[0] * vector2[2]);
      normals[2 + (x * 3) + (z * 3 * WIDTH)] = (vector1[0] * vector2[1]) - (vector1[1] * vector2[0]);
    }
  }
  geometry.attributes.normal.needsUpdate = true;

  var vertices = geometry.attributes.position.array;
  for (var i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3) {
    vertices[j + 1] = field[i];
  }
  geometry.attributes.position.needsUpdate = true;

  if (pointLight != undefined) {
    pointLight.position.set(-10 * Math.cos(0.01 * t), 0, -7 + 2 * Math.cos(0.02 * t));
  }

  renderer.render(scene, camera);
}
