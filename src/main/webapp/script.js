// script.js

// Configuración inicial
let canvas, ctx;
let selectedVertex = -1;
let rotationAngle = 30; // Ángulo de rotación en grados
let totalRotations = 0;

// Parámetros del triángulo
const baseWidth = 320;  // Distancia entre V1 y V2 (d)
const triangleHeight = 280; // Altura del triángulo isósceles

// Vértices del triángulo isósceles invertido
let vertex1, vertex2, vertex3;

// Radios de los círculos
let radii = [];

// Ángulos de rotación de cada conjunto de círculos
let vertexAngles = [0, 0, 0]; // En radianes

// Colores para los 6 grupos
const groupColors = [
    '#ff0000', '#00ff00', '#0000ff', 
    '#ffff00', '#ff00ff', '#00ffff'
];

// Sistema de colores asignados a cada círculo (para la rotación)
let vertexCircleColors = [
    [ // Vértice 1
        ['#ff0000', '#00ff00', '#0000ff'],  // Círculo 0 (interno)
        ['#ffff00', '#ff00ff', '#00ffff'],  // Círculo 1 (medio)
        ['#ff8800', '#00ff88', '#8800ff']   // Círculo 2 (externo)
    ],
    [ // Vértice 2
        ['#00ff00', '#0000ff', '#ff0000'],  // Círculo 0
        ['#ff00ff', '#00ffff', '#ffff00'],  // Círculo 1
        ['#00ff88', '#8800ff', '#ff8800']   // Círculo 2
    ],
    [ // Vértice 3
        ['#0000ff', '#ff0000', '#00ff00'],  // Círculo 0
        ['#00ffff', '#ffff00', '#ff00ff'],  // Círculo 1
        ['#8800ff', '#ff8800', '#00ff88']   // Círculo 2
    ]
];

// Inicialización cuando se carga la página
window.onload = function() {
    // Obtener el canvas y contexto
    canvas = document.getElementById('rubikCanvas');
    ctx = canvas.getContext('2d');
    
    // Configurar tamaño del canvas
    canvas.width = 900;
    canvas.height = 750;
    
    // Inicializar geometría
    initGeometry();
    
    // Dibujar por primera vez
    draw();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Actualizar UI
    updateUI();
};

// Inicializar geometría
function initGeometry() {
    // Centro del canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Vértices del triángulo isósceles invertido
    vertex1 = { 
        x: centerX - baseWidth / 2,
        y: centerY - triangleHeight / 3
    };
    
    vertex2 = { 
        x: centerX + baseWidth / 2,
        y: centerY - triangleHeight / 3
    };
    
    vertex3 = { 
        x: centerX,
        y: centerY + triangleHeight * 2/3
    };
    
    // Calcular distancia V1-V2
    const d = Math.sqrt(Math.pow(vertex2.x - vertex1.x, 2) + Math.pow(vertex2.y - vertex1.y, 2));
    
    // Calcular radios
    const rMajor = d; // Radio mayor = d
    const rMinor = d / 1.5; // Radio menor = d/1.5
    const rMiddle = (rMajor + rMinor) / 2; // Radio medio = promedio
    
    radii = [rMinor, rMiddle, rMajor];
    
    console.log("Geometría inicializada:");
    console.log("d =", d.toFixed(1), "px");
    console.log("Radios:", radii.map(r => r.toFixed(1)).join("px, "), "px");
}

// Configurar event listeners
function setupEventListeners() {
    // Click en el canvas para seleccionar vértice
    canvas.addEventListener('click', handleCanvasClick);
    
    // Botones de selección de vértice
    document.querySelectorAll('.vertex-btn').forEach(btn => {
        if (btn.id !== 'deselectBtn') {
            btn.addEventListener('click', () => {
                const vertexIndex = parseInt(btn.dataset.vertex);
                selectVertex(vertexIndex);
            });
        }
    });
    
    // Botón de deseleccionar
    document.getElementById('deselectBtn').addEventListener('click', () => {
        selectVertex(-1);
    });
    
    // Botones de rotación
    document.getElementById('rotateCW').addEventListener('click', () => {
        rotateSelectedVertex(true); // Sentido horario
    });
    
    document.getElementById('rotateCCW').addEventListener('click', () => {
        rotateSelectedVertex(false); // Sentido antihorario
    });
    
    // Control deslizante de ángulo
    const angleInput = document.getElementById('angleInput');
    const angleValue = document.getElementById('angleValue');
    
    angleInput.addEventListener('input', function() {
        rotationAngle = parseInt(this.value);
        angleValue.textContent = rotationAngle + '°';
    });
    
    // Botones de acción
    document.getElementById('resetBtn').addEventListener('click', resetAll);
    document.getElementById('randomBtn').addEventListener('click', randomize);
    document.getElementById('resetColorsBtn').addEventListener('click', resetColors);
    document.getElementById('hintBtn').addEventListener('click', showHint);
    
    // Teclado para rotación
    document.addEventListener('keydown', handleKeyDown);
    
    // Click en grupos de colores para seleccionar
    document.querySelectorAll('.group').forEach(group => {
        group.addEventListener('click', () => {
            const groupIndex = parseInt(group.dataset.group);
            highlightGroup(groupIndex);
        });
    });
}

// Manejar click en el canvas
function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Verificar qué vértice fue clickeado
    const clickedVertex = getVertexAtPosition(x, y);
    
    if (clickedVertex !== -1) {
        selectVertex(clickedVertex);
    } else {
        selectVertex(-1);
    }
}

// Obtener vértice en una posición
function getVertexAtPosition(x, y) {
    const vertices = [vertex1, vertex2, vertex3];
    
    for (let i = 0; i < vertices.length; i++) {
        const vertex = vertices[i];
        const distance = Math.sqrt(
            Math.pow(x - vertex.x, 2) + Math.pow(y - vertex.y, 2)
        );
        
        // Si está cerca del vértice o dentro del círculo mayor
        if (distance <= 30 || distance <= radii[2] + 20) {
            return i;
        }
    }
    
    return -1;
}

// Seleccionar vértice
function selectVertex(vertexIndex) {
    selectedVertex = vertexIndex;
    
    // Actualizar UI
    updateUI();
    
    // Redibujar
    draw();
}

// Rotar vértice seleccionado
function rotateSelectedVertex(clockwise = true) {
    if (selectedVertex === -1) {
        showNotification('Primero selecciona un vértice', 'warning');
        return;
    }
    
    // Convertir ángulo a radianes
    const angleRad = (rotationAngle * Math.PI) / 180;
    
    // Aplicar rotación en la dirección especificada
    if (clockwise) {
        vertexAngles[selectedVertex] += angleRad;
    } else {
        vertexAngles[selectedVertex] -= angleRad;
    }
    
    // Mantener ángulo entre 0 y 2π
    vertexAngles[selectedVertex] = (vertexAngles[selectedVertex] + Math.PI * 2) % (Math.PI * 2);
    
    // Incrementar contador
    totalRotations++;
    
    // Rotar los colores de los círculos (como un cubo Rubik)
    rotateCircleColors(selectedVertex, clockwise);
    
    // Actualizar UI y redibujar
    updateUI();
    draw();
    
    // Mostrar notificación
    const vertexNames = ['Vértice 1', 'Vértice 2', 'Vértice 3'];
    const direction = clockwise ? 'horario' : 'antihorario';
    showNotification(`${vertexNames[selectedVertex]} rotado ${rotationAngle}° en sentido ${direction}`);
}

// Rotar colores de los círculos de un vértice
function rotateCircleColors(vertexIndex, clockwise) {
    const colors = vertexCircleColors[vertexIndex];
    
    // Rotar colores de cada círculo
    for (let circleIndex = 0; circleIndex < 3; circleIndex++) {
        const circleColors = colors[circleIndex];
        
        if (clockwise) {
            // Rotar a la derecha: [a, b, c] -> [c, a, b]
            const last = circleColors.pop();
            circleColors.unshift(last);
        } else {
            // Rotar a la izquierda: [a, b, c] -> [b, c, a]
            const first = circleColors.shift();
            circleColors.push(first);
        }
    }
}

// Manejar teclas del teclado
function handleKeyDown(event) {
    if (selectedVertex === -1) return;
    
    switch(event.key) {
        case 'ArrowRight':
            // Rotar en sentido horario
            event.preventDefault();
            rotateSelectedVertex(true);
            break;
            
        case 'ArrowLeft':
            // Rotar en sentido antihorario
            event.preventDefault();
            rotateSelectedVertex(false);
            break;
            
        case ' ':
            // Espacio para deseleccionar
            event.preventDefault();
            selectVertex(-1);
            break;
    }
}

// Dibujar todo
function draw() {
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar triángulo
    drawTriangle();
    
    // Dibujar todos los círculos
    drawAllCircles();
    
    // Dibujar puntos de intersección
    drawAllIntersectionPoints();
    
    // Dibujar información adicional
    drawInfo();
}

// Dibujar triángulo isósceles
function drawTriangle() {
    ctx.beginPath();
    ctx.moveTo(vertex1.x, vertex1.y);
    ctx.lineTo(vertex2.x, vertex2.y);
    ctx.lineTo(vertex3.x, vertex3.y);
    ctx.closePath();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.fill();
    
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.stroke();
    
    // Dibujar vértices
    drawVertexPoint(vertex1, 'V1');
    drawVertexPoint(vertex2, 'V2');
    drawVertexPoint(vertex3, 'V3');
}

// Dibujar un vértice
function drawVertexPoint(vertex, label) {
    const vertexIndex = label === 'V1' ? 0 : (label === 'V2' ? 1 : 2);
    const isSelected = vertexIndex === selectedVertex;
    
    // Dibujar punto del vértice
    ctx.beginPath();
    ctx.arc(vertex.x, vertex.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? '#ffd43b' : '#4dabf7';
    ctx.fill();
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = isSelected ? 'rgba(255, 212, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)';
    ctx.stroke();
    
    // Etiqueta
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = isSelected ? '#ffd43b' : '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(label, vertex.x, vertex.y - 20);
    
    // Si está seleccionado, dibujar anillo de selección
    if (isSelected) {
        ctx.beginPath();
        ctx.arc(vertex.x, vertex.y, 15, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 212, 59, 0.6)';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

// Dibujar todos los círculos
function drawAllCircles() {
    const vertices = [vertex1, vertex2, vertex3];
    
    vertices.forEach((vertex, vertexIndex) => {
        const isSelected = vertexIndex === selectedVertex;
        
        for (let i = 0; i < 3; i++) {
            drawCircleOutline(
                vertex.x, 
                vertex.y, 
                radii[i], 
                vertexAngles[vertexIndex],
                i,
                isSelected
            );
        }
    });
}

// Dibujar círculo (solo borde)
function drawCircleOutline(x, y, radius, angle, circleIndex, isSelected) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    // Estilo diferente para círculos seleccionados
    if (isSelected) {
        ctx.lineWidth = circleIndex === 0 ? 2 : (circleIndex === 1 ? 2.5 : 3);
        const opacity = 0.2 + circleIndex * 0.1;
        ctx.strokeStyle = `rgba(255, 212, 59, ${opacity})`;
    } else {
        ctx.lineWidth = circleIndex === 0 ? 1.2 : (circleIndex === 1 ? 1.5 : 2);
        const opacity = 0.1 + circleIndex * 0.05;
        ctx.strokeStyle = `rgba(200, 200, 220, ${opacity})`;
    }
    
    ctx.stroke();
    
    // Línea de referencia para rotación
    drawRotationReference(x, y, radius, angle, circleIndex, isSelected);
}

// Dibujar línea de referencia de rotación
function drawRotationReference(x, y, radius, angle, circleIndex, isSelected) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    const endX = x + Math.cos(angle) * radius;
    const endY = y + Math.sin(angle) * radius;
    ctx.lineTo(endX, endY);
    
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isSelected ? 
        `rgba(255, 212, 59, ${0.5 + circleIndex * 0.1})` :
        `rgba(100, 150, 255, ${0.3 + circleIndex * 0.1})`;
    ctx.stroke();
    
    // Punto en el extremo
    ctx.beginPath();
    ctx.arc(endX, endY, 5, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? 
        `rgba(255, 212, 59, ${0.8 + circleIndex * 0.1})` :
        `rgba(100, 150, 255, ${0.6 + circleIndex * 0.1})`;
    ctx.fill();
}

// Dibujar todos los puntos de intersección
function drawAllIntersectionPoints() {
    const vertices = [
        { vertex: vertex1, angle: vertexAngles[0], id: 0 },
        { vertex: vertex2, angle: vertexAngles[1], id: 1 },
        { vertex: vertex3, angle: vertexAngles[2], id: 2 }
    ];
    
    let totalPoints = 0;
    
    for (let v1 = 0; v1 < vertices.length; v1++) {
        for (let v2 = v1 + 1; v2 < vertices.length; v2++) {
            for (let r1 = 0; r1 < 3; r1++) {
                for (let r2 = 0; r2 < 3; r2++) {
                    const intersections = calculateCircleIntersection(
                        vertices[v1].vertex.x, vertices[v1].vertex.y, radii[r1],
                        vertices[v2].vertex.x, vertices[v2].vertex.y, radii[r2]
                    );
                    
                    if (intersections) {
                        const groupIndex = getGroupIndex(v1, v2, r1, r2);
                        
                        drawIntersectionPoint(
                            intersections.p1, 
                            groupColors[groupIndex],
                            groupIndex
                        );
                        
                        drawIntersectionPoint(
                            intersections.p2, 
                            groupColors[groupIndex],
                            groupIndex
                        );
                        
                        totalPoints += 2;
                    }
                }
            }
        }
    }
}

// Calcular intersección entre círculos
function calculateCircleIntersection(x0, y0, r0, x1, y1, r1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const d = Math.sqrt(dx * dx + dy * dy);
    
    // Verificar que los círculos se intersectan
    if (d > r0 + r1 || d < Math.abs(r0 - r1)) {
        return null;
    }
    
    const a = (r0 * r0 - r1 * r1 + d * d) / (2 * d);
    const h = Math.sqrt(r0 * r0 - a * a);
    
    const x2 = x0 + (dx * a) / d;
    const y2 = y0 + (dy * a) / d;
    
    const rx = -dy * (h / d);
    const ry = dx * (h / d);
    
    return {
        p1: { x: x2 + rx, y: y2 + ry },
        p2: { x: x2 - rx, y: y2 - ry }
    };
}

// Determinar índice de grupo
function getGroupIndex(v1, v2, r1, r2) {
    const vertexPair = v1 * 3 + v2;
    const radiusPair = r1 * 3 + r2;
    const combined = vertexPair * 9 + radiusPair;
    return Math.floor(combined / 4.5) % 6;
}

// Dibujar punto de intersección
function drawIntersectionPoint(point, color, groupIndex) {
    const pointSize = 10 - groupIndex * 0.3;
    
    ctx.beginPath();
    ctx.arc(point.x, point.y, pointSize, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    ctx.lineWidth = 1;
    ctx.strokeStyle = darkenColor(color, 20);
    ctx.stroke();
    
    // Punto central
    ctx.beginPath();
    ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = lightenColor(color, 30);
    ctx.fill();
}

// Funciones de utilidad para colores
function darkenColor(colorHex, percent) {
    const color = hexToRgb(colorHex);
    const factor = 1 - percent / 100;
    const r = Math.max(0, Math.floor(color.r * factor));
    const g = Math.max(0, Math.floor(color.g * factor));
    const b = Math.max(0, Math.floor(color.b * factor));
    return `rgb(${r}, ${g}, ${b})`;
}

function lightenColor(colorHex, percent) {
    const color = hexToRgb(colorHex);
    const factor = 1 + percent / 100;
    const r = Math.min(255, Math.floor(color.r * factor));
    const g = Math.min(255, Math.floor(color.g * factor));
    const b = Math.min(255, Math.floor(color.b * factor));
    return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

// Dibujar información adicional
function drawInfo() {
    // Información de radios
    ctx.font = '12px Arial';
    ctx.fillStyle = '#a0a0c0';
    ctx.textAlign = 'left';
    
    ctx.fillText(`Radio mayor: ${radii[2].toFixed(0)}px`, 20, 30);
    ctx.fillText(`Radio menor: ${radii[0].toFixed(0)}px (d/1.5)`, 20, 45);
    ctx.fillText(`Radio medio: ${radii[1].toFixed(0)}px`, 20, 60);
    
    // Información de selección
    if (selectedVertex !== -1) {
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#ffd43b';
        ctx.textAlign = 'right';
        ctx.fillText(`Vértice ${selectedVertex + 1} seleccionado`, canvas.width - 20, 30);
        
        ctx.font = '14px Arial';
        ctx.fillStyle = '#a0a0c0';
        ctx.fillText(`Ángulo: ${Math.round(vertexAngles[selectedVertex] * 180 / Math.PI)}°`, 
                    canvas.width - 20, 50);
    }
}

// Actualizar UI
function updateUI() {
    // Actualizar información del vértice seleccionado
    const selectedVertexElement = document.getElementById('selectedVertex');
    selectedVertexElement.textContent = selectedVertex === -1 ? 
        'Ninguno' : `Vértice ${selectedVertex + 1}`;
    
    // Actualizar ángulo actual del vértice seleccionado
    const rotationAngleElement = document.getElementById('rotationAngle');
    if (selectedVertex !== -1) {
        const angleDeg = Math.round(vertexAngles[selectedVertex] * 180 / Math.PI);
        rotationAngleElement.textContent = `${angleDeg}°`;
    } else {
        rotationAngleElement.textContent = '0°';
    }
    
    // Actualizar contador de rotaciones
    document.getElementById('totalRotations').textContent = totalRotations;
    
    // Actualizar botones de vértice
    document.querySelectorAll('.vertex-btn').forEach((btn, index) => {
        if (btn.id !== 'deselectBtn') {
            const vertexIndex = parseInt(btn.dataset.vertex);
            if (vertexIndex === selectedVertex) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });
    
    // Actualizar mensaje de selección
    const selectionInfo = document.getElementById('selectionInfo');
    if (selectedVertex === -1) {
        selectionInfo.innerHTML = '<i class="fas fa-mouse-pointer"></i> Haz clic en un círculo para seleccionarlo';
    } else {
        selectionInfo.innerHTML = `<i class="fas fa-bullseye"></i> Vértice ${selectedVertex + 1} seleccionado - Usa las flechas o botones para rotar`;
    }
}

// Resaltar grupo de colores
function highlightGroup(groupIndex) {
    document.querySelectorAll('.group').forEach((group, index) => {
        if (index === groupIndex) {
            group.classList.add('active');
        } else {
            group.classList.remove('active');
        }
    });
}

// Funciones de acción
function resetAll() {
    // Resetear ángulos
    vertexAngles = [0, 0, 0];
    
    // Resetear colores a su estado inicial
    vertexCircleColors = [
        [
            ['#ff0000', '#00ff00', '#0000ff'],
            ['#ffff00', '#ff00ff', '#00ffff'],
            ['#ff8800', '#00ff88', '#8800ff']
        ],
        [
            ['#00ff00', '#0000ff', '#ff0000'],
            ['#ff00ff', '#00ffff', '#ffff00'],
            ['#00ff88', '#8800ff', '#ff8800']
        ],
        [
            ['#0000ff', '#ff0000', '#00ff00'],
            ['#00ffff', '#ffff00', '#ff00ff'],
            ['#8800ff', '#ff8800', '#00ff88']
        ]
    ];
    
    // Resetear contador
    totalRotations = 0;
    
    // Deseleccionar
    selectVertex(-1);
    
    // Mostrar notificación
    showNotification('Todo ha sido reiniciado a su estado inicial');
}

function randomize() {
    // Rotaciones aleatorias para cada vértice
    for (let i = 0; i < 3; i++) {
        // Ángulo aleatorio
        vertexAngles[i] = Math.random() * Math.PI * 2;
        
        // Rotaciones aleatorias de colores (0-2 rotaciones en cada dirección)
        const rotations = Math.floor(Math.random() * 3);
        const direction = Math.random() > 0.5;
        
        for (let j = 0; j < rotations; j++) {
            rotateCircleColors(i, direction);
        }
        
        totalRotations += rotations;
    }
    
    // Seleccionar vértice aleatorio
    selectVertex(Math.floor(Math.random() * 3));
    
    // Redibujar
    draw();
    
    showNotification('Configuración aleatoria aplicada');
}

function resetColors() {
    // Resetear solo los colores
    vertexCircleColors = [
        [
            ['#ff0000', '#00ff00', '#0000ff'],
            ['#ffff00', '#ff00ff', '#00ffff'],
            ['#ff8800', '#00ff88', '#8800ff']
        ],
        [
            ['#00ff00', '#0000ff', '#ff0000'],
            ['#ff00ff', '#00ffff', '#ffff00'],
            ['#00ff88', '#8800ff', '#ff8800']
        ],
        [
            ['#0000ff', '#ff0000', '#00ff00'],
            ['#00ffff', '#ffff00', '#ff00ff'],
            ['#8800ff', '#ff8800', '#00ff88']
        ]
    ];
    
    // Redibujar
    draw();
    
    showNotification('Colores reseteados a su estado inicial');
}

function showHint() {
    alert('TRIÁNGULO RUBIK 2D - INTERACTIVO\n\n' +
          'CONTROLES:\n' +
          '• Click en cualquier círculo → Selecciona el vértice\n' +
          '• Botones "Vértice 1/2/3" → Selección rápida\n' +
          '• Botón "Deseleccionar" → Quita la selección\n\n' +
          'ROTACIÓN:\n' +
          '• Botón "Sentido Horario" (→) → Rota colores a la derecha\n' +
          '• Botón "Sentido Antihorario" (←) → Rota colores a la izquierda\n' +
          '• Flechas del teclado ← → también funcionan\n' +
          '• Control deslizante → Ajusta el ángulo de rotación\n\n' +
          'ACCIÓN:\n' +
          '• Reiniciar Todo → Vuelve al estado inicial\n' +
          '• Aleatorizar → Configuración aleatoria\n' +
          '• Resetear Colores → Solo los colores\n\n' +
          'VISUALIZACIÓN:\n' +
          '• Los círculos seleccionados se muestran en amarillo\n' +
          '• Los puntos de color se actualizan automáticamente\n' +
          '• Cada grupo tiene 9 puntos del mismo color');
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Estilos
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'warning' ? 'linear-gradient(135deg, #ffd43b, #fab005)' : 
                    'linear-gradient(135deg, #4dabf7, #339af0)'};
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        z-index: 1000;
        box-shadow: 0 5px 20px rgba(0,0,0,0.4);
        font-weight: bold;
        animation: fadeInOut 3s ease-in-out;
        max-width: 300px;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    // Agregar icono
    const icon = document.createElement('i');
    icon.className = type === 'warning' ? 'fas fa-exclamation-triangle' : 'fas fa-info-circle';
    notification.prepend(icon);
    
    // Agregar estilos de animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-20px); }
            15% { opacity: 1; transform: translateY(0); }
            85% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-20px); }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            document.body.removeChild(notification);
        }
        if (style.parentNode) {
            document.head.removeChild(style);
        }
    }, 3000);
}

// Función para obtener colores actuales de un círculo (para depuración)
function getCircleColors(vertexIndex, circleIndex) {
    if (vertexIndex >= 0 && vertexIndex < 3 && circleIndex >= 0 && circleIndex < 3) {
        return vertexCircleColors[vertexIndex][circleIndex];
    }
    return null;
}

// Función para rotar un círculo específico (para futuras expansiones)
function rotateSpecificCircle(vertexIndex, circleIndex, clockwise = true) {
    if (vertexIndex >= 0 && vertexIndex < 3 && circleIndex >= 0 && circleIndex < 3) {
        const circleColors = vertexCircleColors[vertexIndex][circleIndex];
        
        if (clockwise) {
            const last = circleColors.pop();
            circleColors.unshift(last);
        } else {
            const first = circleColors.shift();
            circleColors.push(first);
        }
        
        totalRotations++;
        draw();
        updateUI();
        
        return true;
    }
    return false;
}

