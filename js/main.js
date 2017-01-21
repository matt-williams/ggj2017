var scene, camera, renderer;
var geometry, mesh;
var pointLightSun, pointLightMoon;
var simpleMesh;

var paused = true;
var transitioning = false;

var t = 0;
var map;
var currentScene;
var WIDTH, HEIGHT;
var WORLD_WIDTH, WORLD_HEIGHT;
var DAMPING = 0.995;
var TOUCH_FORCE = 1.7;
var WAVE_PERIOD_FACTOR = 0.15;
var WAVE_GAUSSIAN_RADIUS = 5;
var velocity, fields, field;

var barriers;

var TICK_COUNT_REQ = 5;
var buoys;
var buoysTickCount;
var buoysActive;
var bellDurations;

var touch = document.getElementById("container");
var touchCoordX = 0;
var touchCoordY = 0;
var touchDuration = 0;
var touched = false;

var DAY_PERIOD = 24 * 60;
var date = new Date;
date.getTime(Date.getTime);
var time = date.getHours() * 60 + date.getMinutes();
console.log(date, date.getHours(), date.getMinutes(), time, DAY_PERIOD);

var SOUND_PATH = "https://raw.githubusercontent.com/matt-williams/ggj2017/master/sounds/"
var dropSound = null;
var swipeSound = null;
var swipeDuration = 0;
var bellSound = null;
var context;

// Use a Raycaster to work out where a mouse event's coordinates relates to in world space
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var barrierCheck = new THREE.Vector2();

function updateTouchCoords(event) {
  mouse.x = event.clientX / window.innerWidth * 2 - 1;
  mouse.y = 1 - event.clientY / window.innerHeight * 2;
  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects([simpleMesh]);

  if (intersects.length > 0) {
    touchCoordX = intersects[0].point.x / (WIDTH / 10) + 0.5;
    touchCoordY = intersects[0].point.z / (HEIGHT / 10) + 0.5;
    touchDuration = Math.PI / WAVE_PERIOD_FACTOR;

    if (event.type == "mousedown") {
      playSound(dropSound);
    } else if (swipeDuration <= 0) {
      playSound(swipeSound);
      swipeDuration = 30;
    }

    return true;
  }

  return false;
}

// Event handlers
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

function onDocumentKeyPress( event ) {
  if (event.which == 32) {
    console.log("space");
    loadScene((currentScene + 1) % maps.length);
  }
}

function onError( error ) {
  console.log("Error: " + error);
}

// Utility function to determine whether a point is in a barrier
function isBarrier(x, z) {
  for (var ii = 0; ii < map.barriers.length; ii++) {
    var barrier = map.barriers[ii];

    if (barrier.rotation) {
      var amX = x - barrier.aX;
      var amZ = z - barrier.aZ;
      var abX = barrier.bX - barrier.aX;
      var abZ = barrier.bZ - barrier.aZ;
      var adX = barrier.dX - barrier.aX;
      var adZ = barrier.dZ - barrier.aZ;

      if ((amX * abX + amZ * abZ > 0) && (amX * abX + amZ * abZ < abX * abX + abZ * abZ) &&
          (amX * adX + amZ * adZ > 0) && (amX * adX + amZ * adZ < adX * adX + adZ * adZ)) {
        return true;
      }
    } else {
      if ((x >= barrier.x) &&
          (x < barrier.x + barrier.dx) && 
          (z >= barrier.z) &&
          (z < barrier.z + barrier.dz)) {
        return true;
      }
    }
  }

  return false;
}

// Utility function to determine whether a point is tappable
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

// Utility function to load barriers for the map
function loadBarriers() {
  barriers = [];

  if (map.barriers == undefined) {
    map.barriers = [];
    return;
  }

  var barrierGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
  var barrierMaterial = new THREE.MeshPhongMaterial({color: 0xffff00, shininess: 75});

  for (var ii = 0; ii < map.barriers.length; ii++) {
    var barrier = map.barriers[ii];
    var dx2 = barrier.dx / 2;
    var dz2 = barrier.dz / 2;
    var midX = barrier.x + dx2;
    var midZ = barrier.z + dz2;
    var barrierMesh = new THREE.Mesh(barrierGeometry, barrierMaterial);
    barrierMesh.scale.set(barrier.dx / 10, 2, barrier.dz / 10);
    barrierMesh.position.set(midX / 10 - (WORLD_WIDTH / 2), -10, midZ / 10 - (WORLD_HEIGHT / 2));

    if (barrier.rotation) {
      barrierMesh.rotation.y = barrier.rotation;
    }

    barriers[ii] = barrierMesh;
    scene.add(barrierMesh);

    // Do some work here to speed up handling for rotated barriers
    if (barrier.rotation) {
      var cosR = Math.cos(barrier.rotation);
      var sinR = Math.sin(barrier.rotation);
      barrier.aX = midX - dx2 * cosR - dz2 * sinR;
      barrier.bX = midX + dx2 * cosR - dz2 * sinR;
      //barrier.cX = midX + dx2 * cosR + dz2 * sinR;
      barrier.dX = midX - dx2 * cosR + dz2 * sinR;
      barrier.aZ = midZ + dx2 * sinR - dz2 * cosR;
      barrier.bZ = midZ - dx2 * sinR - dz2 * cosR;
      //barrier.cZ = midZ - dx2 * sinR + dz2 * cosR;
      barrier.dZ = midZ + dx2 * sinR + dz2 * cosR;
    }
  }
}

// Utility function to load untappables for the map
function loadUntappables() {
  if (map.untappables == undefined) {
    map.untappables = [];
    return;
  }

  var untappableGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
  var untappableMaterial = new THREE.MeshLambertMaterial({color: 0x604000, opacity: 0.25, transparent: true});

  for (var ii = 0; ii < map.untappables.length; ii++) {
    var untappable = map.untappables[ii];
    var untappableMesh = new THREE.Mesh(untappableGeometry, untappableMaterial);
    untappableMesh.scale.set(untappable.dx / 10, 2, untappable.dz / 10);
    untappableMesh.position.set((untappable.x + untappable.dx / 2) / 10 - (WORLD_WIDTH / 2),
                                -10,
                                (untappable.z + untappable.dz / 2) / 10 - (WORLD_HEIGHT / 2));
    scene.add(untappableMesh);
  }
}

// Utility function to load barrier for the map
function loadBuoys() {
  buoys = [];
  buoysTickCount = [];
  buoysActive = [];
  bellDurations = [];

  if (map.buoys == undefined) {
    map.buoys = [];
    return;
  }

  var buoyGeometry = new THREE.ConeBufferGeometry(0.5, 2.5, 100);

  for (var ii = 0; ii < map.buoys.length; ii++) {
    var buoy = map.buoys[ii];
    var buoyMaterial = new THREE.MeshPhongMaterial({color: 0xff0000, shininess: 100});
    var buoyMesh = new THREE.Mesh(buoyGeometry, buoyMaterial);
    buoyMesh.position.set((buoy.x / 10) - (WORLD_WIDTH / 2), -10, (buoy.z / 10) - (WORLD_HEIGHT / 2));
    buoys[ii] = buoyMesh;
    buoysTickCount[ii] = 0;
    buoysActive[ii] = false;
    bellDurations[ii] = 0;
    scene.add(buoyMesh);
  }
}

// This function needs to be updated if we have more complicated success criteria
function success() {
  for (var ii = 0; ii < buoysActive.length; ii++) {
    if (!buoysActive[ii]) {
      return false;
    }
  }

  return true;
}

// Utility function to check buoy status, update colour, and maybe switch scene
function checkBuoyStatus(buoy, index, buoyY) {
  if (transitioning) {
    return;
  }

  var buoyOnSensitivity = map.buoys[index].onSensitivity || -11;
  var buoyOffSensitivity = map.buoys[index].offSensitivity || -9.5;
  //console.log(index, buoyY, buoyOnSensitivity, buoysTickCount[index]);

  if (buoyY < buoyOnSensitivity) {
    buoysTickCount[index]++;

    if (buoysTickCount[index] > TICK_COUNT_REQ) {
      if (bellDurations[index] <= 0) {
        playSound(bellSound);
        bellDurations[index] = 100;
      }

      buoy.material.color.setHex(0x00ff00);
      buoysActive[index] = true;

      if (success()) {
        transitioning = true;
        setTimeout(function() {loadScene((currentScene + 1) % maps.length);}, 500);
      }
    } else {
      buoy.material.color.setHex(0xffff00);
    }
  } else if (buoyY > buoyOffSensitivity)  {
    buoy.material.color.setHex(0xff0000);
    buoysTickCount[index] = 0;
    buoysActive[index] = false;
  }
}

// Function to load sounds
function loadSounds() {
  var request = new XMLHttpRequest();
  var request2 = new XMLHttpRequest();
  var request3 = new XMLHttpRequest();

  request.open('GET', SOUND_PATH + "drop.mp3", true);
  request.responseType = 'arraybuffer';
  request2.open('GET', SOUND_PATH + "swipe.mp3", true);
  request2.responseType = 'arraybuffer';
  request3.open('GET', SOUND_PATH + "churchbell.mp3", true);
  request3.responseType = 'arraybuffer';

  request.onload = function() {
    context.decodeAudioData(request.response, function(buffer) {
      dropSound = buffer;
    }, onError);
  }
  request2.onload = function() {
    context.decodeAudioData(request2.response, function(buffer) {
      swipeSound = buffer;
    }, onError);
  }
  request3.onload = function() {
    context.decodeAudioData(request3.response, function(buffer) {
      bellSound = buffer;
    }, onError);
  }

  request.send();
  request2.send();
  request3.send();
}

// Function to play sounds
function playSound(buffer) {
  if (buffer != null) {
    var source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);
  }
}

// Initialize, load and animate the first scene
init();
loadScene(0);
animate();

// Initialize aspects of the game that persist across scenes
function init() {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  context = new AudioContext();
  loadSounds();

  var scaleX = (window.innerWidth > window.innerHeight) ? window.innerWidth / window.innerHeight : 1;
  var scaleY = (window.innerHeight > window.innerWidth) ? window.innerHeight / window.innerWidth : 1;
  camera = new THREE.OrthographicCamera(-11 * scaleX, 11 * scaleX, 11 * scaleY, -11 * scaleY, 1, 10000);
  camera.rotation.x = -Math.PI / 2;
  camera.position.set(0, 5, 0);

  pointLightSun = new THREE.PointLight(0xffffff, 1, 100);
  pointLightSun.position.set(-20, 0, -5);
  pointLightMoon = new THREE.PointLight(0x888888, 1, 100);
  pointLightMoon.position.set(20, 0, -5);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.getElementById("container").appendChild(renderer.domElement);
  document.addEventListener("mousedown", onDocumentTouchStart, false);
  document.addEventListener("mousemove", onDocumentTouchMove, false);
  document.addEventListener("mouseup", onDocumentTouchStop, false);
  document.addEventListener("keypress", onDocumentKeyPress, false);

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

// Function to load scenes
function loadScene(sceneNumber) {
  paused = true;
  transitioning = false;
  scene = new THREE.Scene();
  map = maps[sceneNumber];

  scene.add(pointLightSun);
  scene.add(pointLightMoon);

  WIDTH = map.size.dx;
  HEIGHT = map.size.dz;
  WORLD_WIDTH = Math.round(WIDTH / 10);
  WORLD_HEIGHT = Math.round(HEIGHT / 10);
  velocity = new Float64Array(WIDTH * HEIGHT);
  fields = [new Float64Array(WIDTH * HEIGHT), new Float64Array(WIDTH * HEIGHT)];
  field = fields[0];

  geometry = new THREE.PlaneBufferGeometry(WORLD_WIDTH, WORLD_HEIGHT, WIDTH - 1, HEIGHT - 1);
  geometry.rotateX(-Math.PI / 2);

  var material = new THREE.MeshPhongMaterial({color: 0x00ddddd, shininess: 75});
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, -10, 0);
  scene.add(mesh);

  var simpleGeometry = new THREE.PlaneBufferGeometry(WORLD_WIDTH, WORLD_HEIGHT);
  simpleGeometry.rotateX(-Math.PI / 2);
  simpleMesh = new THREE.Mesh(simpleGeometry, new THREE.Material());
  simpleMesh.position.set(0, -10, 0);

  loadBarriers();
  loadUntappables();
  loadBuoys();

  currentScene = sceneNumber;
  touched = false;
  touchDuration = 0;
  paused = false;
}

// Function to get from coordinates of an object to the grid index
function translate(x, z) {
  var position = (Math.round(x + (WORLD_WIDTH / 2)) * 10) + (Math.round(z + (WORLD_HEIGHT / 2)) * 10 * WIDTH);
  return position;
}

// Utility function to handle touches, which may come from the mouse or remote sources
function handleTouch(touchX, touchZ)
{
  if (isTappable(touchX, touchZ)) {
    var cosT = Math.cos(touchDuration * WAVE_PERIOD_FACTOR);

    for (var z = -WAVE_GAUSSIAN_RADIUS; z <= WAVE_GAUSSIAN_RADIUS; z++) {
      for (var x = -WAVE_GAUSSIAN_RADIUS; x <= WAVE_GAUSSIAN_RADIUS; x++) {
        if ((x + touchX > 0) && (x + touchX < WIDTH) && (z + touchZ > 0) && (z + touchZ < HEIGHT)) {
          velocity[x + touchX + (z + touchZ) * WIDTH] += TOUCH_FORCE * Math.exp((-x * x - z * z) / 2) * cosT;
        }
      }
    }
  }
}

// Function to handle updating the field of vertices
function updateField() {
  var newField = fields[1];

  // First do the top and bottomr edges
  for (var z = 0; z < HEIGHT; z += HEIGHT - 1) {
    for (var x = 0; x < WIDTH; x++) {
      if (!isBarrier(x, z)) {
        var index = x + (z * WIDTH);
        var height = field[index];
        var average = 0;
        var denominator = 0;

        if (z > 0) { average += field[index - WIDTH]; denominator++; }
        if (z < HEIGHT - 1) { average += field[index + WIDTH]; denominator++; }
        if (x > 0) { average += field[index - 1]; denominator++; }
        if (x < WIDTH - 1) { average += field[index + 1]; denominator++; }

        average /= 4;;
        velocity[index] = (velocity[index] + (average - height) * denominator / 2) * DAMPING;
        newField[index] = height + velocity[index];
      }
    }
  }

  // Now do the left and right edges
  for (var x = 0; x < WIDTH; x += WIDTH - 1) {
    for (var z = 1; z < HEIGHT - 1; z++) {
      if (!isBarrier(x, z)) {
        var index = x + (z * WIDTH);
        var height = field[index];
        var average = 0;
        var denominator = 0;

        if (z > 0) { average += field[index - WIDTH]; denominator++; }
        if (z < HEIGHT - 1) { average += field[index + WIDTH]; denominator++; }
        if (x > 0) { average += field[index - 1]; denominator++; }
        if (x < WIDTH - 1) { average += field[index + 1]; denominator++; }

        average /= 4;;
        velocity[index] = (velocity[index] + (average - height) * denominator / 2) * DAMPING;
        newField[index] = height + velocity[index];
      }
    }
  }

  // Finally do the bit in the middle
  for (var z = 1; z < HEIGHT - 1; z++) {
    for (var x = 1; x < WIDTH - 1; x++) {
      if (!isBarrier(x, z)) {
        var index = x + z * WIDTH;
        var height = field[index];
        var average = (field[index - 1] + field[index + 1] + field[index - WIDTH] + field[index + WIDTH]) / 4;

        velocity[index] = (velocity[index] + ((average - height) * 2)) * DAMPING;
        newField[index] = height + velocity[index];
      }
    }
  }

  // Start using the new field
  fields[0] = newField;
  fields[1] = field;
  field = newField;
}

function updateLightSource()
{
  if (pointLightSun != undefined) {
    var linearPeriodFactor = (200 * time) / DAY_PERIOD;
    var wavePeriodFactor = time * 2 * Math.PI / DAY_PERIOD
    var cosP = Math.cos(wavePeriodFactor);

    pointLightSun.position.set((linearPeriodFactor % 200) - 100, 0, -5 + 5 * cosP);
    pointLightMoon.position.set(((linearPeriodFactor + 100) % 200) - 100, 0, -5 - 5 * cosP);
  }
}

// Animate a frame
function animate() {
  if (paused) {
    return;
  }

  requestAnimationFrame(animate);

  if (touchDuration > 0) {
    var midX = Math.floor(touchCoordX * WIDTH);
    var midZ = Math.floor(touchCoordY * HEIGHT);
    handleTouch(midX, midZ);
    touchDuration--;
  }

  swipeDuration--;

  for (var index = 0; index < bellDurations.length; index++) {
    bellDurations[index]--;
  }

  t++;

  updateField();

  // Calculate the surface normals for graphics and rocking buoys
  var normals = geometry.attributes.normal.array;

  for (var z = 1; z < HEIGHT - 1; z++) {
    for (var x = 1; x < WIDTH - 1; x++) {
      var vector1 = [-2, (field[(x - 1) + z * WIDTH] - field[(x + 1) + z * WIDTH]), 0];
      var vector2 = [0, (field[x + (z - 1) * WIDTH] - field[x + (z + 1) * WIDTH]), 2];
      var indexOffset = (x * 3) + (z * 3 * WIDTH);

      normals[0 + indexOffset] = (vector1[1] * vector2[2]) - (vector1[2] * vector2[1]);
      normals[1 + indexOffset] = (vector1[2] * vector2[0]) - (vector1[0] * vector2[2]);
      normals[2 + indexOffset] = (vector1[0] * vector2[1]) - (vector1[1] * vector2[0]);
    }
  }

  geometry.attributes.normal.needsUpdate = true;

  // Update the heights of vertices
  var vertices = geometry.attributes.position.array;

  for (var i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3) {
    vertices[j + 1] = field[i];
  }

  geometry.attributes.position.needsUpdate = true;

  // Make buoys rock
  for (var ii = 0; ii < buoys.length; ii++) {
    var buoy = buoys[ii];
    var fieldIndex = translate(buoy.position.x, buoy.position.z);
    var buoyY = field[fieldIndex] - 10;
    buoy.position.set(buoy.position.x, -10, buoy.position.z);

    var buoyNormalX = normals[fieldIndex * 3];
    var buoyNormalY = normals[fieldIndex * 3 + 1];
    var buoyNormalZ = normals[fieldIndex * 3 + 2];
    buoy.lookAt(new THREE.Vector3(10 * buoyNormalX, 25 * buoyNormalY - 100 + buoyY, 10 * buoyNormalZ));

    checkBuoyStatus(buoy, ii, buoyY);
  }

  updateLightSource();

  renderer.render(scene, camera);
}
