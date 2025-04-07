import { resizeAspectRatio, Axes } from './util.js';
import { Shader, readShaderFile } from './shader.js';

let isInitialized = false;
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');

let vao;
let shader;
let finalTransform;
let [rotateSun, rotateSelf, rotateEarth, rotateMoon] = [0, 0, 0, 0];
let lastTime = 0;
let axes = new Axes(gl, 1);

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
        requestAnimationFrame(animate);
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.3, 0.4, 1.0);
    
    return true;
}

function setupBuffers() {
    const vertices = new Float32Array([
        -0.5, -0.5, 0.0,  // Bottom left
         0.5, -0.5, 0.0,  // Bottom right
         0.5,  0.5, 0.0,  // Top right
        -0.5,  0.5, 0.0   // Top left
    ]);

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    shader.setAttribPointer('aPos', 3, gl.FLOAT, false, 0, 0);
}

function getTransformMatrices() {
    // Sun's self-rotation
    const RSun = mat4.create();
    mat4.rotate(RSun, RSun, rotateSun, [0, 0, 1]);

    // Earth's orbit around the Sun
    const REarth = mat4.create();
    mat4.rotate(REarth, REarth, rotateEarth, [0, 0, 1]);

    // Moon's orbit around the Earth
    const RMoon = mat4.create();
    mat4.rotate(RMoon, RMoon, rotateMoon, [0, 0, 1]);

    // Earth and Moon's self-rotation (same logic, different angle when used)
    const RSelf = mat4.create();
    mat4.rotate(RSelf, RSelf, rotateSelf, [0, 0, 1]);
    // When applying, use rotateEarth or rotateMoon depending on object

    // Scaling matrices
    const SSun = mat4.create();
    mat4.scale(SSun, SSun, [0.2, 0.2, 1]);

    const SEarth = mat4.create();
    mat4.scale(SEarth, SEarth, [0.1, 0.1, 1]);

    const SMoon = mat4.create();
    mat4.scale(SMoon, SMoon, [0.05, 0.05, 1]);

    // Translation matrices
    const TEarth = mat4.create();
    mat4.translate(TEarth, TEarth, [0.7, 0.0, 0]);

    const TMoon = mat4.create();
    mat4.translate(TMoon, TMoon, [0.2, 0.0, 0]);

    return {
        RSun, REarth, RMoon, RSelf,
        SSun, SEarth, SMoon,
        TEarth, TMoon
    };
}


function applyTransform(type) {
    let finalTransform = mat4.create();

    const {
        RSun, REarth, RMoon, RSelf,
        SSun, SEarth, SMoon,
        TEarth, TMoon
    } = getTransformMatrices();

    if (type === 'Sun') {
        // Sun: rotate then scale
        mat4.multiply(finalTransform, finalTransform, RSun);
        mat4.multiply(finalTransform, finalTransform, SSun);
    }

    else if (type === 'Earth') {
        // Earth Frame = Orbit around Sun + Translation
        let earthFrame = mat4.create();
        mat4.multiply(earthFrame, earthFrame, REarth);
        mat4.multiply(earthFrame, earthFrame, TEarth);

        // Earth final transform = Earth frame → Scale → Rotate on axis
        mat4.multiply(finalTransform, finalTransform, earthFrame);
        mat4.multiply(finalTransform, finalTransform, SEarth);
        mat4.multiply(finalTransform, finalTransform, RSelf);
    }

    else if (type === 'Moon') {
        // Earth Frame
        let earthFrame = mat4.create();
        mat4.multiply(earthFrame, earthFrame, REarth);
        mat4.multiply(earthFrame, earthFrame, TEarth);

        // Moon Frame = Earth frame → Orbit around Earth → Translate
        let moonFrame = mat4.create();
        mat4.multiply(moonFrame, moonFrame, earthFrame);
        mat4.multiply(moonFrame, moonFrame, RMoon);
        mat4.multiply(moonFrame, moonFrame, TMoon);

        // Moon final transform = Moon frame → Scale → Rotate
        mat4.multiply(finalTransform, finalTransform, moonFrame);
        mat4.multiply(finalTransform, finalTransform, SMoon);
        mat4.multiply(finalTransform, finalTransform, RSelf);
    }

    return finalTransform;
}

function animate(currentTime) {
    if (!lastTime) lastTime = currentTime;
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // Update all rotation angles
    rotateSun   += (Math.PI / 4) * deltaTime;      // 45 deg/sec
    rotateSelf  +=  Math.PI       * deltaTime;     // 180 deg/sec (for Earth & Moon)
    rotateEarth += (Math.PI / 6) * deltaTime;      // 30 deg/sec
    rotateMoon  += (Math.PI * 2) * deltaTime;      // 360 deg/sec

    // Update transform matrices
    finalTransform = applyTransform("Sun");
    render();

    finalTransform = applyTransform("Earth");
    render();

    finalTransform = applyTransform("Moon");
    render();

    requestAnimationFrame(animate);
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    axes.draw(mat4.create(), mat4.create());

    shader.use();
    gl.bindVertexArray(vao);

    // Sun
    shader.setMat4("u_model", applyTransform("Sun"));
    shader.setVec4("u_color", [1.0, 0.0, 0.0, 1.0]); // Red
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    // Earth
    shader.setMat4("u_model", applyTransform("Earth"));
    shader.setVec4("u_color", [0.0, 1.0, 1.0, 1.0]); // Cyan
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    // Moon
    shader.setMat4("u_model", applyTransform("Moon"));
    shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]); // Yellow
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    try {
        if (!initWebGL()) throw new Error('WebGL 초기화 실패');

        finalTransform = mat4.create();

        shader = await initShader(); 
        setupBuffers(shader); 
        shader.use();

        requestAnimationFrame(animate); // start animation loop
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
    }
}
