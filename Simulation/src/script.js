import './style.css';
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import * as dat from 'dat.gui';


// d = (1/2) * g * t ^ 2  the formula to calculate the distance surpassed of a free falling object

/* Variables */

// constants
let gravity_acc = 9.80665;
let airDensity = 1.225;
let w = 7.2921159  * Math.pow(10, -5); // rad/s angular velocity of earth's rotation (W->E)

// initial
let initial_Humidity_ratio = 0;
let initial_mass = 80; // 80
let initial_Altitude = 2200;
let initial_Area_of_the_body_Phase1 = 0.5;
let initial_Drag_Coefficient_Phase1 = 0.7;


let initial_Area_of_the_body_Phase2 = 3.5;
let initial_Drag_Coefficient_Phase2 = 1.5;

var t = 0;
var time = 1;

// controlled
let Humidity_ratio = initial_Humidity_ratio;
let mass = initial_mass; //80
let Altitude = initial_Altitude;
let Area_of_the_body_Phase1 = initial_Area_of_the_body_Phase1;
let Drag_Coefficient_Phase1 = initial_Drag_Coefficient_Phase1;

let current_Area = initial_Area_of_the_body_Phase1;

let Area_of_the_body_Phase2 = initial_Area_of_the_body_Phase2;
let Drag_Coefficient_Phase2 = initial_Drag_Coefficient_Phase2;

let Weight = new THREE.Vector3(0, 0, 0);
let dragForce = new THREE.Vector3(0, 0, 0); // y
let velocity = new THREE.Vector3(); //y and possibly x,z
let pressure;
let acceleration = new THREE.Vector3(0, 0, 0); //y and possibly x,z
let position = Altitude;

let gravity_present = true;
let phi = 0;
let is_deployed = false;
let is_dry = true;
let fps = 1;

/* /Variables */

/* Functions */

/* interpolating the opening of the parachute  */

function interpolate(start, end, x) {
  return start + (end - start) * (1 / (1 + Math.exp(-5 * (x - 0.5))));
}

function interpolate_drag_coeff(start, end, curr_area) {
  console.log(
    "current = " + curr_area + " // outa = " + Area_of_the_body_Phase2
  );
  return (
    start +
    (end - start) *
      Math.exp(-0.1 * Math.pow(curr_area / Area_of_the_body_Phase2 - 1, 2))
  );
}

function get_current_phase_area(t, Ref_Area) {
  if (is_deployed) {
    current_Area = interpolate(Area_of_the_body_Phase1, Ref_Area, t);
    return current_Area;
  } else {
    return Area_of_the_body_Phase1;
  }
}

function get_current_phase_drag_coeff(t) {
  if (is_deployed) {
    return interpolate(Drag_Coefficient_Phase1, Drag_Coefficient_Phase2, t);
  } else {
    return Drag_Coefficient_Phase1;
  }
}

function toggle_gravity() {
  if (!gravity_present) {
    return 0;
  } else {
    return gravity_acc;
  }
}

function calc_airDensity(altitude, phi) {
  const T0 = 288.15; // K
  const L = 0.0065; // Temperature lapse rate K/m
  const P0 = 101325; // Pa
  const Md = 0.0289652; // mol | equation: M=m/n | dry air molar mass
  const Mv = 0.018016; // mol | water vapor molar mass
  const R = 8.31446; // J/(K*mol) |' universal gas constant

  let T = T0 - L * altitude; // K

  let Psat_exponent = (7.5 * T) / (T + 237.3);
  let Psat = 6.1078 * Math.pow(10, Psat_exponent); // hecto-Pa

  let Pv = phi * Psat; // Pa

  let P_exponent = (gravity_acc * Md) / (R * L) - 1;
  let P_base = 1 - (L * altitude) / T0;
  let P = P0 * Math.pow(P_base, P_exponent);

  if (is_dry) return airDensity;
  return (P * Md + Pv * (Mv - Md)) / (R * T);
}

function degreesToRadians(degrees) {
  var radians = degrees * (Math.PI / 180);
  return radians;
}

// double check if the values are correct 
function coriolis(altitude, latitude) {
  // deflection = 1/3 sqrt(8 * h ^ 3 / g) * w * cos( lambda )

  let velocity_eastward = 4 * w * altitude * Math.cos(latitude);

  return velocity_eastward;
}



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

function degreesToRadians(degrees) {
  var radians = degrees * (Math.PI / 180);
  return radians;
}

function coriolis(altitude, latitude) {
  // deflection = 1/3 sqrt(8 * h ^ 3 / g) * w * cos( lambda )

  let velocity_eastward = 4 * w * altitude * Math.cos(latitude);

  return velocity_eastward;
}

// document.addEventListener("keydown", function (event) {
//   if (event.key == "o") {
//     // If it is, trigger a click event on the button
//     phi += Math.PI / 120;
//     cube.rotateZ(phi);
//   }
//   if (event.key == "p") {
//     // If it is, trigger a click event on the button
//     phi -= Math.PI / 120;
//     cube.rotateZ(phi);
//   }
//   if (event.key == "q") {
//     cube.rotateZ(-phi);
//     phi = 0;
//   }
//   if (event.key == "g") {
//     gravity_present = !gravity_present;
//   }
//   if (event.key == "h") {
//     is_dry = !is_dry;
//   }
// });

  // Reset the transform property after 2 seconds
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
  color: 0xff0000,
};

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

let deflection =
  (1 / 3) *
  Math.sqrt((8 * Math.pow(5000,3)) / gravity_acc) *
  w *
  Math.cos(45);

let SimulationSpeed= 0.01;

function insideAnimate() {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const delta = (currentTime - prevTime) / 100;
  prevTime = currentTime;

  // Calculate the movement vector:
  // velocity.x = direction.x * speed;
  // velocity.y = direction.y * speed;
  // velocity.z = direction.z * speed;

  // Move the controls based on the movement vector and delta time:
  controlsPointerLock.moveForward(-direction.z * delta);
  controlsPointerLock.moveRight(direction.x * delta);
  controlsPointerLock.getObject().position.y += direction.y * delta;

  controlsOrbit.update();


  // Player Movement:
  if (parachuter.position.y > 25) {
    /* prev code */

    if (is_deployed && current_Area < Area_of_the_body_Phase2) {
      t += 1 / speed;
      console.log(t);
    }

    Weight.setY(toggle_gravity() * mass);
    let velocity_squared = Math.pow(velocity.y, 2);

    // console.log(
    //   "air_density:" +
    //     calc_airDensity(parachuter.position.y, Humidity_ratio) +
    //     "\nvelocity^2 = " +
    //     velocity_squared +
    //     "\ndragC = " +
    //     get_current_phase_drag_coeff(t) +
    //     "\nphase_area = " +
    //     get_current_phase_area(t, Area_of_the_body_Phase2)
    // );

    dragForce.setY(
      0.5 *
        calc_airDensity(parachuter.position.y, Humidity_ratio) *
        velocity_squared *
        get_current_phase_drag_coeff(t) *
        get_current_phase_area(t, Area_of_the_body_Phase2)
    );

    // console.log("weight:" + Weight.y + "   drag:" + dragForce.y);
    acceleration.setY((Weight.y - dragForce.y) / mass);

    // if (acceleration.y < precision / 100 && acceleration.y > 0) {
    //   acceleration = 0;
    // }

    velocity.y+=acceleration.y*SimulationSpeed;
    velocity.z += coriolis(parachuter.position.y, 45)*SimulationSpeed;
    // Altitude -= velocity.y * SimulationSpeed;
    // position = Altitude - 0.5 * acceleration.y * Math.pow(SimulationSpeed, 2);

    /* prev code */

    if (parachuter.position.y - velocity.y >= 0) {
      parachuter.position.z += velocity.z*SimulationSpeed;
      parachuter.position.y -= velocity.y*SimulationSpeed;
    }

    camera.position.y = parachuter.position.y + 100;
    console.log(
      "alt = " +
        parachuter.position.y.toPrecision(5) +
        "\nv = " +
        velocity.y.toPrecision(3) +
        "\na = " +
        acceleration.y.toPrecision(3) +
        "\ndF = " +
        dragForce.y.toPrecision(3) +
        "\nW = " +
        Weight.y.toPrecision(3) +
        "\nv = " +
        velocity.y.toPrecision(3) +
        "\ntime = " +
        time +
        "\nV_coriolis = " +
        velocity.z.toPrecision(3)+
        "\ndeflection = " +
        deflection.toPrecision(3) +
        "\ntime = "+time
    );
  } else {
    parachuter.position.y = 25;
  }

  time+=SimulationSpeed;
  // console.log("\nvel="+velocity.y);

  // -----------------

  // Update the renderer:
  renderer.render(scene, camera);
}

let second = 1000;
const animate = () => {
  setTimeout(insideAnimate, 0);
};

animate();