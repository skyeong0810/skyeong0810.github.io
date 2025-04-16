/*-----------------------------------------------------------------------------
class squarePyramid

1) Vertex positions
    A square pyramid has 4 faces with 3 vertices and 1 face with 4 vertices
    The total number of vertices is 16
    So, vertices need 48 floats (16 * 3 (x, y, z)) in the vertices array

2) Vertex indices
    Vertex indices of the unit square pyramid is as follows:
            v4
            /|\
           / | \
          /  |  \
    v0--v1--v2--v3

    The order of faces and their vertex indices is as follows:
        bottom (0,1,2,3),
        front (4, 2, 3), right (4, 3, 0), back (4, 0, 1), left (4, 1, 2)
    so the total number of triangles is 6
    And, we need to maintain the order of vertices for each triangle as 
    counterclockwise (when we see the face from the outside of the cube):
        bottom [(0, 1, 2), (2, 3, 0)]

3) Vertex normals
    Each vertex in the same face has the same normal vector (flat shading)
    The normal vector is the same as the face normal vector
    bottom: (0, -1, 0),
    front: (0, 1/2, root(3)/2 ), right: (root(3)/2, 1/2, 0), back: (0, 1/2, -root(3)/2 ), left: (-root(3)/2, 1/2, 0) 

4) Vertex colors
    Each vertex in the same face has the same color (flat shading)
    The color is the same as the face color
    front: red (1,0,0,1), right: yellow (1,1,0,1), back: magenta (1,0,1,1), left: cyan (0,1,1,1),
    bottom: green (0,1,0,1)

5) Vertex texture coordinates
    Each vertex in the same face has the same texture coordinates (flat shading)
    The texture coordinates are the same as the face texture coordinates
    bottom face: v0(1,1), v1(0,1), v2(0,0), v3(1,0)
    front face: v4(0.5,1), v2(0,0), v3(1,0)
    right face: v4(0.5,1), v3(0,0), v0(1,0)
    back face: v4(0.5,1), v0(0,0), v1(1,0)
    left face: v4(0.5,1), v1(0,0), v2(1,0)

6) Parameters:
    1] gl: WebGLRenderingContext
    2] options:
        1> color: array of 4 floats (default: [0.8, 0.8, 0.8, 1.0 ])
           in this case, all vertices have the same given color

7) Vertex shader: the location (0: position attrib (vec3), 1: normal attrib (vec3),
                            2: color attrib (vec4), and 3: texture coordinate attrib (vec2))
8) Fragment shader: should catch the vertex color from the vertex shader
-----------------------------------------------------------------------------*/

export class squarePyramid {
    constructor(gl, options = {}) {
        this.gl = gl;
        
        // Creating VAO and buffers
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        // Initializing data
        this.vertices = new Float32Array([
            // bottom face  (v0,v1,v2,v3)
            0.5, 0, -0.5,  -0.5, 0, -0.5,  -0.5, 0, 0.5,   0.5, 0, 0.5,
            // front face  (v4, v2, v3)
            0, 1, 0,   -0.5, 0, 0.5,   0.5, 0, 0.5,
            // right face    (v4, v3, v0)
            0, 1, 0,    0.5, 0, 0.5,   0.5, 0, -0.5,
            // back face   (v4, v0, v1)
            0, 1, 0,    0.5, 0, -0.5,  -0.5, 0, -0.5,
            // left face (v4, v1, v2)
            0, 1, 0,    -0.5, 0, -0.5, -0.5, 0,  0.5
        ]);

        this.normals = new Float32Array([
            // bottom face (v0,v1,v2,v3)
            0, -1, 0,   0, -1, 0,   0, -1, 0,   0, -1, 0,
            // front face
            0, 1/2, Math.sqrt(3)/2,   0, 1/2, Math.sqrt(3)/2,   0, 1/2, Math.sqrt(3)/2,
            // right face
            Math.sqrt(3)/2, 1/2, 0,   Math.sqrt(3)/2, 1/2, 0,   Math.sqrt(3)/2, 1/2, 0,
            // back face
            0, 1/2, -Math.sqrt(3)/2,   0, 1/2, -Math.sqrt(3)/2,   0, 1/2, -Math.sqrt(3)/2,
            // left face
            -Math.sqrt(3)/2, 1/2, 0,   -Math.sqrt(3)/2, 1/2, 0,   -Math.sqrt(3)/2, 1/2, 0
        ]);
        
        this.colors = new Float32Array([
            // bottom face (v0,v1,v2,v3) - green
            0, 1, 0, 1,   0, 1, 0, 1,   0, 1, 0, 1,   0, 1, 0, 1,
            // front face - red
            1, 0, 0, 1,   1, 0, 0, 1,   1, 0, 0, 1,
            // right face - yellow
            1, 1, 0, 1,   1, 1, 0, 1,   1, 1, 0, 1,
            // back face  - magenta
            1, 0, 1, 1,   1, 0, 1, 1,   1, 0, 1, 1,
            // left face  - cyan
            0, 1, 1, 1,   0, 1, 1, 1,   0, 1, 1, 1
        ]);

        this.texCoords = new Float32Array([
            // bottom face (v0,v1,v2,v3)
            1, 1,   0, 1,   0, 0,   1, 0,
            // front
            0.5, 1,   0, 0,   1, 0,
            // right
            0.5, 1,   0, 0,   1, 0,
            // back
            0.5, 1,   0, 0,   1, 0,
            // left
            0.5, 1,   0, 0,   1, 0
        ]);

        this.indices = new Uint16Array([
            // bottom face
            0, 1, 2,   2, 3, 0,      // v0-v1-v2, v2-v3-v0
            // front face
            4, 5, 6,
            // right
            7, 8, 9,
            // back
            10, 11, 12,
            // left
            13, 14, 15
        ]);

        this.initBuffers();
    }

    initBuffers() {
        const gl = this.gl;

        // 버퍼 크기 계산
        const vSize = this.vertices.byteLength;
        const nSize = this.normals.byteLength;
        const cSize = this.colors.byteLength;
        const tSize = this.texCoords.byteLength;
        const totalSize = vSize + nSize + cSize + tSize;

        gl.bindVertexArray(this.vao);

        // VBO에 데이터 복사
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, totalSize, gl.STATIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize, this.colors);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize + cSize, this.texCoords);

        // EBO에 인덱스 데이터 복사
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        // vertex attributes 설정
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);  // position
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, vSize);  // normal
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, vSize + nSize);  // color
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, vSize + nSize + cSize);  // texCoord

        // vertex attributes 활성화
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);
        gl.enableVertexAttribArray(3);

        // 버퍼 바인딩 해제
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    draw(shader) {

        const gl = this.gl;
        shader.use();
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    delete() {
        const gl = this.gl;
        gl.deleteBuffer(this.vbo);
        gl.deleteBuffer(this.ebo);
        gl.deleteVertexArray(this.vao);
    }
} 