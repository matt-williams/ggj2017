var scene, camera, renderer;
var geometry, mesh;
var pointLightSun, pointLightMoon;
var simpleMesh;

var paused = true;
var transitioning = false;

var t = 0;
var map;
var currentScene = 0;
var WIDTH, HEIGHT;
var WORLD_WIDTH, WORLD_HEIGHT;
var DAMPING = 0.995;
var TOUCH_FORCE = 1.7;
var WAVE_PERIOD_FACTOR = 0.15;
var WAVE_GAUSSIAN_RADIUS = 5;
var velocity, fields, field;

var barriers;
var barriersMovement;

var TICK_COUNT_REQ = 5;
var buoys;
var buoysTickCount;
var buoysActive;
var bellDurations;

var gates;

var touch = document.getElementById("container");
var touchCoordX = 0;
var touchCoordY = 0;
var touchDuration = 0;
var touched = false;

var enterDown = false;
var leftDown = false;
var rightDown = false;
var upDown = false;
var downDown = false;
var cursorX = 0;
var cursorY = 0;
var manualTouchDuration = 0;
var twoPlayer = false;
var currentScene2 = 0;
var player2;

var DAY_PERIOD = 24 * 60;

var SOUND_PATH = "https://raw.githubusercontent.com/matt-williams/ggj2017/master/sounds/"
var dropSound = null;
var swipeSound = null;
var swipeDuration = 0;
var bellSound = null;
var context;

var text;
var started = false;

// Use a Raycaster to work out where a mouse event's coordinates relates to in world space
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var barrierCheck = new THREE.Vector2();

function updateTouchCoords(event) {
  var x = event.clientX || event.pageX;
  var y = event.clientY || event.pageY;

  if (isNaN(x) || isNaN(y)) {
    return false;
  } else {
    mouse.x = x / window.innerWidth * 2 - 1;
    mouse.y = 1 - y / window.innerHeight * 2;
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects([simpleMesh]);

    if (intersects.length > 0) {
      touchCoordX = intersects[0].point.x / (WIDTH / 10) + 0.5;
      touchCoordY = intersects[0].point.z / (HEIGHT / 10) + 0.5;
      touchDuration = Math.PI / WAVE_PERIOD_FACTOR;

      if (event.type == "touchstart" || event.type == "mousedown") {
        playSound(dropSound);
      } else if (swipeDuration <= 0) {
        playSound(swipeSound);
        swipeDuration = 30;
      }

      return true;
    }
  }

  return false;
}

// Event handlers
function onDocumentTouchStart( event ) {
  if (!started) {
    start();
  } else {
    touched = updateTouchCoords(event) || touched;
  }
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
  if (!started) {
    start();
  } else {
    if (event.which == 32) {
      console.log("space");
      if (twoPlayer) {
        loadScene((currentScene2 + 1) % maps2.length);
      } else {
        loadScene((currentScene + 1) % maps.length);
      }
    } else if ((event.which == 8) || (event.which == 179)) {
      console.log("Amazon skip");

      if (twoPlayer) {
        loadScene((currentScene2 + 1) % maps2.length);
      } else {
        loadScene((currentScene + 1) % maps.length);
      }
    } else if (event.which == 50) {
      console.log(twoPlayer, currentScene, currentScene2, maps, maps2);
      if (twoPlayer) {
        twoPlayer = false;
        loadScene(currentScene);
      } else {
        twoPlayer = true;
        loadScene(currentScene2);
      }
    }
  }
}

function onDocumentKeyDown( event ) {
  if (event.which == 13) {
    console.log("enter");
    enterDown = true;
  } else if (event.which == 37) {
    leftDown = true;
  } else if (event.which == 38) {
    upDown = true;
  } else if (event.which == 39) {
    rightDown = true;
  } else if (event.which == 40) {
    downDown = true;
  }
}

function onDocumentKeyUp( event ) {
  if (event.which == 13) {
    enterDown = false;
  } else if (event.which == 37) {
    leftDown = false;
  } else if (event.which == 38) {
    upDown = false;
  } else if (event.which == 39) {
    rightDown = false;
  } else if (event.which == 40) {
    downDown = false;
  }
}

function onError( error ) {
  console.log("Error: " + error);
}

// Utility function to determine whether a point is in a barrier
function isBarrier(x, z) {
  for (var ii = 0; ii < map.barriers.length; ii++) {
    var barrier = map.barriers[ii];

    if (!barriers[ii].visible) {
      continue;
    }

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
    } else if (!barrier.movement) {
      if ((x >= barrier.x) &&
          (x < barrier.x + barrier.dx) &&
          (z >= barrier.z) &&
          (z < barrier.z + barrier.dz)) {
        return true;
      }
    } else {
      var barrierMesh = barriers[ii];
      var bX = translateX(barrierMesh.position.x);
      var bZ = translateZ(barrierMesh.position.z);

      if ((x >= bX - barrier.dx) &&
          (x < bX) &&
          (z >= bZ - barrier.dz / 2) &&
          (z < bZ + barrier.dz / 2)) {
        return true;
      }
    }
  }

  return false;
}

// Utility function to determine whether a point is part of a collector
function isCollector(x, z) {
  for (var ii = 0; ii < map.collectors.length; ii++) {
    var collector = map.collectors[ii];

    if ((x >= collector.x) &&
        (x < collector.x + collector.dx) &&
        (z >= collector.z) &&
        (z < collector.z + collector.dz)) {
      return collector;
    }
  }

  return false;
}

// Utility function to determine whether a point is part of a portal
function isPortal(x, z) {
  for (var ii = 0; ii < map.portals.length; ii++) {
    var portal = map.portals[ii];

    if ((x >= portal.x) &&
        (x < portal.x + portal.dx) &&
        (z >= portal.z) &&
        (z < portal.z + portal.dz)) {
      return portal;
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
  barriersMovement = [];

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
    barriers[ii].gate = barrier.gate;
    barriersMovement[ii] = barrier.movement;

    if (barriersMovement[ii]) {
      barriersMovement[ii].x0 = barrier.x + dx2;
      barriersMovement[ii].z0 = barrier.z + dz2;
    }

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

// Utility function to load collectors for the map
function loadCollectors() {
  if (map.collectors == undefined) {
    map.collectors = [];
    return;
  }

  var collectorGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
  var collectorMaterial = new THREE.MeshPhongMaterial({color: 0xaa6622, shininess: 100});

  for (var ii = 0; ii < map.collectors.length; ii++) {
    var collector = map.collectors[ii];
    collector.cumTotal = 0;
    collector.currentField = null;
    var midX = collector.x + (collector.dx / 2);
    var midZ = collector.z + (collector.dz / 2);
    var collectorMesh = new THREE.Mesh(collectorGeometry, collectorMaterial);
    collectorMesh.scale.set(collector.dx / 10, 2, collector.dz / 10);
    collectorMesh.position.set(midX / 10 - (WORLD_WIDTH / 2), -10, midZ / 10 - (WORLD_HEIGHT / 2));
    scene.add(collectorMesh);
  }
}

// Utility function to load portals for the map
function loadPortals() {
  if (map.portals == undefined) {
    map.portals = [];
    return;
  }

  var portalGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
  var portalMaterial = new THREE.MeshPhongMaterial({color: 0xff00ff, shininess: 100});

  for (var ii = 0; ii < map.portals.length; ii++) {
    var portal = map.portals[ii];
    var dx2, dz2, midX, midZ;
    var midX, midZ;

    if (portal.invert) {
      dx2 = portal.dz / 2;
      dz2 = portal.dx / 2;
    } else {
      dx2 = portal.dx / 2;
      dz2 = portal.dz / 2;
    }

    if (typeof portal.px !== 'undefined') {
      midX = portal.x + portal.px + dx2;
      midZ = portal.z + portal.pz + dz2;
    } else {
      midX = portal.ax + dx2;
      midZ = portal.az + dz2;
    }

    var portalMesh = new THREE.Mesh(portalGeometry, portalMaterial);

    if (portal.invert) {
      portalMesh.scale.set(portal.dz / 10, 2, portal.dx / 10);
    } else {
      portalMesh.scale.set(portal.dx / 10, 2, portal.dz / 10);
    }

    portalMesh.position.set(midX / 10 - (WORLD_WIDTH / 2), -10, midZ / 10 - (WORLD_HEIGHT / 2));
    scene.add(portalMesh);
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

// Utility function to load buoys for the map
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
    buoys[ii].movement = buoy.movement;

    if (buoys[ii].movement) {
      buoys[ii].movement.x0 = buoy.x;
      buoys[ii].movement.z0 = buoy.z;
    }

    buoysTickCount[ii] = 0;
    buoysActive[ii] = false;
    bellDurations[ii] = 0;
    scene.add(buoyMesh);
  }
}

// Utility function to load gates for the map
function loadGates() {
  gates = [];

  if (map.gates == undefined) {
    map.loadGates = [];
    return;
  }

  var gateGeometry = new THREE.ConeBufferGeometry(0.5, 2.5, 100);

  for (var ii = 0; ii < map.gates.length; ii++) {
    var gate = map.gates[ii];
    var gateMaterial = new THREE.MeshPhongMaterial({color: 0xffcc88, shininess: 100});
    var gateMesh = new THREE.Mesh(gateGeometry, gateMaterial);
    gates[ii] = gateMesh;
    gateMesh.position.set((gate.x / 10) - (WORLD_WIDTH / 2), -10, (gate.z / 10) - (WORLD_HEIGHT / 2));

    if (gates[ii].movement) {
      gates[ii].movement.x0 = gate.x;
      gates[ii].movement.z0 = gate.z;
    }

    gates[ii].count = 0;
    gates[ii].bellDuration = 0;
    scene.add(gateMesh);
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

        if (twoPlayer) {
          setTimeout(function() {loadScene((currentScene2 + 1) % maps2.length);}, 500);
        } else {
          setTimeout(function() {loadScene((currentScene + 1) % maps.length);}, 500);
        }
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

// Utility function to check gate status, update colour, and maybe deactivate barriers
function checkGateStatus(gate, index, gateY) {
  var gateOnSensitivity = map.gates[index].onSensitivity || -11;
  var gateOffSensitivity = map.gates[index].offSensitivity || -9;
  //console.log(index, gateY, gatesOnSensitivity, gates[index].count);

  if (gateY < gateOnSensitivity) {
    gates[index].count++;

    if (gates[index].count > TICK_COUNT_REQ) {
      if (gates[index].bellDuration <= 0) {
        playSound(bellSound);
        gates[index].bellDuration = 100;
      }

      gate.material.color.setHex(0xff0088);

      // Make certain barriers inactive
      for (var ii = 0; ii < barriers.length; ii++) {
        var barrier = barriers[ii];

        if (barrier.gate == index) {
          barrier.visible = false;
        }
      }
    } else {
      gate.material.color.setHex(0xff0088);
    }
  } else if (gateY > gateOffSensitivity)  {
    gate.material.color.setHex(0xffcc88);
    gates[index].count = 0;

    // Make the barriers active again
    for (var ii = 0; ii < barriers.length; ii++) {
      var barrier = barriers[ii];

      if (barrier.gate == index) {
        barrier.visible = true;
      }
    }
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

init();

// Initialize, load and animate the first scene
function start() {
  started = true;
  document.body.removeChild(text);
  loadScene(0);
  animate();
}

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
  document.addEventListener("keydown", onDocumentKeyDown, false);
  document.addEventListener("keyup", onDocumentKeyUp, false);
  document.addEventListener("touchstart", onDocumentTouchStart, false);
  document.addEventListener("touchmove", onDocumentTouchMove, false);
  document.addEventListener("touchend", onDocumentTouchStop, false);
  document.addEventListener("touchforcechange", onDocumentKeyPress, false);

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

  text = document.createElement('div');
  text.style.position = 'absolute';
  text.style.width = 100;
  text.style.height = 100;
  text.style.color = "lightblue";
  text.style.textAlign = "justify";
  text.innerHTML = "<h1>Buoys Will Be Buoys</h1>" +
                   "<h2>Global Game Jame 2016 (Waves)</h2>" +
                   "<br><br>" +
                   "Tap or drag to make waves in the water, and try to expose (red) buoys, making them green.<br>" +
                   "Sometimes shields hinder your tapping, and other times obstacles obstruct the waves.<br>" +
                   "Later levels introduce other challenges you'll just have to see for yourselves.<br>" + 
                   "<br>" + 
                   "You'll need to consider interference, resonance, reflection, diffraction and more to succeed.<br>" +
                   "<br><br><br>" +
                   "Press space if you struggle with a level to skip it (but try to solve it again later).<br>" +
                   "<br>" + 
                   "Press 2 to toggle between 1- and 2- player, with the second player using the arrow keys and Enter.<br>" +
                   "<br><br><br>" +
                   "<h2>Click with the mouse or press any key to start<h2>";
  text.style.left = 100 + 'px';
  text.style.top = 50 + 'px';
  document.body.appendChild(text);
}

// Function to load scenes
function loadScene(sceneNumber) {
  paused = true;
  transitioning = false;
  scene = new THREE.Scene();

  if (twoPlayer) {
    map = maps2[sceneNumber];
  } else {
    map = maps[sceneNumber];
  }

  scene.add(pointLightSun);
  scene.add(pointLightMoon);

  WIDTH = map.size.dx;
  HEIGHT = map.size.dz;
  WORLD_WIDTH = Math.round(WIDTH / 10);
  WORLD_HEIGHT = Math.round(HEIGHT / 10);
  velocity = new Float64Array(WIDTH * HEIGHT);
  fields = [new Float64Array(WIDTH * HEIGHT), new Float64Array(WIDTH * HEIGHT)];
  field = fields[0];

  cursorX = WIDTH / 2;
  cursorY = HEIGHT / 2;

  if (twoPlayer) {
    var cursorGeometry = new THREE.ConeBufferGeometry(0.125, 1.25, 100);
    var cursorMaterial = new THREE.MeshPhongMaterial({color: 0xffffff, shininess: 0});
    player2 = new THREE.Mesh(cursorGeometry, cursorMaterial);
    player2.position.set(0, -5, 0);
    scene.add(player2);
  }

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
  loadCollectors();
  loadPortals();
  loadUntappables();
  loadBuoys();
  loadGates();

  // Update the light source(s)
  updateLightSource();

  if (twoPlayer) {
    currentScene2 = sceneNumber;
  } else {
    currentScene = sceneNumber;
  }

  touched = false;
  touchDuration = 0;
  manualTouchDuration = 0;
  paused = false;
}

// Functions to get from coordinates of an object to the grid index
function translateX(x) {
  var trX = Math.round(x + (WORLD_WIDTH / 2)) * 10;
  return trX;
}

function translateZ(z) {
  var trZ = Math.round(z + (WORLD_HEIGHT / 2)) * 10;
  return trZ;
}

function translate(x, z) {
  var position = translateX(x) + (translateZ(z) * WIDTH);
  return position;
}

function untranslateX(x) {
  var unX = (x / 10) - (WORLD_WIDTH / 2);
  return unX;
}

function untranslateZ(z) {
  var unZ = (z / 10) - (WORLD_HEIGHT / 2);
  return unZ;
}

// Utility function to handle touches, which may come from the mouse or remote sources
function handleTouch(touchX, touchZ, manual) {
  if (isTappable(touchX, touchZ)) {
    var cosT;

    if (manual) {
      cosT = Math.cos(manualTouchDuration * WAVE_PERIOD_FACTOR);
    } else {
      cosT = Math.cos(touchDuration * WAVE_PERIOD_FACTOR);
    }

    for (var z = -WAVE_GAUSSIAN_RADIUS; z <= WAVE_GAUSSIAN_RADIUS; z++) {
      for (var x = -WAVE_GAUSSIAN_RADIUS; x <= WAVE_GAUSSIAN_RADIUS; x++) {
        if ((x + touchX > 0) && (x + touchX < WIDTH) && (z + touchZ > 0) && (z + touchZ < HEIGHT)) {
          velocity[x + touchX + (z + touchZ) * WIDTH] += TOUCH_FORCE * Math.exp((-x * x - z * z) / 2) * cosT;
        }
      }
    }
  }
}

// Function to handle updating a collector
function updateCollector(collector, velocity, currentField) {
  if (!collector.currentField) {
    collector.cumTotal += velocity * velocity;

    if (collector.cumTotal > collector.capacity * collector.capacity) {
      collector.currentField = field;
    }
  } else {
    if (collector.currentField == currentField) {
      collector.cumTotal = -5000;
      return true;
    } else if (collector.cumTotal < collector.capacity * collector.capacity) {
      collector.currentField = null;
    }
  }

  return false;
}

// Utility functions for common average calculations
function portalAverageDenominator(portal, x, z) {
  var xP, zP, indexP;

  if (typeof portal.px !== 'undefined') {
    xP = x + portal.px;
    zP = z + portal.pz;
  } else {
    if (portal.invert) {
      xP = x + (portal.ax - portal.z);
      zP = z + (portal.az - portal.x);
    } else {
      xP = x + (portal.ax - portal.x);
      zP = z + (portal.az - portal.z);
    }
  }

  if (portal.invert) {
    indexP = zP + (xP * WIDTH);
  } else {
    indexP = xP + (zP * WIDTH);
  }

  var average = 0;
  var denominator = 0;
  if (indexP - WIDTH >= 0) { average += field[indexP - WIDTH]; denominator++; }
  if (indexP + WIDTH < WIDTH * HEIGHT) { average += field[indexP + WIDTH]; denominator++; }
  if (indexP > 0) { average += field[indexP - 1]; denominator++; }
  if (indexP < WIDTH * HEIGHT - 1) { average += field[indexP + 1]; denominator++; }

  return [average, denominator];
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

        var portal = isPortal(x, z);

        if (portal) {
          var avDenom = portalAverageDenominator(portal, x, z);
          average = avDenom[0];
          denominator = avDenom[1];
        } else {
          if (z > 0) { average += field[index - WIDTH]; denominator++; }
          if (z < HEIGHT - 1) { average += field[index + WIDTH]; denominator++; }
          if (x > 0) { average += field[index - 1]; denominator++; }
          if (x < WIDTH - 1) { average += field[index + 1]; denominator++; }
        }

        var collector = isCollector(x, z);
        average /= 4;
        var newVelocity = (velocity[index] + (average - height) * denominator / 2) * DAMPING;

        if (collector) {
          if (updateCollector(collector, newVelocity, newField)) {
            velocity[index] = collector.yield;
          } else {
            velocity[index] = 0;
          }
        } else {
          velocity[index] = newVelocity;
        }

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

        var portal = isPortal(x, z);

        if (portal) {
          var avDenom = portalAverageDenominator(portal, x, z);
          average = avDenom[0];
          denominator = avDenom[1];
        } else {
          if (z > 0) { average += field[index - WIDTH]; denominator++; }
          if (z < HEIGHT - 1) { average += field[index + WIDTH]; denominator++; }
          if (x > 0) { average += field[index - 1]; denominator++; }
          if (x < WIDTH - 1) { average += field[index + 1]; denominator++; }
        }

        var collector = isCollector(x, z);
        average /= 4;
        var newVelocity = (velocity[index] + (average - height) * denominator / 2) * DAMPING;

        if (collector) {
          if (updateCollector(collector, newVelocity, newField)) {
            velocity[index] = collector.yield;
          } else {
            velocity[index] = 0;
          }
        } else {
          velocity[index] = newVelocity;
        }

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
        var average = 0;

        var portal = isPortal(x, z);

        if (portal) {
          var avDenom = portalAverageDenominator(portal, x, z);
          average = avDenom[0];
        } else {
          average += (field[index - 1] + field[index + 1] + field[index - WIDTH] + field[index + WIDTH]) / 4;
        }

        var collector = isCollector(x, z);
        var newVelocity = (velocity[index] + (average - height) * 2) * DAMPING;

        if (collector) {
          if (updateCollector(collector, newVelocity, newField)) {
            velocity[index] = collector.yield;
          } else {
            velocity[index] = 0;
          }
        } else {
          velocity[index] = newVelocity;
        }

        newField[index] = height + velocity[index];
      }
    }
  }

  // Start using the new field
  fields[0] = newField;
  fields[1] = field;
  field = newField;
}

function updateLightSource() {
  if (pointLightSun != undefined) {
    var date = new Date;
    date.getTime(Date.getTime);
    var time = date.getHours() * 60 + date.getMinutes();
    var linearPeriodFactor = (200 * time) / DAY_PERIOD;
    var wavePeriodFactor = time * 2 * Math.PI / DAY_PERIOD
    var cosP = Math.cos(wavePeriodFactor);

    pointLightSun.position.set((linearPeriodFactor % 200) - 100, 0, -5 + 5 * cosP);
    pointLightMoon.position.set(((linearPeriodFactor + 100) % 200) - 100, 0, -5 - 5 * cosP);
  }
}

function updateBarriers() {
  for (var ii = 0; ii < barriers.length; ii++) {
    if (barriersMovement[ii]) {
      var barrier = barriers[ii];
      var target = barriersMovement[ii];
      var bX = untranslateX(target.x0);
      var bZ = untranslateZ(target.z0);
      var tX = untranslateX(target.x);
      var tZ = untranslateZ(target.z);

      if (t % target.duration > target.duration / 2) {
        var tProg = ((t % target.duration) - (target.duration / 2)) / (target.duration / 2);
        barrier.position.set(bX * tProg + tX * (1 - tProg), barrier.position.y, bZ * tProg + tZ * (1 - tProg));
      } else {
        var tProg = (t % target.duration) / (target.duration / 2);
        barrier.position.set(tX * tProg + bX * (1 - tProg), barrier.position.y, tZ * tProg + bZ * (1 - tProg));
      }
    }
  }
}

function updateBuoys() {
  for (var ii = 0; ii < buoys.length; ii++) {
    if (buoys[ii].movement) {
      var buoy = buoys[ii];
      var target = buoy.movement;
      var bX = untranslateX(target.x0);
      var bZ = untranslateZ(target.z0);
      var tX = untranslateX(target.x);
      var tZ = untranslateZ(target.z);

      if (t % target.duration > target.duration / 2) {
        var tProg = ((t % target.duration) - (target.duration / 2)) / (target.duration / 2);
        buoy.position.set(bX * tProg + tX * (1 - tProg), buoy.position.y, bZ * tProg + tZ * (1 - tProg));
      } else {
        var tProg = (t % target.duration) / (target.duration / 2);
        buoy.position.set(tX * tProg + bX * (1 - tProg), buoy.position.y, tZ * tProg + bZ * (1 - tProg));
      }
    }
  }
}

function rockBuoys(normals) {
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
}

function rockGates(normals) {
  for (var ii = 0; ii < gates.length; ii++) {
    var gate = gates[ii];
    var fieldIndex = translate(gate.position.x, gate.position.z);
    var gateY = field[fieldIndex] - 10;
    gate.position.set(gate.position.x, -10, gate.position.z);

    var gateNormalX = normals[fieldIndex * 3];
    var gateNormalY = normals[fieldIndex * 3 + 1];
    var gateNormalZ = normals[fieldIndex * 3 + 2];
    gate.lookAt(new THREE.Vector3(10 * gateNormalX, 25 * gateNormalY - 100 + gateY, 10 * gateNormalZ));

    checkGateStatus(gate, ii, gateY);
  }
}

// Handle keyboard touches
function handleKeyboardTouches() {
  if (enterDown) {
    if (manualTouchDuration <= 0) {
      manualTouchDuration = Math.PI / WAVE_PERIOD_FACTOR;
    }
  }

  if (leftDown) {
    cursorX--;

    if (enterDown) {
      manualTouchDuration = Math.PI / WAVE_PERIOD_FACTOR;
    }
  }

  if (rightDown) {
    cursorX++;

    if (enterDown) {
      manualTouchDuration = Math.PI / WAVE_PERIOD_FACTOR;
    }
  }

  if (upDown) {
    cursorY--;

    if (enterDown) {
      manualTouchDuration = Math.PI / WAVE_PERIOD_FACTOR;
    }
  }

  if (downDown) {
    cursorY++;

    if (enterDown) {
      manualTouchDuration = Math.PI / WAVE_PERIOD_FACTOR;
    }
  }

  cursorX = (cursorX > 0) ? ((cursorX < WIDTH) ? cursorX : WIDTH) : 0;
  cursorY = (cursorY > 0) ? ((cursorY < HEIGHT) ? cursorY : HEIGHT) : 0;

  if (twoPlayer) {
    player2.position.x = untranslateX(cursorX);
    player2.position.z = untranslateZ(cursorY);
  }

  if (manualTouchDuration > 0) {
    handleTouch(cursorX, cursorY, true);
    manualTouchDuration--;
  }
}

// Animate a frame
function animate() {
  if (paused) {
    return;
  }

  requestAnimationFrame(animate);

  // Update the barriers and buoys
  updateBarriers();
  updateBuoys();

  // Handle touches
  if (touchDuration > 0) {
    var midX = Math.floor(touchCoordX * WIDTH);
    var midZ = Math.floor(touchCoordY * HEIGHT);
    handleTouch(midX, midZ);
    touchDuration--;
  }

  handleKeyboardTouches();

  // Adjust timers
  swipeDuration--;

  for (var index = 0; index < bellDurations.length; index++) {
    bellDurations[index]--;
  }

  t++;

  updateField();

  // Calculate the surface normals for graphics, and rocking buoys and gates
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

  // Make buoys and gates rock
  rockBuoys(normals);
  rockGates(normals);

  renderer.render(scene, camera);
}
