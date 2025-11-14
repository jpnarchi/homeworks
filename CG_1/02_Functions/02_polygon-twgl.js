/*
 * Script to draw a color polygon using WebGL 2
 * Also using external functions to abstract commonly used code
 *
 * Gilberto Echeverria
 * 2024-07-02
 */


'use strict';

import * as twgl from "twgl-base.js";

// Vertex Shader as a string
const vsGLSL = `#version 300 es
in vec4 a_position;
in vec4 a_color;

out vec4 v_color;

void main() {
    gl_Position = a_position;
    v_color = a_color;
}
`;

// Fragment Shader as a string
const fsGLSL = `#version 300 es
precision highp float;

in vec4 v_color;

out vec4 outColor;

void main() {
    outColor = v_color;
}
`;

function main() {
    const canvas = document.querySelector('canvas');
    const gl = canvas.getContext('webgl2');

    const programInfo = twgl.createProgramInfo(gl, [vsGLSL, fsGLSL]);

    const sides = 6;

    const arrays = generateData(sides);

    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    const vao = twgl.createVAOFromBufferInfo(gl, programInfo, bufferInfo);
    console.log(vao);

    gl.bindVertexArray(vao);

    gl.useProgram(programInfo.program);

    twgl.drawBufferInfo(gl, bufferInfo);
    //gl.drawElements(gl.TRIANGLES, bufferInfo.enumElements, gl.UNSIGNED_SHORT, 0);
}

// Create the data for the vertices of the polyton, as an object with two arrays
function generateData(sides) {
    // The arrays are initially empty
    let arrays =
    {
        // Two components for each position in 2D
        a_position: { numComponents: 2, data: [] },
        // Four components for a color (RGBA)
        a_color:    { numComponents: 4, data: [] },
        // Three components for each triangle, the 3 vertices
        indices:  { numComponents: 3, data: [] }
    };

    // Initialize the center vertex, at the origin and with yellow color
    arrays.a_position.data.push(0);
    arrays.a_position.data.push(0);
    arrays.a_color.data.push(1);  // R
    arrays.a_color.data.push(1);  // G
    arrays.a_color.data.push(0);  // B
    arrays.a_color.data.push(1);  // A

    let radius = 100; // Radio
    let angleStep = 2 * Math.PI / sides;
    // Loop over the sides to create the rest of the vertices
    for (let s=0; s<sides; s++) {
        let angle = angleStep * s;
        // Generate the coordinates of the vertex in PIXELS, not clip space
        let x = Math.cos(angle) * radius;  // Multiplicamos todo por el radio para poder dibujar el poligono
        let y = Math.sin(angle) * radius; // Multiplicamos todo por el radio para poder dibujar el poligono
        arrays.a_position.data.push(x);
        arrays.a_position.data.push(y);
        // Yellow color for all vertices of the face
        arrays.a_color.data.push(1);  // R
        arrays.a_color.data.push(1);  // G
        arrays.a_color.data.push(0);  // B
        arrays.a_color.data.push(1);  // A
        // Define the triangles, in counter clockwise order
        arrays.indices.data.push(0);
        arrays.indices.data.push(s + 1);
        arrays.indices.data.push(((s + 2) <= sides) ? (s + 2) : 1);
    }

    // Count existing vertices (1 center + sides vertices for polygon)
    let currentVertexCount = 1 + sides;

    // --- OJO IZQUIERDO
    const eyeSize = 15;
    const leftEyeX = -30;
    const leftEyeY = -20;

    // Vértice 0 del ojo izquierdo
    arrays.a_position.data.push(leftEyeX, leftEyeY - eyeSize);
    arrays.a_color.data.push(0, 0, 0, 1); // Lo pongo de color negro

    // Vértice 1 del ojo izquierdo
    arrays.a_position.data.push(leftEyeX - eyeSize, leftEyeY + eyeSize);
    arrays.a_color.data.push(0, 0, 0, 1);

    // Vértice 2 del ojo izquierdo
    arrays.a_position.data.push(leftEyeX + eyeSize, leftEyeY + eyeSize);
    arrays.a_color.data.push(0, 0, 0, 1); 

    // Índices para el triángulo del ojo izquierdo
    arrays.indices.data.push(currentVertexCount, currentVertexCount + 1, currentVertexCount + 2);
    currentVertexCount += 3;

    // --- OJO DERECHO
    const rightEyeX = 30;
    const rightEyeY = -20;

    // Vértice 0 del ojo derecho (superior)
    arrays.a_position.data.push(rightEyeX, rightEyeY - eyeSize);
    arrays.a_color.data.push(0, 0, 0, 1); // Negro

    // Vértice 1 del ojo derecho (inferior izquierdo)
    arrays.a_position.data.push(rightEyeX - eyeSize, rightEyeY + eyeSize);
    arrays.a_color.data.push(0, 0, 0, 1);

    // Vértice 2 del ojo derecho (inferior derecho)
    arrays.a_position.data.push(rightEyeX + eyeSize, rightEyeY + eyeSize);
    arrays.a_color.data.push(0, 0, 0, 1);

    // Índices para el triángulo del ojo derecho
    arrays.indices.data.push(currentVertexCount, currentVertexCount + 1, currentVertexCount + 2);
    currentVertexCount += 3;

    // BOCA
    const mouthWidth = 30;
    const mouthHeight = 20;
    const mouthY = 40;

    // Vértice 0 de la boca (superior centro)
    arrays.a_position.data.push(0, mouthY - mouthHeight);
    arrays.a_color.data.push(0, 0, 0, 1); // Negro

    // Vértice 1 de la boca (inferior izquierdo)
    arrays.a_position.data.push(-mouthWidth, mouthY);
    arrays.a_color.data.push(0, 0, 0, 1);

    // Vértice 2 de la boca (inferior derecho)
    arrays.a_position.data.push(mouthWidth, mouthY);
    arrays.a_color.data.push(0, 0, 0, 1);

    // Índices para el triángulo de la boca
    arrays.indices.data.push(currentVertexCount, currentVertexCount + 1, currentVertexCount + 2);

    console.log(arrays);

    return arrays;
}

export {generateData};
main()
