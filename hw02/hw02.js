import { resizeAspectRatio, setupText } from './util.js';
import { Shader, readShaderFile } from './shader.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');

let shader;   // shader program
let vao;      // vertex array object

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    //init canvas
    canvas.width = 600;
    canvas.height = 600;

    resizeAspectRatio(gl, canvas);

    // Initialize WebGL settings
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.2, 0.3, 1.0);
    
    return true;
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function setupBuffers() {
    const vertices = new Float32Array([
        -0.1, -0.1, 0.0,  // Bottom left
         0.1, -0.1, 0.0,  // Bottom right
         0.1,  0.1, 0.0,  // Top right
        -0.1,  0.1, 0.0,  // Top left
    ]);

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    shader.setAttribPointer('aPos', 3, gl.FLOAT, false, 0, 0);
}

let offset = [0.0, 0.0]; // aPos에 더할 값 (aPos는 초기 좌표값. 변하지 않음)
const moveStep = 0.01;

// key-value for x,y movement. add to offset
const keys = {
    ArrowUp: [0, moveStep],
    ArrowDown: [0, -moveStep],
    ArrowLeft: [-moveStep, 0],
    ArrowRight: [moveStep, 0]
};

const epsilon = 0.0001;

function setupKeyboardEvents() {
    document.addEventListener('keydown', (event) => {
        if (event.key in keys) {
            const moveX = keys[event.key][0]; // x 이동값
            const moveY = keys[event.key][1]; // y 이동값

            const maxRight = 1.0 - 0.1; // Right limit (normalized x max)
            const maxLeft = -1.0 + 0.1; // Left limit (normalized x min)
            const maxUp = 1.0 - 0.1; // Upper limit (normalized y max)
            const maxDown = -1.0 + 0.1; // Bottom limit (normalized y min)


            // canvas를 벗어나는지 확인 후 offset에 add
            // 부동소수점 오류-> 소수점 아래 두번째 자리까지 반올림
            if (offset[0] + moveX <= maxRight && offset[0] + moveX >= maxLeft) {
                offset[0] += moveX;
                offset[0] = Math.round(offset[0] * 100) / 100;
            }
            if (offset[1] + moveY <= maxUp && offset[1] + moveY >= maxDown) {
                offset[1] += moveY;
                offset[1] = Math.round(offset[1] * 100) / 100;
            }

            shader.setVec2("uOffset", offset);
        }
    });
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    shader.setVec4("uColor", [1.0, 0.0, 0.0, 1.0]);

    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    requestAnimationFrame(() => render());
}

async function main() {
    try {

        // WebGL 초기화
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }

        // 셰이더 초기화
        await initShader();

        // setup text overlay (see util.js)
        setupText(canvas, "Use arrow keys to move the rectangle", 1);

        // 키보드 이벤트 설정
        setupKeyboardEvents();
        
        // 나머지 초기화
        setupBuffers(shader);
        shader.use();
        
        // 렌더링 시작
        render();

        return true;

    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}

// call main function
main().then(success => {
    if (!success) {
        console.log('프로그램을 종료합니다.');
        return;
    }
}).catch(error => {
    console.error('프로그램 실행 중 오류 발생:', error);
});
