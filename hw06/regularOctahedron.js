/*-----------------------------------------------------------------------------
class regularOctahedron

1) Vertex positions
    A square pyramid has 8 faces with 3 vertices
    The total number of vertices is 24
    So, vertices need 72 floats (24 * 3 (x, y, z)) in the vertices array

2) Vertex indices
    Vertex indices of the unit square pyramid is as follows:
        v0
        /|\
       / | \
      /  |  \
    v1--v2--v3--v4
      \  |  /
       \ | /
        \|/
        v5

    The order of faces and their vertex indices is as follows:
        top: front (0, 1, 2) right (0, 2, 3) back (0, 3, 4) left (0, 4, 1)
        bottom: front (5, 1, 2) right (5, 2, 3) back (5, 3, 4) left (5, 4, 1)
    so the total number of triangles is 8

3) Vertex normals
    Each vertex in the same face has the same normal vector (flat shading)
    The normal vector is the same as the face normal vector
    top faces (0, 1, 0)
    bottom faces (0, -1, 0)

4) Vertex colors
    Each vertex in the same face has the same color (flat shading)
    The color is the same as the face color

5) Vertex texture coordinates
    Each vertex in the same face has the same texture coordinates (flat shading)
    The texture coordinates are the same as the face texture coordinates
    top: front v0(0.5, 1) v1(0.5, 0.5) v2(0.75, 0.5)
         right v0(0.5, 1) v2(0.75, 0.5) v3(0, 0.5)
         back  v0(0.5, 1) v3(0, 0.5) v4(0.25, 0.5)
         left  v0(0.5, 1) v4(0.25, 0.5) v1(0.5, 0.5)
    bottom: front v5(0.5, 0) v1(0.5, 0.5) v2(0.75, 0.5)
            right v5(0.5, 0) v2(0.75, 0.5) v3(0, 0.5)
            back  v5(0.5, 0) v3(0, 0.5) v4(0.25, 0.5)
            left  v5(0.5, 0) v4(0.25, 0.5) v1(0.5, 0.5)

6) Parameters:
    1] gl: WebGLRenderingContext
    2] options:
        1> color: array of 4 floats (default: [0.8, 0.8, 0.8, 1.0 ])
           in this case, all vertices have the same given color

7) Vertex shader: the location (0: position attrib (vec3), 1: normal attrib (vec3),
                            2: color attrib (vec4), and 3: texture coordinate attrib (vec2))
8) Fragment shader: should catch the vertex color from the vertex shader
-----------------------------------------------------------------------------*/

export class regularOctahedron {
    constructor(gl, options = {}) {
        this.gl = gl;
        
        // Creating VAO and buffers
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        // Initializing data
        this.vertices = new Float32Array([
            // top
            // front
            0,  Math.sqrt(2)/2, 0,    -0.5, 0,  0.5,     0.5, 0,  0.5,
            // right
            0,  Math.sqrt(2)/2, 0,     0.5, 0,  0.5,     0.5, 0, -0.5,
            // back
            0,  Math.sqrt(2)/2, 0,     0.5, 0, -0.5,    -0.5, 0, -0.5,
            // left
            0,  Math.sqrt(2)/2, 0,    -0.5, 0, -0.5,    -0.5, 0,  0.5,
            // bottom
            //front
            0, -Math.sqrt(2)/2, 0,    -0.5, 0,  0.5,     0.5, 0,  0.5,
            // right
            0, -Math.sqrt(2)/2, 0,     0.5, 0,  0.5,     0.5, 0, -0.5,
            // back
            0, -Math.sqrt(2)/2, 0,     0.5, 0, -0.5,    -0.5, 0, -0.5,
            // left
            0, -Math.sqrt(2)/2, 0,    -0.5, 0, -0.5,    -0.5, 0,  0.5
        ]);

        this.normals = new Float32Array([
            // top
            0, 1, 0,    0, 1, 0,    0, 1, 0,
            0, 1, 0,    0, 1, 0,    0, 1, 0,
            0, 1, 0,    0, 1, 0,    0, 1, 0,
            0, 1, 0,    0, 1, 0,    0, 1, 0,
            // bottom
            0, -1, 0,    0, -1, 0,    0, -1, 0,
            0, -1, 0,    0, -1, 0,    0, -1, 0,
            0, -1, 0,    0, -1, 0,    0, -1, 0,
            0, -1, 0,    0, -1, 0,    0, -1, 0
        ]);

        this.colors = new Float32Array([
            // all blue
            0, 0, 1, 1,    0, 0, 1, 1,    0, 0, 1, 1,    
            0, 0, 1, 1,    0, 0, 1, 1,    0, 0, 1, 1,    
            0, 0, 1, 1,    0, 0, 1, 1,    0, 0, 1, 1,    
            0, 0, 1, 1,    0, 0, 1, 1,    0, 0, 1, 1,    
            0, 0, 1, 1,    0, 0, 1, 1,    0, 0, 1, 1,    
            0, 0, 1, 1,    0, 0, 1, 1,    0, 0, 1, 1,    
            0, 0, 1, 1,    0, 0, 1, 1,    0, 0, 1, 1,    
            0, 0, 1, 1,    0, 0, 1, 1,    0, 0, 1, 1
        ]);

        this.texCoords = new Float32Array([
            // top
            // front
            0.5, 1,    0.5, 0.5,    0.75, 0.5,
            // right
            0.5, 1,    0.75, 0.5,   0, 0.5,
            // back
            0.5, 1,    0, 0.5,      0.25, 0.5,
            // left
            0.5, 1,    0.25, 0.5,   0.5, 0.5,
            // bottom
            // front
            0.5, 0,    0.5, 0.5,    0.75, 0.5,
            // right
            0.5, 0,    0.75, 0.5,   0, 0.5,
            // back
            0.5, 0,    0, 0.5,      0.25, 0.5,
            // left
            0.5, 0,    0.25, 0.5,   0.5, 0.5
        ]);

        this.indices = new Uint16Array([
            // top
            // front
            0, 1, 2,
            // right
            3, 4, 5,
            // back
            6, 7, 8,
            // left
            9, 10, 11,
            // bottom
            // front
            12, 13, 14,
            // right
            15, 16, 17,
            // back
            18, 19, 20,
            // left
            21, 22, 23
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