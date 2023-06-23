import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import * as dat from "dat.gui";
import * as Constants from "./constants";
import * as Variables from "./variables";

// Parameters:
const physicsParameters = {
  mass: Variables.initial_mass,
};

// Parameters:
const parameters = {
  color: 0xff0000,
};

// Parameters

// d = (1/2) * g * t ^ 2  the formula to calculate the distance surpassed of a free falling object

/* Variables */
var startSimulation = false;
var t = 0;
var time = 1;
var loadHang = true;
var loadLanding = true;
var loadParachuteDeploy = true;

// controlled
let Humidity_ratio = Variables.initial_Humidity_ratio;
let mass = physicsParameters.mass;
let Altitude = Variables.initial_Altitude;
let Area_of_the_body_Phase1 = Variables.initial_Area_of_the_body_Phase1;
let Drag_Coefficient_Phase1 = Variables.initial_Drag_Coefficient_Phase1;

let current_Area = Variables.initial_Area_of_the_body_Phase1;

let Area_of_the_body_Phase2 = Variables.initial_Area_of_the_body_Phase2;
let Drag_Coefficient_Phase2 = Variables.initial_Drag_Coefficient_Phase2;

let Weight = new THREE.Vector3(0, 0, 0);
let dragForce = new THREE.Vector3(0, 0, 0); // y
let velocity = new THREE.Vector3(); //y and possibly x,z
let acceleration = new THREE.Vector3(0, 0, 0); //y and possibly x,z

let gravity_present = true;
let is_deployed = false;
let is_dry = false;
let Temperature_sea_level = 10;

/* /Variables */

/* Functions */

/* interpolating the opening of the parachute  */

function interpolate(start, end, x) {
  // Sigmoid function
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
    return Constants.GRAVITY_ACC;
  }
}

function calc_airDensity(altitude, phi, temperature_sea_level) {
  const T0 = temperature_sea_level + 273.15; // K
  const L = 0.0065; // Temperature lapse rate K/m
  const P0 = 101325; // Pa
  const Md = 0.0289652; // mol | equation: M=m/n | dry air molar mass
  const Mv = 0.018016; // mol | water vapor molar mass
  const R = 8.31446; // J/(K*mol) |' universal gas constant

  let T = T0 - L * altitude; // K

  let Psat_exponent = (7.5 * T) / (T + 237.3);
  let Psat = 6.1078 * Math.pow(10, Psat_exponent); // hecto-Pa

  let Pv = phi * Psat; // Pa

  let P_exponent = (Constants.GRAVITY_ACC * Md) / (R * L) - 1;
  let P_base = 1 - (L * altitude) / T0;
  let P = P0 * Math.pow(P_base, P_exponent);

  if (is_dry) return Constants.AIRDENSITY;
  return (P * Md + Pv * (Mv - Md)) / (R * T);
}

function degreesToRadians(degrees) {
  var radians = degrees * (Math.PI / 180);
  return radians;
}

// TODO: print parchuter coordinates

// TODO: double check if the values are correct
// function coriolis(altitude, latitude) {
//   // deflection = 1/3 sqrt(8 * h ^ 3 / g) * w * cos( lambda )

//   let velocity_eastward =
//     4 * Constants.W * altitude * Math.abs(Math.sin(latitude));

//   return velocity_eastward;
// }

const getElemet = document.querySelector(".statisPanel");
const getShow = document.querySelector(".show");

getElemet.addEventListener("click", function () {
  getElemet.style.transform = `translateY(${-getElemet.offsetHeight + 60}px)`;
  getShow.style.opacity = "1";
});

getShow.addEventListener("click", function () {
  getElemet.style.transform = "";

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

  // Reset the transform property
  setTimeout(function () {
    getElemet.style.transform = "translateY(0px)";
    getShow.style.opacity = "0";
  }, 200);
});

// Cursor:
const cursor = {
  x: 0,
  y: 0,
};

window.addEventListener("mousemove", (event) => {
  cursor.x = event.clientX / sizes.width - 0.5;
  cursor.y = -(event.clientY / sizes.height - 0.5);
});

// Sizes:
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Canvas:
const canvas = document.querySelector("canvas.webgl");

// Scene:
const scene = new THREE.Scene();

// Axes Helper:
const helper = new THREE.AxesHelper(100);
scene.add(helper);

// SkyBox:
const skyTexture = new THREE.CubeTextureLoader().load([
  "/Standard-Cube-Map/px.png",
  "/Standard-Cube-Map/nx.png",
  "/Standard-Cube-Map/py.png",
  "/Standard-Cube-Map/ny.png",
  "/Standard-Cube-Map/pz.png",
  "/Standard-Cube-Map/nz.png",
]);

const shader = THREE.ShaderLib["cube"];
shader.uniforms["tCube"].value = skyTexture;

const skyBoxMaterial = new THREE.ShaderMaterial({
  fragmentShader: shader.fragmentShader,
  vertexShader: shader.vertexShader,
  uniforms: shader.uniforms,
  depthWrite: false,
  side: THREE.BackSide,
});

const skyBoxGeometry = new THREE.BoxGeometry(100000, 100000, 200000);
const skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
scene.add(skyBox);

// Parachuter NOW

// Add a Model:
const loader = new FBXLoader();
var parachuteAnimationAction;
var model = new THREE.Group();
var parachute_model = new THREE.Group();
var model_loaded = false;
var parachute_translation_factor_x = 112;
var parachute_translation_factor_z = 20;

class LoadModel {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this._mixers = [];
    this._previousRAF = null;

    this._LoadAnimatedModel();
    this._RAF();
  }

  _LoadAnimatedModel() {
    const loader = new FBXLoader();
    const loader2 = new FBXLoader();
    loader.setPath("models/");
    loader2.setPath("models/");
    loader2.load("parachute.fbx", (fbx) => {
      fbx.scale.setScalar(1);
      fbx.rotateX(degreesToRadians(85));
      fbx.traverse((c) => {
        c.castShadow = true;
      });

      const m = new THREE.AnimationMixer(fbx);
      this._mixers.push(m);
      parachuteAnimationAction = m.clipAction(fbx.animations[0]);
      parachuteAnimationAction.timeScale = 0;
      parachuteAnimationAction.play();

      // const anim = new FBXLoader();
      // anim.setPath("models/");
      // anim.load("pubg parachute.fbx", (anim) => {
      //   const m = new THREE.AnimationMixer(parachute_model);
      //   this._mixers.push(m);
      //   parachuteAnimationAction = m.clipAction(anim.animations[0]);
      //   parachuteAnimationAction.timeScale = 0;
      //   parachuteAnimationAction.play();
      // });

      parachute_model = fbx;
      scene.add(parachute_model);
    });

    loader.load("skydiver.fbx", (fbx) => {
      fbx.scale.setScalar(1);
      
      const anim = new FBXLoader();
      anim.setPath("models/");
      anim.load("fallingAnim.fbx", (anim) => {
        const m = new THREE.AnimationMixer(fbx);
        this._mixers.push(m);
        const falling = m.clipAction(anim.animations[0]);
        falling.timeScale=1.5;
        falling.play();
      });

      model_loaded = true;
      console.log(model_loaded);
      model = fbx;
      scene.add(model);
    });
  }

  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }

      if (is_deployed && loadHang) {
        const anim = new FBXLoader();
        anim.setPath("models/");
        anim.load("HangingIdle.fbx", (anim) => {
          const m = new THREE.AnimationMixer(model);
          this._mixers.push(m);
          const idle = m.clipAction(anim.animations[0]);
          idle.play();
        });
        loadHang = false;
      }

      if (parachuter.position.y == 0 && loadLanding) {
        is_deployed = false;
        parachute_model.scale.set(0, 0, 0);
        const anim = new FBXLoader();
        anim.setPath("models/");
        anim.load("Falling To Roll.fbx", (anim) => {
          const m = new THREE.AnimationMixer(model);
          this._mixers.push(m);
          const idle = m.clipAction(anim.animations[0]);
          idle.play();
        });

        var self = this;
        setTimeout(() => {
          anim.load("Idle.fbx", (anim) => {
            const m = new THREE.AnimationMixer(model);
            self._mixers.push(m);
            const idle = m.clipAction(anim.animations[0]);
            idle.play();
            parachuter.position.z += 250;
          });
        }, 1500);

        loadLanding = false;
      }

      if (is_deployed && loadParachuteDeploy) {
        parachute_model.rotateX(degreesToRadians(-85));
        parachute_translation_factor_x += 35;
        parachute_translation_factor_z = 3;

        parachuteAnimationAction.timeScale = 1;
        parachuteAnimationAction.setLoop(THREE.LoopOnce);
        parachuteAnimationAction.play();

        loadParachuteDeploy = false;
      }

      model.position.copy(parachuter.position);
      parachute_model.position.set(
        parachuter.position.x,
        // parachuter.position.y + 280,
        parachuter.position.y + parachute_translation_factor_x,
        parachuter.position.z + parachute_translation_factor_z
      );

      this._RAF();
      this._Step(t - this._previousRAF);
      this._previousRAF = t;
    });
  }

  _Step(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;
    if (this._mixers) {
      this._mixers.map((m) => m.update(timeElapsedS));
    }
  }
}

let Load_Everything = null;

{
  let light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(20, 100, 10);
  light.target.position.set(0, 0, 0);
  light.castShadow = true;
  light.shadow.bias = -0.001;
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = 500.0;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 500.0;
  light.shadow.camera.left = 100;
  light.shadow.camera.right = -100;
  light.shadow.camera.top = 100;
  light.shadow.camera.bottom = -100;
  scene.add(light);

  light = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(light);
}

var textureLoader = new THREE.TextureLoader();
var texture = textureLoader.load("texture/ny1.png", function (loadedTexture) {
  loadedTexture.wrapS = THREE.RepeatWrapping;
  loadedTexture.wrapT = THREE.RepeatWrapping;
  loadedTexture.repeat.set(100, 100); // Adjust the repeat values to control the texture repetition
});
var material = new THREE.MeshBasicMaterial({ map: texture });
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(10000, 10000, 100, 100),
  material
);
plane.castShadow = false;
plane.receiveShadow = true;
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

// const land = new THREE.SphereGeometry(1000,1000,1000);
// // var textureLoader = new THREE.TextureLoader();
// // var texture = textureLoader.load('texture/ny1.png', function (loadedTexture) {
// //   loadedTexture.wrapS = THREE.RepeatWrapping;
// //   loadedTexture.wrapT = THREE.RepeatWrapping;
// //   loadedTexture.repeat.set(1000000, 1000000); // Adjust the repeat values to control the texture repetition
// // });
// const landMaterial = new THREE.MeshBasicMaterial(
//   {color: 0x212121}
// );
// const earth=new THREE.Mesh(land,landMaterial);
// earth.position.y=-1000;
// scene.add(earth);

const parachuterGeometry = new THREE.BoxGeometry(1, 1, 1);
const parachuterMaterial = new THREE.MeshBasicMaterial({
  color: parameters.color,
});
const parachuter = new THREE.Mesh(parachuterGeometry, parachuterMaterial);
parachuter.position.y = 5000;
scene.add(parachuter);

// Dat GUI:
const gui = new dat.GUI({ width: 300 });

// Create a new folder
const Parachuter = gui.addFolder("Parachuter");
const physics = gui.addFolder("physics");
Parachuter.add(parachuterMaterial, "visible");
Parachuter.add(parachuterMaterial, "wireframe");
Parachuter.addColor(parameters, "color").onChange(() => {
  parachuterMaterial.color.set(parameters.color);
});

// Define a variable to store the button action
const buttonAction = function () {
  location.reload();
};

// Add the button control to the GUI
gui
  .add({ clickButton: buttonAction }, "clickButton")
  .name("Reload The Simulation!");

// Camera:
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  10000
);

camera.position.set(
  parachuter.position.x + 100,
  parachuter.position.y + 1,
  parachuter.position.z - 100
);
skyBox.position.set(camera.position.x, camera.position.y, camera.position.z);

window.addEventListener("resize", () => {
  // Update The Size:
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update Aspect Ration:
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update the Render:
  renderer.setSize(sizes.width, sizes.height);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

window.addEventListener("dblclick", () => {
  if (!document.fullscreenElement) {
    canvas.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// Renderer:
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  precision: "highp",
  powerPreference: "high-performance",
  localClippingEnabled: false,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Create a control:
const controlsOrbit = new OrbitControls(camera, canvas);
controlsOrbit.enableDamping = true;
controlsOrbit.maxDistance = 1000;
controlsOrbit.minDistance = 200;
controlsOrbit.target.setX(parachuter.position.x);
controlsOrbit.target.setY(parachuter.position.y + 100);
controlsOrbit.target.setZ(parachuter.position.z);
controlsOrbit.distance = 5;

const direction = new THREE.Vector3();

// Set up the movement speed:
const speed = 100;

// Set up the keyboard event handlers:
document.addEventListener("keydown", (event) => {
  switch (event.code) {
    case "ArrowUp":
      direction.z = -1;
      break;
    case "ArrowLeft":
      direction.x = -1;
      break;
    case "ArrowDown":
      direction.z = 1;
      break;
    case "ArrowRight":
      direction.x = 1;
      break;
    case "KeyQ":
      direction.y = -1;
      break;
    case "KeyE":
      direction.y = 1;
      break;
    case "KeyT":
      is_deployed = true;
      break;
    case "KeyG":
      gravity_present = !gravity_present;
      break;
    case "KeyH":
      is_dry = !is_dry;
      break;
  }
});

document.addEventListener("keyup", (event) => {
  switch (event.code) {
    case "ArrowUp":
      direction.z = 0;
      break;
    case "ArrowLeft":
      direction.x = 0;
      break;
    case "ArrowDown":
      direction.z = 0;
      break;
    case "ArrowRight":
      direction.x = 0;
      break;
    case "KeyQ":
      direction.y = 0;
      break;
    case "KeyE":
      direction.y = 0;
      break;
  }
});

// Set up the animation loop:
let prevTime = Date.now();
let prevTime2 = Date.now();

let deflection =
  (1 / 3) *
  Math.sqrt((8 * Math.pow(5000, 3)) / Constants.GRAVITY_ACC) *
  Constants.W *
  Math.cos(45);

let SimulationSpeed = Variables.SimulationSpeed;

var Wind = new THREE.Vector3(0, 0, 0.0001);

function calc_WindDrift(Wind_velocity, falling_velocity, time) {
  let Wd = (Wind_velocity * time) / falling_velocity;
  return Wd;
}

function insideAnimate(loaded) {
  requestAnimationFrame(insideAnimate);
  // synchronizing the time
  // const currentTime = Date.now();
  // const delta = currentTime - prevTime;
  // prevTime = currentTime;

  if (loaded) {
    // Player Movement:
    if (parachuter.position.y >= 50) {
      /* prev code */

      if (is_deployed && current_Area < Area_of_the_body_Phase2) {
        t += 1 / parachuter.position.y;
      }

      Weight.setY(toggle_gravity() * mass);
      let velocity_squared = Math.pow(velocity.y, 2);

      dragForce.setY(
        0.5 *
          calc_airDensity(
            parachuter.position.y,
            Humidity_ratio,
            Temperature_sea_level
          ) *
          velocity_squared *
          get_current_phase_drag_coeff(t) *
          get_current_phase_area(t, Area_of_the_body_Phase2)
      );

      acceleration.setY((Weight.y - dragForce.y) / mass);

      velocity.y += acceleration.y * SimulationSpeed;
      // velocity.z = interpolate(0, deflection, 1 - parachuter.position.y / 5000);
      // velocity.add(Wind)
      // Altitude -= velocity.y * SimulationSpeed;
      // position = Altitude - 0.5 * acceleration.y * Math.pow(SimulationSpeed, 2);

      /* /prev code */

      // if (parachuter.position.y - velocity.y >= 0) {
      parachuter.position.z = velocity.z;
      parachuter.position.y -= velocity.y * SimulationSpeed;
      // }

      // if (camera.position.y > parachuter.position.y) {
      //   camera.position.y = parachuter.position.y + 100;
      // }
      //camera.lookAt(parachuter.position);

      // Injecting the Values into the Panel!
      document.getElementById("weight").innerText = Weight.y.toPrecision(3);
      document.getElementById("drag").innerText = dragForce.y.toPrecision(3);
      document.getElementById("acceleration").innerText =
        acceleration.y.toPrecision(3);
      document.getElementById("velocity").innerText = velocity.y.toPrecision(3);
      document.getElementById("altitude").innerText =
        parachuter.position.y.toPrecision(5);
      document.getElementById("time").innerText = time.toPrecision(3);
      document.getElementById("coriolis_force").innerText =
        parachuter.position.z.toPrecision(3);
      document.getElementById("deflection").innerText =
        deflection.toPrecision(3);
      document.getElementById("air_density").innerText =
        calc_airDensity(
          parachuter.position.y,
          Humidity_ratio,
          Temperature_sea_level
        ).toPrecision(3) + "kg m−3";
      document.getElementById("wind_draft").innerText = 0;
      document.getElementById("Cross-Sectional_Area").innerText =
        get_current_phase_area(t, Area_of_the_body_Phase2).toPrecision(3);

      time += SimulationSpeed;
    } else {
      parachuter.position.y = 0;
    }
    controlsOrbit.target.setY(parachuter.position.y + 100);
  }
}

const animate = () => {
  requestAnimationFrame(animate);
  const currentTime = Date.now();
  const delta = currentTime - prevTime2;
  prevTime2 = currentTime;

  controlsOrbit.update(delta);

  insideAnimate(model_loaded);

  renderer.render(scene, camera);
};

window.addEventListener("DOMContentLoaded", () => {
  new LoadModel();
  animate();
});
