import './style.css';
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import * as dat from 'dat.gui';


// Statistic Panel Data:
const getElemet = document.querySelector(".statisPanel");
const getShow = document.querySelector(".show");

getElemet.addEventListener("click", function () {
  console.log(getElemet);
  getElemet.style.transform = "translateY(-335px)";
  getShow.style.opacity = "1";
});

getShow.addEventListener("click", function () {
  getElemet.style.transform = "";
  console.log(getElemet);

  // Reset the transform property:
  setTimeout(function () {
    getElemet.style.transform = "translateY(0px)";
    getShow.style.opacity = "0";
  }, 200);
});

// Cursor:
const cursor = {
  x: 0,
  y: 0
}

window.addEventListener('mousemove', (event) => {
  cursor.x = event.clientX / sizes.width - 0.5;
  cursor.y = - (event.clientY / sizes.height - 0.5);
});

// Sizes:
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

// Parameters:
const parameters = {
  color: 0xffff00
}

// Canvas:
const canvas = document.querySelector('canvas.webgl');

// Scene:
const scene = new THREE.Scene();

// Axes Helper:
const helper = new THREE.AxesHelper(100);
scene.add(helper);


// SkyBox:
const skyTexture = new THREE.CubeTextureLoader().load([
  '/Standard-Cube-Map/px.png',
  '/Standard-Cube-Map/nx.png',
  '/Standard-Cube-Map/py.png',
  '/Standard-Cube-Map/ny.png',
  '/Standard-Cube-Map/pz.png',
  '/Standard-Cube-Map/nz.png',
]);

const shader = THREE.ShaderLib['cube'];
shader.uniforms['tCube'].value = skyTexture;

const skyBoxMaterial = new THREE.ShaderMaterial({
  fragmentShader: shader.fragmentShader,
  vertexShader: shader.vertexShader,
  uniforms: shader.uniforms,
  depthWrite: false,
  side: THREE.BackSide
});

const skyBoxGeometry = new THREE.BoxGeometry(10000, 10000, 10000);
const skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
scene.add(skyBox);

// skyTexture.generateMipmaps = false
// skyTexture.minFilter = THREE.NearestFilter
// skyTexture.magFilter = THREE.NearestFilter


// Parachuter (temporarily):
const parachuterGeometry = new THREE.BoxGeometry(50, 50, 50);
const parachuterMaterial = new THREE.MeshBasicMaterial({ color: parameters.color });
const parachuter = new THREE.Mesh(parachuterGeometry, parachuterMaterial);
parachuter.position.y = 5000;
scene.add(parachuter);

// Dat GUI:
const gui = new dat.GUI({ width: 300 });
gui.add(parachuterMaterial, 'visible');
gui.add(parachuterMaterial, 'wireframe');
gui.addColor(parameters, 'color').onChange(() => {
  parachuterMaterial.color.set(parameters.color)
});

// Camera:
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 10000);
camera.position.set(parachuter.position.x + 100, parachuter.position.y + 100, parachuter.position.z);
skyBox.position.set(camera.position.x, camera.position.y, camera.position.z);

window.addEventListener('resize', () => {

  // Update The Size:
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update Aspect Ration:
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update the Render:
  renderer.setSize(sizes.width, sizes.height);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
})

window.addEventListener('dblclick', () => {
  if (!document.fullscreenElement) {
    canvas.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
})


// Renderer:
const renderer = new THREE.WebGLRenderer({ canvas: canvas })
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Create a controls object using PointerLockControls:
const controlsPointerLock = new PointerLockControls(camera, document.body);
const controlsOrbit = new OrbitControls(camera, canvas);
controlsOrbit.enableDamping = true;
controlsOrbit.maxDistance = 1000;
controlsOrbit.minDistance = 200;
controlsOrbit.maxPolarAngle = Math.PI;

controlsPointerLock.target = parachuter.position;
controlsOrbit.target = parachuter.position;
controlsPointerLock.distance = 5;
controlsOrbit.distance = 5;


// Add the controls to the scene:
scene.add(controlsPointerLock.getObject());

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// Set up the movement speed:
const speed = 100;

// Set up the keyboard event handlers:
document.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'ArrowUp':
      direction.z = -1;
      break;
    case 'ArrowLeft':
      direction.x = -1;
      break;
    case 'ArrowDown':
      direction.z = 1;
      break;
    case 'ArrowRight':
      direction.x = 1;
      break;
    case 'KeyQ':
      direction.y = -1;
      break;
    case 'KeyE':
      direction.y = 1;
      break;
  }
});

document.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'ArrowUp':
      direction.z = 0;
      break;
    case 'ArrowLeft':
      direction.x = 0;
      break;
    case 'ArrowDown':
      direction.z = 0;
      break;
    case 'ArrowRight':
      direction.x = 0;
      break;
    case 'KeyQ':
      direction.y = 0;
      break;
    case 'KeyE':
      direction.y = 0;
      break;
  }
});

// Set up the animation loop:
let prevTime = performance.now();

const animate = () => {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const delta = (currentTime - prevTime) / 1000;
  prevTime = currentTime;

  // Calculate the movement vector:
  velocity.x = direction.x * speed;
  velocity.y = direction.y * speed;
  velocity.z = direction.z * speed;

  // Move the controls based on the movement vector and delta time:
  controlsPointerLock.moveForward(-velocity.z * delta);
  controlsPointerLock.moveRight(velocity.x * delta);
  controlsPointerLock.getObject().position.y += velocity.y * delta;
  controlsOrbit.update();

  // Player Movement: 
  if (parachuter.position.y != 25) {
    parachuter.position.y -= 5;

    camera.position.y = parachuter.position.y + 150;
  }
  // -----------------

  // Update the renderer:
  renderer.render(scene, camera);
};

animate();