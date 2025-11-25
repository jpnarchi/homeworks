/*
 * Script para generar modelos 3D de edificios cilíndricos en formato OBJ
 * Genera conos truncados con número configurable de lados, altura y radios
 *
 * Juan Pablo Narchi - A01781518
 * 2025
 */

'use strict';

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// FUNCIONES DE UTILIDAD PARA ÁLGEBRA LINEAL
// =============================================================================

// Normaliza un vector 3D
function normalize(v) {
    let length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    if (length === 0) return [0, 0, 0];
    return [v[0] / length, v[1] / length, v[2] / length];
}

// =============================================================================
// FUNCIONES DE GENERACIÓN DE GEOMETRÍA
// =============================================================================

// Calcula la normal para la superficie lateral del cono truncado
// Usa la pendiente del cono para calcular las normales correctamente
function calculateSideNormal(angle, baseRadius, topRadius, height) {
    // Dirección de la normal en el plano XZ
    let nx = Math.cos(angle);
    let nz = Math.sin(angle);

    // Calcular el componente Y basado en la pendiente del cono
    let radiusDiff = baseRadius - topRadius;
    let ny = radiusDiff / height;

    return normalize([nx, ny, nz]);
}

// Genera la geometría completa del edificio
// Estructura: 2 centros + pares de vértices (base, top) por cada lado
function generateBuilding(sides, height, baseRadius, topRadius) {
    let vertices = [];
    let normals = [];
    let faces = [];

    let angleStep = (2 * Math.PI) / sides;

    // ==========================================================================
    // GENERACIÓN DE VÉRTICES Y NORMALES
    // ==========================================================================

    // Vértice 1: centro inferior (0, 0, 0)
    vertices.push([0, 0, 0]);
    // Vértice 2: centro superior (0, height, 0)
    vertices.push([0, height, 0]);

    // Generar pares de vértices para cada lado
    for (let i = 0; i < sides; i++) {
        let angle = angleStep * i;

        // Vértice en la base
        let xBase = Math.cos(angle) * baseRadius;
        let zBase = Math.sin(angle) * baseRadius;
        vertices.push([xBase, 0, zBase]);

        // Vértice en la cima
        let xTop = Math.cos(angle) * topRadius;
        let zTop = Math.sin(angle) * topRadius;
        vertices.push([xTop, height, zTop]);
    }

    // Generar normales: 4 normales por cada lado
    // (normal inferior, normal superior, normal lateral, normal lateral)
    for (let i = 0; i < sides; i++) {
        let angle = angleStep * i;
        let nextAngle = angleStep * ((i + 1) % sides);

        // Calcular normal lateral promediada entre este ángulo y el siguiente
        let midAngle = (angle + nextAngle) / 2;
        if (nextAngle < angle) {
            midAngle = (angle + nextAngle + 2 * Math.PI) / 2;
        }

        let sideNormal = calculateSideNormal(midAngle, baseRadius, topRadius, height);

        // Normal hacia abajo (para tapa inferior)
        normals.push([0, -1, 0]);
        // Normal hacia arriba (para tapa superior)
        normals.push([0, 1, 0]);
        // Normal lateral (para cara lateral inferior)
        normals.push(sideNormal);
        // Normal lateral (para cara lateral superior)
        normals.push(sideNormal);
    }

    // ==========================================================================
    // GENERACIÓN DE CARAS (TRIÁNGULOS)
    // ==========================================================================

    // Para cada lado, generar 4 triángulos
    for (let i = 0; i < sides; i++) {
        let nextI = (i + 1) % sides;

    // Índices de vértices (1-indexed para OBJ)
        let centerBottom = 1;
        let centerTop = 2;
        let currBase = 3 + i * 2;      // Vértice base actual
        let currTop = 4 + i * 2;       // Vértice top actual
        let nextBase = 3 + nextI * 2;  // Vértice base siguiente
        let nextTop = 4 + nextI * 2;   // Vértice top siguiente

        // Índices de normales (1-indexed para OBJ)
        let normalBase = i * 4 + 1;    // Normal hacia abajo
        let normalTop = i * 4 + 2;     // Normal hacia arriba
        let normalSide1 = i * 4 + 3;   // Normal lateral
        let normalSide2 = i * 4 + 4;   // Normal lateral

        // Triángulo 1: Tapa inferior (nextBase, centerBottom, currBase)
        faces.push([[nextBase, normalBase], [centerBottom, normalBase], [currBase, normalBase]]);

        // Triángulo 2: Tapa superior (currTop, centerTop, nextTop)
        faces.push([[currTop, normalTop], [centerTop, normalTop], [nextTop, normalTop]]);

        // Triángulo 3: Lateral inferior (nextBase, currBase, currTop)
        faces.push([[nextBase, normalSide1], [currBase, normalSide1], [currTop, normalSide1]]);

        // Triángulo 4: Lateral superior (nextTop, nextBase, currTop)
        faces.push([[nextTop, normalSide2], [nextBase, normalSide2], [currTop, normalSide2]]);
    }

    return { vertices, normals, faces };
}

// =============================================================================
// GENERACIÓN DE ARCHIVO OBJ
// =============================================================================

// Genera el contenido del archivo OBJ a partir de los datos de geometría
function generateOBJContent(geometry, sides, height, baseRadius, topRadius) {
    let lines = [];
    // Lista de lineas

    // Vértices
    for (let v of geometry.vertices) {
        lines.push(`v ${v[0].toFixed(4)} ${v[1].toFixed(4)} ${v[2].toFixed(4)}`);
    }

    // Normales
    lines.push(`# ${geometry.normals.length} normals`);
    for (let n of geometry.normals) {
        lines.push(`vn ${n[0].toFixed(4)} ${n[1].toFixed(4)} ${n[2].toFixed(4)}`);
    }

    // Caras
    lines.push(`# ${geometry.faces.length} faces`);
    for (let f of geometry.faces) {
        lines.push(`f ${f[0][0]}//${f[0][1]} ${f[1][0]}//${f[1][1]} ${f[2][0]}//${f[2][1]}`);
    }

    return lines.join('\n');
}

// Genera el nombre del archivo OBJ
function generateFilename(sides, height, baseRadius, topRadius) {
    return `building_${sides}_${height}_${baseRadius}_${topRadius}.obj`;
}

// =============================================================================
// PROGRAMA PRINCIPAL
// =============================================================================

// Parsea los argumentos de línea de comandos
function parseArguments() {
    let args = process.argv.slice(2);

    // Valores por defecto
    let sides = 8;
    let height = 6.0;
    let baseRadius = 1.0;
    let topRadius = 0.8;

    // Parsear argumentos si se proporcionan
    if (args.length >= 1) {
        sides = parseInt(args[0], 10);
        if (isNaN(sides) || sides < 3 || sides > 36) {
            console.error('Error: El número de lados debe ser un entero entre 3 y 36');
            process.exit(1);
        }
    }

    if (args.length >= 2) {
        height = parseFloat(args[1]);
        if (isNaN(height) || height <= 0) {
            console.error('Error: La altura debe ser un número positivo');
            process.exit(1);
        }
    }

    if (args.length >= 3) {
        baseRadius = parseFloat(args[2]);
        if (isNaN(baseRadius) || baseRadius <= 0) {
            console.error('Error: El radio de la base debe ser un número positivo');
            process.exit(1);
        }
    }

    if (args.length >= 4) {
        topRadius = parseFloat(args[3]);
        if (isNaN(topRadius) || topRadius <= 0) {
            console.error('Error: El radio de la cima debe ser un número positivo');
            process.exit(1);
        }
    }

    return { sides, height, baseRadius, topRadius };
}

// Función principal
function main() {
    // Parsear argumentos de línea de comandos
    let params = parseArguments();

    console.log(`Generando edificio con parámetros:`);
    console.log(`  Lados: ${params.sides}`);
    console.log(`  Altura: ${params.height}`);
    console.log(`  Radio base: ${params.baseRadius}`);
    console.log(`  Radio cima: ${params.topRadius}`);

    // Generar geometría
    let geometry = generateBuilding(
        params.sides,
        params.height,
        params.baseRadius,
        params.topRadius
    );

    // Generar contenido OBJ
    let objContent = generateOBJContent(
        geometry,
        params.sides,
        params.height,
        params.baseRadius,
        params.topRadius
    );

    // Generar nombre de archivo
    let filename = generateFilename(
        params.sides,
        params.height,
        params.baseRadius,
        params.topRadius
    );

    // Escribir archivo
    let outputPath = path.join(__dirname, filename);
    fs.writeFileSync(outputPath, objContent);

    console.log(`\nArchivo OBJ generado exitosamente: ${filename}`);
    console.log(`Total de vértices: ${geometry.vertices.length}`);
    console.log(`Total de caras: ${geometry.faces.length}`);
}


main();
