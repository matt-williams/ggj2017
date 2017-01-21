var scene, camera, renderer;
var geometry, material, mesh;
var pointLight;
var simplePlaneMesh;
var bouy;

var t = 0;
var map = maps[0];
var WIDTH = 200;
var HEIGHT = 200;
var DAMPING = 0.995;
var velocity = new Float64Array(WIDTH * HEIGHT);
var fields = [new Float64Array(WIDTH * HEIGHT), new Float64Array(WIDTH * HEIGHT)];
var field = fields[0];

var touch = document.getElementById("container");
var touchCoordX = 0;
var touchCoordY = 0;
var touchDuration = 0;
var touched = false;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
function updateTouchCoords(event) {
  mouse.x = event.clientX / window.innerWidth * 2 - 1;
  mouse.y = 1 - event.clientY / window.innerHeight * 2;
  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects([simpleMesh]);
  if (intersects.length > 0) {
    touchCoordX = intersects[0].point.x / 20 + 0.5;
    touchCoordY = intersects[0].point.z / 20 + 0.5;
    touchDuration = Math.PI / 0.15;
    return true;
  }
  return false;
}

function onDocumentTouchStart( event ) {
  touched = touched || updateTouchCoords(event);
}

function onDocumentTouchMove( event ) {
  if (touched) {
    updateTouchCoords(event);
  }
}

function onDocumentTouchStop( event ) {
  touched = false;
}

function isBarrier(x, z) {
  for (var ii = 0; ii < map.barriers.length; ii++) {
    var barrier = map.barriers[ii];
    if ((x >= barrier.x) &&
        (x < barrier.x + barrier.dx) && 
        (z >= barrier.z) &&
        (z < barrier.z + barrier.dz)) {
      return true;
    }
  }
  return false;
}

function isTappable(x, z) {
  for (var ii = 0; ii < map.untappables.length; ii++) {
    var untappable = map.untappables[ii];
    if ((x >= untappable.x) &&
        (x < untappable.x + untappable.dx) && 
        (z >= untappable.z) &&
        (z < untappable.z + untappable.dz)) {
      return false;
    }
  }
  return true;
}

init();
animate();

function init() {
  scene = new THREE.Scene();

  var scaleX = (window.innerWidth > window.innerHeight) ? window.innerWidth / window.innerHeight : 1;
  var scaleY = (window.innerHeight > window.innerWidth) ? window.innerHeight / window.innerWidth : 1;
  camera = new THREE.OrthographicCamera(-11 * scaleX, 11 * scaleX, 11 * scaleY, -11 * scaleY, 1, 10000);
  camera.rotation.x = -Math.PI / 2;
  camera.position.set(0, 5, 0);

  pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(-10, 0, -5);
  scene.add(pointLight);

  geometry = new THREE.PlaneBufferGeometry(20, 20, WIDTH - 1, HEIGHT - 1);
  geometry.rotateX(-Math.PI / 2);
  var material = new THREE.MeshPhongMaterial({color: 0x00ddddd, shininess: 75});
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, -10, 0);
  scene.add(mesh);

  var barrierGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
  var barrierMaterial = new THREE.MeshPhongMaterial({color: 0xffff00, shininess: 75});
  for (var ii = 0; ii < map.barriers.length; ii++) {
    var barrier = map.barriers[ii];
    var barrierMesh = new THREE.Mesh(barrierGeometry, barrierMaterial);
    barrierMesh.scale.set(barrier.dx / 10, 2, barrier.dz / 10);
    barrierMesh.position.set((barrier.x + barrier.dx / 2) / 10 - 10, -10, (barrier.z + barrier.dz / 2) / 10 - 10);
    scene.add(barrierMesh);
  }

  var simpleGeometry = new THREE.PlaneBufferGeometry(20, 20);
  simpleGeometry.rotateX(-Math.PI / 2);
  simpleMesh = new THREE.Mesh(simpleGeometry, new THREE.Material());
  simpleMesh.position.set(0, -10, 0);

  createBouy(0, 0);
  //createBouy(5, 5);
  console.log("bouy1: " + translate(0, 0));
  //console.log("bouy2: " + translate(5, 5));

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.getElementById("container").appendChild(renderer.domElement);
  document.addEventListener("mousedown", onDocumentTouchStart, false);
  document.addEventListener("mousemove", onDocumentTouchMove, false);
  document.addEventListener("mouseup", onDocumentTouchStop, false);

  window.addEventListener("resize", function() {
    var scaleX = (window.innerWidth > window.innerHeight) ? window.innerWidth / window.innerHeight : 1;
    var scaleY = (window.innerHeight > window.innerWidth) ? window.innerHeight / window.innerWidth : 1;
    camera.left = -11 * scaleX;
    camera.right = 11 * scaleX;
    camera.top = 11 * scaleY;
    camera.bottom = -11 * scaleY;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, false);
}

function createBouy(x, z) {
  
  var cone = new THREE.ConeBufferGeometry(0.5, 2.5, 100);
  var material = new THREE.MeshPhongMaterial({color: 0xff0000, shininess: 100});
  bouy = new THREE.Mesh(cone, material);
  bouy.position.set(x, -7, z);
  scene.add(bouy);

}

function translate(x, z) {
  var position = (Math.round((x + 10)/20) * WIDTH) + (Math.round((z + 10)/20 * HEIGHT) * WIDTH);
  return position;
}

function animate() {
  requestAnimationFrame(animate);

  if (touchDuration > 0) {
    var midX = Math.floor(touchCoordX * WIDTH);
    var midZ = Math.floor(touchCoordY * HEIGHT);
    if (isTappable(midX, midZ)) {
      for (var z = -5; z <= 5; z++) {
        for (var x = -5; x <= 5; x++) {
          if ((x + midX > 0) && (x + midX < WIDTH) && (z + midZ > 0) && (z + midZ < HEIGHT)) {
            velocity[x + midX + (z + midZ) * WIDTH] += 0.7 * Math.exp((-x*x-z*z)/2) * Math.cos(touchDuration * 0.15);
          }
        }
      }
    }
    touchDuration--;
  }
  t++;
  var newField = fields[1];
  for (var z = 0; z < HEIGHT; z += HEIGHT - 1) {
    for (var x = 0; x < WIDTH; x++) {
      if (!isBarrier(x, z)) {
        var height = field[x + z * WIDTH];
        var average = 0;
        var denominator = 0;
        if (z > 0) { average += field[x + (z - 1) * WIDTH]; denominator++; }
        if (z < HEIGHT - 1) { average += field[x + (z + 1) * WIDTH]; denominator++; }
        if (x > 0) { average += field[x - 1 + z * WIDTH]; denominator++; }
        if (x < WIDTH - 1) { average += field[x + 1 + z * WIDTH]; denominator++; }
        average = average / denominator;
        velocity[x + z * WIDTH] = (velocity[x + z * WIDTH] + (average - height) * denominator / 2) * DAMPING;
        newField[x + z * WIDTH] = height + velocity[x + z * WIDTH];
      }
    }
  }
  for (var x = 0; x < WIDTH; x += WIDTH - 1) {
    for (var z = 1; z < HEIGHT - 1; z++) {
      if (!isBarrier(x, z)) {
        var height = field[x + z * WIDTH];
        var average = 0;
        var denominator = 0;
        if (z > 0) { average += field[x + (z - 1) * WIDTH]; denominator++; }
        if (z < HEIGHT - 1) { average += field[x + (z + 1) * WIDTH]; denominator++; }
        if (x > 0) { average += field[x - 1 + z * WIDTH]; denominator++; }
        if (x < WIDTH - 1) { average += field[x + 1 + z * WIDTH]; denominator++; }
        average = average / denominator;
        velocity[x + z * WIDTH] = (velocity[x + z * WIDTH] + (average - height) * denominator / 2) * DAMPING;
        newField[x + z * WIDTH] = height + velocity[x + z * WIDTH];
      }
    }
  }
  for (var z = 1; z < HEIGHT - 1; z++) {
    for (var x = 1; x < WIDTH - 1; x++) {
      if (!isBarrier(x, z)) {
        var height = field[x + z * WIDTH];
        var average = (field[x + (z - 1) * WIDTH] + field[x + (z + 1) * WIDTH] + field[x - 1 + z * WIDTH] + field[x + 1 + z * WIDTH]) / 4;
        velocity[x + z * WIDTH] = (velocity[x + z * WIDTH] + (average - height) * 2) * DAMPING;
        newField[x + z * WIDTH] = height + velocity[x + z * WIDTH];
      }
    }
  }
  fields[0] = newField;
  fields[1] = field;
  field = newField;

  var normals = geometry.attributes.normal.array;
  for (var z = 1; z < HEIGHT - 1; z++) {
    for (var x = 1; x < WIDTH - 1; x++) {
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

  var bouyY = field[translate(0,0)] - 10;
  bouy.position.set(0, bouyY, 0);
//  var bouyNormalX = normals[translate(0,0) * 3];
//  var bouyNormalY = normals[(translate(0,0) * 3) + 1];
//  var bouyNormalZ = normals[(translate(0,0) * 3) + 2];
//  bouy.lookAt(new THREE.Vector3(bouyNormalX,bouyNormalY,bouyNormalZ));
//  console.log(bouyNormalX + " " + bouyNormalY + " " + bouyNormalZ);

  if (pointLight != undefined) {
    pointLight.position.set(-10 * Math.cos(0.01 * t), 0, -7 + 2 * Math.cos(0.02 * t));
  }

  renderer.render(scene, camera);
}
