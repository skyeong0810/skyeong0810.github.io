import { resizeAspectRatio, setupText, updateText, Axes } from './util.js';
import { Shader, readShaderFile } from './shader.js';

// Global variables
let isInitialized = false;
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let vao;
let positionBuffer;
let isDrawing = false;
let isCircleDrawn = false;  // Flag to track whether the circle is drawn
let startPoint = null;
let tempEndPoint = null;
let circleCenter = null;
let circleRadius = null;
let circlePoints = [];
let lines = [];
let numPoints = null;
let interPoints = [];
let textOverlay;
let textOverlay2;
let textOverlay3;
let axes = new Axes(gl, 0.85);

// mouse event handling
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
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.7, 0.8, 0.9, 1.0);
    
    return true;
}

function setupCanvas() {
    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.2, 0.3, 1.0);
}

function setupBuffers(shader) {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
}

// 좌표 변환 함수: 캔버스 좌표를 WebGL 좌표로 변환
function convertToWebGLCoordinates(x, y) {
    return [
        (x / canvas.width) * 2 - 1,
        -((y / canvas.height) * 2 - 1)
    ];
}

function setupMouseEvents() {
    function handleMouseDown(event) {
        event.preventDefault();
        event.stopPropagation();

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        if (!isDrawing) { 
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            if (!isCircleDrawn) {
                // Define center and reset the drawing for the circle
                circleCenter = [glX, glY];
                circleRadius = 0;
                circlePoints = [];
                isDrawing = true;
            } else {
                // Start drawing a new line segment after the circle is drawn
                startPoint = [glX, glY];
                tempEndPoint = null;
                isDrawing = true;
            }
        }
    }

    function handleMouseMove(event) {
        if (isDrawing) { 
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            
            if (!isCircleDrawn) {
                let dx = glX - circleCenter[0];
                let dy = glY - circleCenter[1];
                circleRadius = Math.sqrt(dx * dx + dy * dy);  // Calculate the radius
                updateCirclePoints();  // Update circle coordinates as the mouse is moved
                render();
            } else {
                // Update temporary end point for line drawing
                tempEndPoint = [glX, glY];
                render();
            }
        }
    }

    function handleMouseUp() {
        if (isDrawing) {
            if (!isCircleDrawn) {
                // Finalize the circle once the mouse is released
                updateCirclePoints();
                textOverlay = setupText(canvas, "Circle: center (" + circleCenter[0].toFixed(2) + ", " + circleCenter[1].toFixed(2) + ") "
                                                + "radius = " + circleRadius.toFixed(2), 1);
                isCircleDrawn = true;  // Circle is drawn, switch to line drawing
            }
            // Finalize line segment once the mouse is released
            else {
                lines = [...startPoint, ...tempEndPoint];  // Add the line to the lines array
                textOverlay2 = setupText(canvas, "Line segment: (" + lines[0].toFixed(2) + ", " + lines[1].toFixed(2)
                                                        + ") ~ (" + lines[2].toFixed(2) + ", " + lines[3].toFixed(2) + ")", 2);
                tempEndPoint = null; // Reset temporary end point
            }
            isDrawing = false;
            render();
        }
        findIntersections();
        if (numPoints > 0) {
            textOverlay3 = setupText(canvas, "Intersection Points: " + numPoints
                                            + " Point 1: (" + interPoints[0][0].toFixed(2) + ", " + interPoints[0][1].toFixed(2)
                                            + ") Point 2: (" + interPoints[1][0].toFixed(2) + ", " + interPoints[1][1].toFixed(2) + ")", 3);
            }
        else if (numPoints == 0) {
            textOverlay3 = setupText(canvas, "Intersection Points: " + numPoints
                + " Point 1: (" + interPoints[0][0].toFixed(2) + ", " + interPoints[0][1].toFixed(2) + ")", 3);
        }
        else if (numPoints < 0) {
            textOverlay3 = setupText(canvas, "No intersection", 3);
        }
    }

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
}

function updateCirclePoints() {
    circlePoints = [];  // Clear previous points

    // Calculate 108 points on the circle using cosine and sine functions
    const numPoints = 108;
    for (let i = 0; i < numPoints; i++) {
        let angle = (i * 2 * Math.PI) / numPoints;
        let x = circleCenter[0] + circleRadius * Math.cos(angle);
        let y = circleCenter[1] + circleRadius * Math.sin(angle);
        circlePoints.push(x, y);  // Store each point on the circle
    }
}

function findIntersections() {
    if (!isCircleDrawn || lines.length === 0) return;

    interPoints = [];  // Clear previous intersections

    let [x1, y1, x2, y2] = lines;
    let [xc, yc] = circleCenter;
    let r = circleRadius;

    let dx = (x2 - x1).toFixed (2);
    let dy = (y2 - y1).toFixed(2);

    let A = (dx * dx + dy * dy).toFixed(2);
    let B = (2 * (dx * (x1 - xc) + dy * (y1 - yc))).toFixed(2);
    let C = ((x1 - xc) ** 2 + (y1 - yc) ** 2 - r * r).toFixed(2);

    let D = (B * B - 4 * A * C).toFixed(2); // Discriminant
    console.log(D);

    if (D < 0) {
        numPoints = 0; // No intersection
    }
    else {
        let sqrtD = Math.sqrt(D);
        let t1 = (-B - sqrtD) / (2 * A);
        let t2 = (-B + sqrtD) / (2 * A);

        console.log("Raw t values:", t1, t2);

        // Check if t values are within [0,1] (on the segment)
        let validPoints = [];
        if (t1 >= 0 && t1 <= 1) {
            validPoints.push([x1 + t1 * dx, y1 + t1 * dy]);
        }
        if (t2 >= 0 && t2 <= 1) {
            validPoints.push([x1 + t2 * dx, y1 + t2 * dy]);
        }

        numPoints = validPoints.length;
        interPoints = validPoints;
    }

    console.log("Number of intersection points:", numPoints);
    console.log("Intersection points:", interPoints);
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.use();

    // Draw the circle
    if (isCircleDrawn) {
        shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]); // Circle color
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circlePoints), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINE_LOOP, 0, circlePoints.length / 2);
    }
    else {
        shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circlePoints), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINE_LOOP, 0, circlePoints.length / 2);
    }
    
    // Draw the single line after the circle
    if (lines.length > 0) {
        shader.setVec4("u_color", [1.0, 0.0, 0.0, 1.0]); // Line color (red)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINES, 0, 2);  // Draw the single line
    }
    // Draw temporary line segment (if the user is drawing it)
    if (tempEndPoint && startPoint) {
        shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]); // Temporary line color (gray)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...startPoint, ...tempEndPoint]), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINES, 0, 2);
    }

    axes.draw(mat4.create(), mat4.create());
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }

        shader = await initShader();
        
        setupCanvas();
        setupBuffers(shader);
        shader.use();

        textOverlay = setupText(canvas, "", 1);
        textOverlay2 = setupText(canvas, "", 2);
        textOverlay3 = setupText(canvas, "", 3);
        
        setupMouseEvents();
        
        render();

        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
