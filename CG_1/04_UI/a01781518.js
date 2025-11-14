/*
 * Script to draw a complex shape in 2D
 *
 * Gilberto Echeverria
 * 2024-07-12
 */


'use strict';

import * as twgl from 'twgl-base.js';
import { shapeF } from '../libs/shapes.js';
import { generateData } from '../02_Functions/02_polygon-twgl.js';
import { M3 } from '../libs/2d-lib.js';
import GUI from 'lil-gui';

// Define the shader code, using GLSL 3.00

const vsGLSL = `#version 300 es
in vec2 a_position;
in vec4 a_color;

uniform vec2 u_resolution;
uniform mat3 u_transforms;

out vec4 v_color;

void main() {
    // Multiply the matrix by the vector, adding 1 to the vector to make
    // it the correct size. Then keep only the two first components
    vec2 position = (u_transforms * vec3(a_position, 1)).xy;

    // Convert the position from pixels to 0.0 - 1.0
    vec2 zeroToOne = position / u_resolution;

    // Convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;

    // Convert from 0->2 to -1->1 (clip space)
    vec2 clipSpace = zeroToTwo - 1.0;

    // Invert Y axis
    //gl_Position = vec4(clipSpace[0], clipSpace[1] * -1.0, 0, 1);
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

    v_color = a_color;
}
`;

const fsGLSL = `#version 300 es
precision highp float;

in vec4 v_color;

out vec4 outColor;

void main() {
    outColor = v_color;
}
`;


// Structure for the global data of all objects
// This data will be modified by the UI and used by the renderer
const objects = {
    model: {
        transforms: {
            t: {
                x: 400, // Inicializamos la cara en el centro del modelo
                y: 300,
                z: 0,
            },
            rr: {
                x: 0,
                y: 0,
                z: 0,
            },
            s: {
                x: 1,
                y: 1,
                z: 1,
            }
        },
        color: [1, 0.3, 0, 1],
    },
    pivot: {
        position: {
            x: 400,
            y: 300,
            z: 0,
        },
        color: [0, 1, 0, 1], // Verde para el pivote
    }
}

// Función para crear pibote
function generatePivotData() {
    const sides = 16;
    const radius = 10; // Pequeño radio para visualizar el pivote

    let arrays = {
        a_position: { numComponents: 2, data: [] },
        a_color: { numComponents: 4, data: [] },
        indices: { numComponents: 3, data: [] }
    };

    // Lo incicializamos en el centro
    arrays.a_position.data.push(0, 0);
    arrays.a_color.data.push(0, 1, 0, 1); // Verde

    let angleStep = 2 * Math.PI / sides;
    for (let s = 0; s < sides; s++) {
        let angle = angleStep * s;
        arrays.a_position.data.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
        arrays.a_color.data.push(0, 1, 0, 1); // Verde
        arrays.indices.data.push(0, s + 1, ((s + 2) <= sides) ? (s + 2) : 1);
    }

    return arrays;
}

// Initialize the WebGL environmnet
function main() {
    const canvas = document.querySelector('canvas');
    const gl = canvas.getContext('webgl2');
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    setupUI(gl);

    const programInfo = twgl.createProgramInfo(gl, [vsGLSL, fsGLSL]);

    // Creamos geometría para la cara
    const faceArrays = generateData(30);
    const faceBufferInfo = twgl.createBufferInfoFromArrays(gl, faceArrays);
    const faceVao = twgl.createVAOFromBufferInfo(gl, programInfo, faceBufferInfo);

    // Creamos la geometría del pivote
    const pivotArrays = generatePivotData();
    const pivotBufferInfo = twgl.createBufferInfoFromArrays(gl, pivotArrays);
    const pivotVao = twgl.createVAOFromBufferInfo(gl, programInfo, pivotBufferInfo);

    drawScene(gl, { face: faceVao, pivot: pivotVao }, programInfo,
              { face: faceBufferInfo, pivot: pivotBufferInfo });
}

// Función para mostrar los objetos
function drawScene(gl, vaos, programInfo, bufferInfos) {
    // Clear canvas
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(programInfo.program);

    // Dibujamos cara
    let translate = [objects.model.transforms.t.x, objects.model.transforms.t.y];
    let angle_radians = objects.model.transforms.rr.z;
    let scale = [objects.model.transforms.s.x, objects.model.transforms.s.y];
    let pivotPos = [objects.pivot.position.x, objects.pivot.position.y];

    // Orden en : T × T_pivot × R × T_-pivot × S
    // 1. Scale
    let faceTransforms = M3.scale(scale);
    // 2. Translate from pivot to origin
    faceTransforms = M3.multiply(M3.translation([-pivotPos[0], -pivotPos[1]]), faceTransforms);
    // 3. Rotate
    faceTransforms = M3.multiply(M3.rotation(angle_radians), faceTransforms);
    // 4. Translate back to pivot
    faceTransforms = M3.multiply(M3.translation(pivotPos), faceTransforms);
    // 5. Translate to face position
    faceTransforms = M3.multiply(M3.translation(translate), faceTransforms);

    let faceUniforms = {
        u_resolution: [gl.canvas.width, gl.canvas.height],
        u_transforms: faceTransforms,
    };

    twgl.setUniforms(programInfo, faceUniforms);
    gl.bindVertexArray(vaos.face);
    twgl.drawBufferInfo(gl, bufferInfos.face);

    // --- DRAW PIVOT (only translation, no rotation) ---
    let pivotTransforms = M3.translation(pivotPos);

    let pivotUniforms = {
        u_resolution: [gl.canvas.width, gl.canvas.height],
        u_transforms: pivotTransforms,
    };

    twgl.setUniforms(programInfo, pivotUniforms);
    gl.bindVertexArray(vaos.pivot);
    twgl.drawBufferInfo(gl, bufferInfos.pivot);

    requestAnimationFrame(() => drawScene(gl, vaos, programInfo, bufferInfos));
}

function setupUI(gl)
{
    const gui = new GUI();

    // Controles para la cara
    const faceFolder = gui.addFolder('Face (Cara)');

    const traFolder = faceFolder.addFolder('Translation');
    traFolder.add(objects.model.transforms.t, 'x', 0, gl.canvas.width);
    traFolder.add(objects.model.transforms.t, 'y', 0, gl.canvas.height);

    const rotFolder = faceFolder.addFolder('Rotation');
    rotFolder.add(objects.model.transforms.rr, 'z', 0, Math.PI * 2).name('Angle (rad)');

    const scaFolder = faceFolder.addFolder('Scale');
    scaFolder.add(objects.model.transforms.s, 'x', -5, 5);
    scaFolder.add(objects.model.transforms.s, 'y', -5, 5);

    // Controles para el pivote con cambio de nombre de variables
    const pivotFolder = gui.addFolder('Pivot');
    pivotFolder.add(objects.pivot.position, 'x', 0, gl.canvas.width).name('Pivot X');
    pivotFolder.add(objects.pivot.position, 'y', 0, gl.canvas.height).name('Pivot Y');
    pivotFolder.open();
}

main()
