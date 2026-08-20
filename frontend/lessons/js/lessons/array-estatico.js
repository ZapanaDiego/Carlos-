/* ================================================================= */
/* LÓGICA E INTERACTIVIDAD: ANATOMÍA DE UN ARREGLO EN MEMORIA        */
/* ================================================================= */

// Estado Global del Módulo
let currentScene = 1;
let soundEnabled = true;

// Estados de las Escenas
let s1Type = 'int'; // 'int' (4 bytes) | 'char' (1 byte) | 'double' (8 bytes)
let s2Index = 0;
let s2Type = 'int';

const arrayColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
const arrayValues = [12, 45, 99, 7];

// Cantidad real de escenas implementadas (usado para validar navegación)
const TOTAL_SCENES = 2;

// Sintetizador Web Audio API para Efectos Sonoros
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type = 'sine', duration = 0.08, gainVal = 0.04) {
    if (!soundEnabled) return;
    try {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
        // Audio fallback silent failure
    }
}

function playErrorSound() {
    if (!soundEnabled) return;
    playTone(160, 'sawtooth', 0.18, 0.08);
    setTimeout(() => playTone(110, 'sawtooth', 0.25, 0.08), 80);
}

function playSuccessSound() {
    if (!soundEnabled) return;
    playTone(523.25, 'sine', 0.08, 0.04);
    setTimeout(() => playTone(659.25, 'sine', 0.08, 0.04), 70);
    setTimeout(() => playTone(783.99, 'sine', 0.12, 0.04), 140);
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const icon = document.getElementById('sound-icon');
    const btn = document.getElementById('sound-btn');
    if (soundEnabled) {
        if (icon) icon.className = 'fa-solid fa-volume-high text-indigo-400';
        if (btn) btn.classList.remove('opacity-50');
        playTone(440, 'sine', 0.08, 0.04);
    } else {
        if (icon) icon.className = 'fa-solid fa-volume-xmark text-slate-500';
        if (btn) btn.classList.add('opacity-50');
    }
}

// Navegación e interfaz de la barra superior
function updateNavUI() {
    document.querySelectorAll('.nav-btn').forEach((btn, idx) => {
        const stepNum = idx + 1;

        // FIX (Bug 3): preferir una clase específica para el círculo numerado
        // en vez de "el primer <span> que aparezca", que es frágil si el botón
        // tiene más de un <span> (ícono + texto + número).
        const stepEl = btn.querySelector('.nav-step-num') || btn.querySelector('span');

        if (stepNum === currentScene) {
            btn.className = "nav-btn px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-2 text-indigo-400 bg-indigo-950/60 border border-indigo-500/40 shadow-lg shadow-indigo-500/10";
            if (stepEl) stepEl.className = "w-5 h-5 rounded-full bg-indigo-500 text-slate-950 flex items-center justify-center text-xs font-mono font-bold";
        } else {
            btn.className = "nav-btn px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900";
            if (stepEl) stepEl.className = "w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-xs font-mono font-bold";
        }
    });

    const prevBtn = document.getElementById('prev-scene-btn');
    if (prevBtn) prevBtn.disabled = (currentScene === 1);

    const nextBtn = document.getElementById('next-scene-btn');
    if (nextBtn) {
        if (currentScene === TOTAL_SCENES) {
            nextBtn.innerHTML = 'Reiniciar Tour <i class="fa-solid fa-rotate-right text-xs"></i>';
        } else {
            nextBtn.innerHTML = 'Siguiente <i class="fa-solid fa-arrow-right text-xs"></i>';
        }
    }
}

function loadScene(sceneNumber) {
    // FIX (Bug 2): si el número de escena no existe (por ejemplo, quedó un
    // botón de navegación viejo apuntando a una escena 3 que ya no existe),
    // no dejamos la pantalla congelada: volvemos a la Escena 1 de forma segura.
    if (sceneNumber < 1 || sceneNumber > TOTAL_SCENES) {
        console.warn(`Escena ${sceneNumber} no existe. Volviendo a la Escena 1.`);
        sceneNumber = 1;
    }

    currentScene = sceneNumber;
    updateNavUI();
    playTone(320 + sceneNumber * 60, 'sine', 0.06, 0.03);

    const viewport = document.getElementById('scene-viewport');
    if (!viewport) return;

    viewport.className = "relative bg-slate-900/60 border border-slate-800 rounded-3xl p-4 md:p-8 min-h-[480px] w-full flex flex-col justify-center items-center shadow-2xl overflow-hidden backdrop-blur-xl scene-enter";

    switch (sceneNumber) {
        case 1:
            renderScene1(viewport);
            break;
        case 2:
            renderScene2(viewport);
            break;
        default:
            // No debería llegar aquí gracias a la validación de arriba,
            // pero se deja como red de seguridad final.
            renderScene1(viewport);
            break;
    }
}

function nextScene() {
    if (currentScene < TOTAL_SCENES) {
        loadScene(currentScene + 1);
    } else {
        loadScene(1);
    }
}

function prevScene() {
    if (currentScene > 1) {
        loadScene(currentScene - 1);
    }
}

/* ================================================================= */
/* ESCENA 1: LOS CASILLEROS PEGADOS (CONTIGÜIDAD EN MEMORIA RAM)    */
/* ================================================================= */

function renderScene1(container) {
    const titleEl = document.getElementById('scene-title');
    const descEl = document.getElementById('scene-description');
    const badgeEl = document.getElementById('scene-icon-badge');

    if (titleEl) titleEl.textContent = 'Escena 1 — Los Casilleros Pegados en RAM';
    if (descEl) descEl.textContent = 'Un arreglo es un bloque continuo de memoria: los casilleros están pegados en orden consecutivo, sin huecos intermedios.';
    if (badgeEl) badgeEl.innerHTML = '<i class="fa-solid fa-table-cells text-indigo-400 text-lg"></i>';

    const bytesPerElem = s1GetTypeBytes(s1Type);

    let html = `
        <div class="w-full max-w-4xl flex flex-col items-center gap-5 py-2">
            
            <!-- Resumen Conceptual -->
            <div class="w-full bg-indigo-950/40 border border-indigo-500/30 p-3.5 rounded-2xl flex items-center gap-3 text-center sm:text-left justify-center">
                <span class="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold text-sm">💡</span>
                <p class="text-xs sm:text-sm font-semibold text-slate-200">
                    "Un arreglo <span class="text-indigo-400 font-bold">NO son cajas dispersas</span> — es una fila de casilleros pegados en la RAM, <span class="text-emerald-400 font-bold">sin espacios vacíos</span>."
                </p>
            </div>

            <!-- Controles Interactivos -->
            <div class="flex flex-wrap items-center justify-between gap-3 w-full bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-mono text-slate-400">Tipo de Dato:</span>
                    <div class="flex bg-slate-900 p-1 rounded-xl border border-slate-800 gap-1">
                        <button onclick="setS1Type('char')" class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${s1Type === 'char' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
                            char (1 B)
                        </button>
                        <button onclick="setS1Type('int')" class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${s1Type === 'int' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
                            int (4 B)
                        </button>
                        <button onclick="setS1Type('double')" class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${s1Type === 'double' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
                            double (8 B)
                        </button>
                    </div>
                </div>

                <button onclick="triggerS1AddError()" class="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-2 transition-all hover:scale-105">
                    <i class="fa-solid fa-plus-circle text-amber-400"></i> ¿Insertar elemento extra?
                </button>
            </div>

            <!-- Lienzo de Memoria -->
            <div class="w-full bg-slate-950 p-5 rounded-3xl border-2 border-slate-800 shadow-2xl relative overflow-x-auto custom-scrollbar">
                
                <div class="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                    <span class="text-xs font-mono text-slate-400 font-bold flex items-center gap-2">
                        <i class="fa-solid fa-microchip text-indigo-400"></i> DIRECCIONES CONSECUTIVAS EN LA MEMORIA RAM
                    </span>
                    <span class="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2.5 py-0.5 rounded-md border border-emerald-500/30 font-bold">
                        0 Bytes de Separación entre Elementos
                    </span>
                </div>

                <!-- Fila de Casilleros de Memoria -->
                <div class="flex items-center justify-center gap-1.5 py-4 min-w-[580px]">
                    ${s1GenerateLockersHTML(bytesPerElem)}
                </div>

                <!-- Tarjetas Informativas Clave -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
                    <div class="bg-slate-900/80 p-3 rounded-2xl border border-slate-800/80 flex items-center gap-3">
                        <div class="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-link"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-slate-200">Contigüidad</h4>
                            <p class="text-[11px] text-slate-400">Están en fila consecutiva como casilleros numerados.</p>
                        </div>
                    </div>

                    <div class="bg-slate-900/80 p-3 rounded-2xl border border-slate-800/80 flex items-center gap-3">
                        <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-magnet"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-slate-200">Sin Huecos</h4>
                            <p class="text-[11px] text-slate-400">El elemento #1 empieza exactamente donde acaba el #0.</p>
                        </div>
                    </div>

                    <div class="bg-slate-900/80 p-3 rounded-2xl border border-slate-800/80 flex items-center gap-3">
                        <div class="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-lock"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-slate-200">Tamaño Fijo</h4>
                            <p class="text-[11px] text-slate-400">Reservado desde el inicio. No se puede estirar sobre la marcha.</p>
                        </div>
                    </div>
                </div>

                <!-- Modal Explicativo de Error al Agregar Elementos -->
                <!-- FIX (Bug 1): el modal ahora vive DENTRO del Lienzo de Memoria
                     (que sí tiene "relative"), así "absolute inset-0" cubre
                     exactamente este bloque y no toda la escena. -->
                <div id="s1-error-modal" class="hidden absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-shake rounded-3xl">
                    <div class="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl mb-2 border border-amber-500/40">
                        <i class="fa-solid fa-hand"></i>
                    </div>
                    <h4 class="font-extrabold text-amber-400 text-base">¡TAMAÑO FIJO DESDE LA DECLARACIÓN!</h4>
                    <p class="text-xs text-slate-300 max-w-sm mt-2 leading-relaxed">
                        Al escribir <code class="text-amber-300 font-mono">arr[4]</code>, el sistema operativo reservó exclusivamente 4 casilleros contiguos.
                        <br/><br/>
                        <b>Justo al lado derecho ya hay memoria ocupada por otras variables o programas</b>. ¡No puedes empujar la memoria RAM vecina!
                    </p>
                    <button onclick="closeS1ErrorModal()" class="mt-4 px-5 py-2 bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl hover:bg-amber-400 shadow-lg transition-all">
                        Entendido
                    </button>
                </div>

            </div>

        </div>
    `;
    container.innerHTML = html;
}

function s1GetTypeBytes(type) {
    if (type === 'char') return 1;
    if (type === 'double') return 8;
    return 4; // 'int' por defecto
}

function setS1Type(type) {
    s1Type = type;
    playTone(450, 'sine', 0.06, 0.03);
    const viewport = document.getElementById('scene-viewport');
    if (viewport) renderScene1(viewport);
}

function s1GenerateLockersHTML(bytesPerElem) {
    let html = '';
    let currentAddr = 0x2000;

    for (let i = 0; i < 4; i++) {
        const color = arrayColors[i];
        html += `
            <div class="flex flex-col items-center p-2 rounded-2xl border-2 transition-all hover:scale-105" style="border-color: ${color}; background-color: ${color}12;">
                
                <div class="flex items-center gap-1 font-mono text-xs font-extrabold mb-1.5" style="color: ${color}">
                    <span>arr[${i}]</span>
                    <span class="text-[10px] opacity-80 font-normal">(Val: ${arrayValues[i]})</span>
                </div>

                <div class="flex items-center gap-1">
        `;

        for (let b = 0; b < bytesPerElem; b++) {
            const hexAddr = '0x' + currentAddr.toString(16).toUpperCase();
            html += `
                <div class="w-11 h-14 rounded-xl flex flex-col items-center justify-between p-1 font-mono text-[9px] border shadow-sm" style="background-color: ${color}20; border-color: ${color}50;">
                    <span class="text-slate-400 font-bold text-[8px]">${hexAddr}</span>
                    <div class="w-full h-px bg-slate-700/50"></div>
                    <span class="font-extrabold text-slate-200">B${b + 1}</span>
                </div>
            `;
            currentAddr++;
        }

        html += `
                </div>
                <span class="text-[9px] font-mono text-slate-400 mt-1">${bytesPerElem} Byte${bytesPerElem > 1 ? 's' : ''}</span>
            </div>
        `;

        if (i < 3) {
            html += `
                <div class="flex flex-col items-center text-slate-600 px-0.5" title="Cero espacio de separación">
                    <i class="fa-solid fa-link text-xs text-indigo-400"></i>
                    <span class="text-[8px] font-mono text-slate-500">0B</span>
                </div>
            `;
        }
    }
    return html;
}

function triggerS1AddError() {
    const modal = document.getElementById('s1-error-modal');
    if (modal) modal.classList.remove('hidden');
    playErrorSound();
}

function closeS1ErrorModal() {
    const modal = document.getElementById('s1-error-modal');
    if (modal) modal.classList.add('hidden');
    playTone(400, 'sine', 0.06, 0.03);
}

/* ================================================================= */
/* ESCENA 2: EL ÍNDICE ES CONTAR PASOS (ARITMÉTICA DE PUNTEROS)      */
/* ================================================================= */

function renderScene2(container) {
    const titleEl = document.getElementById('scene-title');
    const descEl = document.getElementById('scene-description');
    const badgeEl = document.getElementById('scene-icon-badge');

    if (titleEl) titleEl.textContent = 'Escena 2 — El Índice es Contar Pasos desde el Inicio';
    if (descEl) descEl.textContent = 'El índice [i] representa cuántos pasos o saltos de tamaño (sizeof) da el procesador partiendo de la dirección base.';
    if (badgeEl) badgeEl.innerHTML = '<i class="fa-solid fa-shoe-prints text-emerald-400 text-lg"></i>';

    const bytesPerElem = s1GetTypeBytes(s2Type);
    const targetAddr = 0x2000 + (s2Index * bytesPerElem);

    let html = `
        <div class="w-full max-w-4xl flex flex-col items-center gap-5 py-2">
            
            <!-- Resumen Conceptual -->
            <div class="w-full bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center gap-3 text-center sm:text-left justify-center">
                <span class="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-sm">💡</span>
                <p class="text-xs sm:text-sm font-semibold text-slate-200">
                    "¿Por qué los arreglos empiezan en 0? Porque el índice <span class="text-emerald-400 font-mono font-bold">[i]</span> significa <span class="text-emerald-300 font-bold">'dar i saltos de distancia'</span>."
                </p>
            </div>

            <!-- Panel Seleccionador de Índice e Interactividad -->
            <div class="flex flex-wrap items-center justify-between gap-3 w-full bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-mono text-slate-400">Tipo:</span>
                    <div class="flex bg-slate-900 p-1 rounded-xl border border-slate-800 gap-1">
                        <button onclick="setS2Type('char')" class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${s2Type === 'char' ? 'bg-emerald-600 text-white' : 'text-slate-400'}">
                            char (1B)
                        </button>
                        <button onclick="setS2Type('int')" class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${s2Type === 'int' ? 'bg-emerald-600 text-white' : 'text-slate-400'}">
                            int (4B)
                        </button>
                        <button onclick="setS2Type('double')" class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${s2Type === 'double' ? 'bg-emerald-600 text-white' : 'text-slate-400'}">
                            double (8B)
                        </button>
                    </div>
                </div>

                <div class="flex items-center gap-1">
                    <span class="text-xs font-mono text-slate-400 mr-1">Seleccionar Índice [i]:</span>
                    ${[0, 1, 2, 3].map(idx => `
                        <button onclick="setS2Index(${idx})" class="w-8 h-8 rounded-xl font-mono font-extrabold text-xs transition-all ${s2Index === idx ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-110' : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'}">
                            ${idx}
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- Calculadora Fórmula Visual de Aritmética de Punteros -->
            <div class="w-full bg-slate-950 p-5 rounded-3xl border-2 border-emerald-500/30 shadow-2xl flex flex-col items-center gap-4">
                
                <div class="w-full bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono">
                    <div class="flex items-center gap-2 text-slate-300">
                        <span class="text-emerald-400 font-bold">Fórmula de Acceso Directo O(1):</span>
                    </div>
                    
                    <div class="flex items-center gap-1.5 flex-wrap justify-center text-slate-200 text-[11px] sm:text-xs">
                        <span class="bg-slate-950 px-2 py-1 rounded border border-slate-700 text-amber-300">0x2000 (Base)</span>
                        <span>+</span>
                        <span class="bg-emerald-950 px-2 py-1 rounded border border-emerald-500/40 text-emerald-300 font-bold">(${s2Index} saltos)</span>
                        <span>×</span>
                        <span class="bg-slate-950 px-2 py-1 rounded border border-slate-700 text-blue-300">${bytesPerElem} Bytes</span>
                        <span>=</span>
                        <span class="bg-emerald-500 text-slate-950 font-black px-2.5 py-1 rounded-lg">0x${targetAddr.toString(16).toUpperCase()}</span>
                    </div>
                </div>

                <!-- Representación de Saltos en Memoria -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full py-2">
                    ${[0, 1, 2, 3].map(i => {
                        const isTarget = (i === s2Index);
                        const addr = 0x2000 + (i * bytesPerElem);
                        return `
                            <div class="flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${isTarget ? 'bg-emerald-950/80 border-emerald-400 scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-slate-900/50 border-slate-800 opacity-60'}">
                                <span class="font-mono text-xs font-bold ${isTarget ? 'text-emerald-300' : 'text-slate-400'}">arr[${i}]</span>
                                <span class="text-[10px] font-mono text-slate-500 my-1">0x${addr.toString(16).toUpperCase()}</span>
                                <div class="w-full h-10 rounded-xl bg-slate-950 flex items-center justify-center font-bold text-xs text-slate-200">
                                    Val: ${arrayValues[i]}
                                </div>
                                <span class="text-[9px] font-mono mt-1.5 ${isTarget ? 'text-emerald-400 font-bold' : 'text-slate-500'}">
                                    ${i === 0 ? '0 Saltos (Inicio)' : `${i} salto${i > 1 ? 's' : ''}`}
                                </span>
                            </div>
                        `;
                    }).join('')}
                </div>

            </div>

        </div>
    `;
    container.innerHTML = html;
}

function setS2Index(idx) {
    s2Index = idx;
    playTone(400 + idx * 70, 'sine', 0.08, 0.04);
    const viewport = document.getElementById('scene-viewport');
    if (viewport) renderScene2(viewport);
}

function setS2Type(type) {
    s2Type = type;
    playTone(500, 'sine', 0.06, 0.03);
    const viewport = document.getElementById('scene-viewport');
    if (viewport) renderScene2(viewport);
}

// ==========================================
// CICLO DE VIDA DE LA LECCIÓN (Enrutador)
// ==========================================

export function init() {
    // Exponer handlers al ámbito global para los onclick del HTML
    window.loadScene = loadScene;
    window.nextScene = nextScene;
    window.prevScene = prevScene;
    window.toggleSound = toggleSound;
    window.setS1Type = setS1Type;
    window.triggerS1AddError = triggerS1AddError;
    window.closeS1ErrorModal = closeS1ErrorModal;
    window.setS2Type = setS2Type;
    window.setS2Index = setS2Index;

    // Arrancar la primera escena
    loadScene(1);
}

export function destroy() {
    // Limpiar handlers
    delete window.loadScene;
    delete window.nextScene;
    delete window.prevScene;
    delete window.toggleSound;
    delete window.setS1Type;
    delete window.triggerS1AddError;
    delete window.closeS1ErrorModal;
    delete window.setS2Type;
    delete window.setS2Index;
    
    // Suspender audio si estaba corriendo
    if (audioCtx && audioCtx.state === 'running') {
        audioCtx.suspend();
    }
}