import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const scene = new THREE.Scene();

// renderer
const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0x000000);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const stats = new Stats();
document.body.appendChild(stats.dom);

// perspective, orthogonal toggle
let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 30, 130);
camera.lookAt(scene.position);
scene.add(camera);

let orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;

const textureLoader = new THREE.TextureLoader();

// sun
const sunGeometry = new THREE.SphereGeometry(10);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// mercury
const pivotMercury = new THREE.Object3D();
scene.add(pivotMercury);

const mercuryGeometry = new THREE.SphereGeometry(1.5);
const mercuryTexture = textureLoader.load("Mercury.jpg");
const mercuryMaterial = new THREE.MeshLambertMaterial({
    map: mercuryTexture,
    roughness: 0.8,
    metalness: 0.2
});
const mercury = new THREE.Mesh(mercuryGeometry, mercuryMaterial);
mercury.position.set(20, 0, 0); // from pivotMercury
pivotMercury.add(mercury);

// venus
const pivotVenus = new THREE.Object3D();
scene.add(pivotVenus);

const venusGeometry = new THREE.SphereGeometry(3);
const venusTexture = textureLoader.load("Venus.jpg");
const venusMaterial = new THREE.MeshLambertMaterial({
    map: venusTexture,
    roughness: 0.8,
    metalness: 0.2
});
const venus = new THREE.Mesh(venusGeometry, venusMaterial);
venus.position.set(35, 0, 0); // from pivotVenus
pivotVenus.add(venus);

// earth
const pivotEarth = new THREE.Object3D();
scene.add(pivotEarth);

const earthGeometry = new THREE.SphereGeometry(3.5);
const earthTexture = textureLoader.load("Earth.jpg");
const earthMaterial = new THREE.MeshLambertMaterial({
    map: earthTexture,
    roughness: 0.8,
    metalness: 0.2
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earth.position.set(50, 0, 0); // from pivotEarth
pivotEarth.add(earth);

// mars
const pivotMars = new THREE.Object3D();
scene.add(pivotMars);

const marsGeometry = new THREE.SphereGeometry(2.5);
const marsTexture = textureLoader.load("Mars.jpg");
const marsMaterial = new THREE.MeshLambertMaterial({
    map: marsTexture,
    roughness: 0.8,
    metalness: 0.2
});
const mars = new THREE.Mesh(marsGeometry, marsMaterial);
mars.position.set(65, 0, 0); // from pivotMars
pivotMars.add(mars);

// lights
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff);
directionalLight.position.set(50, 50, 0);
scene.add(directionalLight);

// GUI
const gui = new GUI();

const controls = new function() {
    this.cameraMode = "Perspective";
    this.switchCamera = function() {
        if (camera instanceof THREE.PerspectiveCamera) {
            scene.remove(camera);
            camera = null;

            camera = new THREE.OrthographicCamera(window.innerWidth / -16, window.innerWidth / 16,
                                                  window.innerHeight / 16, window.innerHeight / -16, -200, 500);
            camera.position.set(0, 30, 130);
            camera.lookAt(scene.position);

            orbitControls.dispose();
            orbitControls = null;
            orbitControls = new OrbitControls(camera, renderer.domElement);
            orbitControls.enableDamping = true;
            this.cameraMode = "Orthographic";
        }
        else {
            scene.remove(camera);
            camera = null; 
            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, 30, 130);
            camera.lookAt(scene.position);

            orbitControls.dispose(); // 기존의 orbitControls 제거
            orbitControls = null;
            orbitControls = new OrbitControls(camera, renderer.domElement);
            orbitControls.enableDamping = true;
            this.cameraMode = "Perspective";
        }
    };

    this.mercuryRotSpeed = 0.02;
    this.mercuryOrbitSpeed = 0.02;

    this.venusRotSpeed = 0.015;
    this.venusOrbitSpeed = 0.015;

    this.earthRotSpeed = 0.01;
    this.earthOrbitSpeed = 0.01;

    this.marsRotSpeed = 0.008;
    this.marsOrbitSpeed = 0.008;
};

const guiCamera = gui.addFolder("Camera");
guiCamera.add(controls, "switchCamera").name("Switch Camera Type");
const cameraChange = guiCamera.add(controls, "cameraMode").name("Current Camera");
cameraChange.listen();

const guiMercury = gui.addFolder("Mercury");
guiMercury.add(controls, "mercuryRotSpeed", 0, 0.1).name("Rotation Speed");
guiMercury.add(controls, "mercuryOrbitSpeed", 0, 0.1).name("Orbit Speed");

const guiVenus = gui.addFolder("Venus");
guiVenus.add(controls, "venusRotSpeed", 0, 0.1).name("Rotation Speed");
guiVenus.add(controls, "venusOrbitSpeed", 0, 0.1).name("Orbit Speed");

const guiEarth = gui.addFolder("Earth");
guiEarth.add(controls, "earthRotSpeed", 0, 0.1).name("Rotation Speed");
guiEarth.add(controls, "earthOrbitSpeed", 0, 0.1).name("Orbit Speed");

const guiMars = gui.addFolder("Mars");
guiMars.add(controls, "marsRotSpeed", 0, 0.1).name("Rotation Speed");
guiMars.add(controls, "marsOrbitSpeed", 0, 0.1).name("Orbit Speed");

render();

function render() {
    orbitControls.update();
    stats.update();

    mercury.rotation.y += controls.mercuryRotSpeed;
    venus.rotation.y += controls.venusRotSpeed;
    earth.rotation.y += controls.earthRotSpeed;
    mars.rotation.y += controls.marsRotSpeed;

    pivotMercury.rotation.y += controls.mercuryOrbitSpeed;
    pivotVenus.rotation.y += controls.venusOrbitSpeed;
    pivotEarth.rotation.y += controls.earthOrbitSpeed;
    pivotMars.rotation.y += controls.marsOrbitSpeed;

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}