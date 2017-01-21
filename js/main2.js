var scene, camera, renderer;
var geometry, material, mesh;
var waves;

function Waves(width, height, renderer) {
  this.width = width;
  this.height = height;
  this.renderer = renderer;
  this.activeTarget = 0;
  this.targets = [];
  for (var ii = 0; ii < 2; ii++) {
    this.targets.push(new THREE.WebGLRenderTarget(this.width, this.height, {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type: THREE.HalfFloatType, depthBuffer: false, stencilBuffer: false}));
  }
  this.vertexShader =
    "void main() {\n" +
    "  gl_Position = vec4(position, 1.0);\n" +
    "}";
  var initialShader = new THREE.ShaderMaterial({
    defines: {resolution: "vec2(" + this.width + ".0, " + this.height + ".0)"},
    vertexShader: this.vertexShader,
    fragmentShader: 
      "uniform sampler2D data;\n" +
      "void main() {\n" +
      "  vec2 uv = gl_FragCoord.xy / resolution;\n" +
      "  gl_FragColor = vec4(0.0, (1.0 - step(1.0, length(uv - 0.5) * 32.0)), 0.0, 1.0);\n" +
      "}"
  });
  this.shader = new THREE.ShaderMaterial({
    uniforms: {data: this.getTexture()},
    defines: {resolution: "vec2(" + this.width + ".0, " + this.height + ".0)"},
    vertexShader: this.vertexShader,
    fragmentShader: 
      "uniform sampler2D data;\n" +
      "void main() {\n" +
      "  vec2 uv = gl_FragCoord.xy / resolution;\n" +
      "  highp vec2 previous = texture2D(data, uv).rg;\n" +
      "  highp float position = previous.r;\n" +
      "  highp float velocity = previous.g;\n" +
      "  highp float average = (texture2D(data, uv + vec2(-1.0,  0.0) / resolution).r +\n" +
      "                         texture2D(data, uv + vec2( 1.0,  0.0) / resolution).r +\n" +
      "                         texture2D(data, uv + vec2( 0.0, -1.0) / resolution).r +\n" +
      "                         texture2D(data, uv + vec2( 0.0,  1.0) / resolution).r) / 4.0;\n" +
      "  highp float acceleration = (average - position) * 2.0;\n" +
      "  velocity = (velocity + acceleration) * 0.995;\n" +
      "  position = position + velocity;\n" +
      "  highp vec2 next = vec2(position, velocity);\n" +
      "  gl_FragColor = vec4(next, 0.0, 1.0);\n" +
      "}"
  });
  var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), initialShader);
  this.scene = new THREE.Scene();
  this.scene.add(mesh);
  this.camera = new THREE.Camera();
  this.camera.position.z = 1;

  this.renderer.render(this.scene, this.camera, this.targets[this.activeTarget]);
  mesh.material = this.shader;
}

Waves.prototype.update = function() {
  this.shader.uniforms.data.value = this.getTexture();
  this.activeTarget = (this.activeTarget + 1) % this.targets.length;
  this.renderer.render(this.scene, this.camera, this.targets[this.activeTarget]);
}

Waves.prototype.getTexture = function() {
  return this.targets[this.activeTarget].texture;
}

function init() {
  renderer = new THREE.WebGLRenderer({stencil: false});
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("container").appendChild(renderer.domElement);

  waves = new Waves(128, 128, renderer);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
  camera.rotation.x = -Math.PI / 6;
  camera.position.set(0, -3, 15);

  geometry = new THREE.PlaneBufferGeometry(20, 20, 127, 127);
  geometry.rotateX(-Math.PI / 2);
  material = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.ShaderLib[ 'phong' ].uniforms,
                                         {waves: {value: null}}]),
    defines: {resolution: "vec2(64.0, 64.0)",
              meshResolution: "vec2(20.0, 20.0)"},
    vertexShader:
      "uniform sampler2D waves;\n" +
      "#define PHONG\n" +
      "varying vec3 vViewPosition;\n" +
      "#ifndef FLAT_SHADED\n" +
      "varying vec3 vNormal;\n" +
      "#endif\n" +
      "#include <common>\n" +
      "#include <uv_pars_vertex>\n" +
      "#include <uv2_pars_vertex>\n" +
      "#include <displacementmap_pars_vertex>\n" +
      "#include <envmap_pars_vertex>\n" +
      "#include <color_pars_vertex>\n" +
      "#include <morphtarget_pars_vertex>\n" +
      "#include <skinning_pars_vertex>\n" +
      "#include <shadowmap_pars_vertex>\n" +
      "#include <logdepthbuf_pars_vertex>\n" +
      "#include <clipping_planes_pars_vertex>\n" +
      "void main() {\n" +
      "  #include <uv_vertex>\n" +
      "  #include <uv2_vertex>\n" +
      "  #include <color_vertex>\n" +
      "  //# include <beginnormal_vertex>\n" +
      "  vec3 objectNormal = vec3(\n" +
      "    (texture2D(waves, uv - vec2(1.0, 0.0) / resolution).r - texture2D(waves, uv + vec2(1.0, 0.0) / resolution).r) * resolution.x / meshResolution.x,\n" +
      "    1.0,\n" +
      "    (texture2D(waves, uv - vec2(0.0, 1.0) / resolution).r - texture2D(waves, uv + vec2(0.0, 1.0) / resolution).r) * resolution.y / meshResolution.y);\n" +
      "  //<beginnormal_vertex>\n" +
      "  #include <morphnormal_vertex>\n" +
      "  #include <skinbase_vertex>\n" +
      "  #include <skinnormal_vertex>\n" +
      "  #include <defaultnormal_vertex>\n" +
      "#ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED\n" +
      "  vNormal = normalize( transformedNormal );\n" +
      "#endif\n" +
      "  //# include <begin_vertex>\n" +
      "  float heightValue = texture2D(waves, uv).x;\n" +
      "  vec3 transformed = vec3(position.x, heightValue, position.z);\n" +
      "  //<begin_vertex>\n" +
      "  #include <displacementmap_vertex>\n" +
      "  #include <morphtarget_vertex>\n" +
      "  #include <skinning_vertex>\n" +
      "  #include <project_vertex>\n" +
      "  #include <logdepthbuf_vertex>\n" +
      "  #include <clipping_planes_vertex>\n" +
      "  vViewPosition = - mvPosition.xyz;\n" +
      "  #include <worldpos_vertex>\n" +
      "  #include <envmap_vertex>\n" +
      "  #include <shadowmap_vertex>\n" +
      "}",
    fragmentShader: THREE.ShaderChunk["meshphong_frag"]
  });

  material.lights = true;
  material.color = new THREE.Color(0x00003f);
  material.specular = new THREE.Color(0x222222);
  material.shininess = 50;
  // Sets the uniforms with the material values
  material.uniforms.diffuse.value = material.color;
  material.uniforms.specular.value = material.specular;
  material.uniforms.shininess.value = Math.max(material.shininess, 1e-4);
  material.uniforms.opacity.value = material.opacity;

  mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, -10, 0);
  scene.add(mesh);

  pointLightSun = new THREE.PointLight(0xffffff, 1, 100);
  pointLightSun.position.set(0, 0, -5);
  pointLightMoon = new THREE.PointLight(0x888888, 1, 100);
  pointLightMoon.position.set(0, 0, -5);
  scene.add(pointLightSun);
  scene.add(pointLightMoon);

  var directionalLight = new THREE.DirectionalLight(0x7f7f7f, 2);
  directionalLight.position.set(0, 1, 0);
  scene.add(directionalLight);

  var ambientLight = new THREE.AmbientLight(0x808080);
  scene.add(ambientLight);
}

function animate() {
  requestAnimationFrame(animate);

  waves.update();
  material.uniforms.waves.value = waves.getTexture();
  renderer.render(scene, camera);
}

init();
animate();

