/* ================================================================= /
/ LÓGICA E INTERACTIVIDAD: STACK VS HEAP                            /
/ ================================================================= */

// Estado Global del Módulo
let currentScene = 1;
let soundEnabled = true;

// Sintetizador Web Audio API para Efectos de Sonido
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
        // Fallback de audio
    }
}

function playErrorSound() {
    if (!soundEnabled) return;
    playTone(180, 'sawtooth', 0.15, 0.08);
    setTimeout(() => playTone(120, 'sawtooth', 0.25, 0.08), 90);
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
        icon.className = 'fa-solid fa-volume-high text-blue-400';
        btn.classList.remove('opacity-50');
        playTone(440, 'sine', 0.1, 0.04);
    } else {
        icon.className = 'fa-solid fa-volume-xmark text-slate-500';
        btn.classList.add('opacity-50');
    }
}

// Navegación e interfaz de la barra superior
function updateNavUI() {
    document.querySelectorAll('.nav-btn').forEach((btn, idx) => {
        const stepNum = idx + 1;
        if (stepNum === currentScene) {
            btn.className = "nav-btn px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-2 text-blue-400 bg-blue-950/60 border border-blue-500/40 shadow-lg shadow-blue-500/10";
            btn.querySelector('span').className = "w-5 h-5 rounded-full bg-blue-500 text-slate-950 flex items-center justify-center text-xs font-mono font-bold";
        } else {
            btn.className = "nav-btn px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900";
            btn.querySelector('span').className = "w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-xs font-mono font-bold";
        }
    });

    const prevBtn = document.getElementById('prev-scene-btn');
    if (prevBtn) prevBtn.disabled = (currentScene === 1);

    const nextBtn = document.getElementById('next-scene-btn');
    if (nextBtn) {
        if (currentScene === 3) {
            nextBtn.innerHTML = 'Reiniciar <i class="fa-solid fa-rotate-right text-xs"></i>';
        } else {
            nextBtn.innerHTML = 'Siguiente <i class="fa-solid fa-arrow-right text-xs"></i>';
        }
    }


}

function loadScene(sceneNumber) {
    currentScene = sceneNumber;
    updateNavUI();
    playTone(320 + sceneNumber * 60, 'sine', 0.06, 0.03);

    const viewport = document.getElementById('scene-viewport');
    if (!viewport) return;

    viewport.className = "relative bg-slate-900/60 border border-slate-800 rounded-3xl p-4 md:p-8 min-h-[460px] w-full flex flex-col justify-center items-center shadow-2xl overflow-hidden backdrop-blur-xl scene-enter";

    switch (sceneNumber) {
        case 1:
            renderScene1(viewport);
            break;
        case 2:
            renderScene2(viewport);
            break;
        case 3:
            renderScene3(viewport);
            break;
    }


}

function nextScene() {
    if (currentScene < 3) {
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

/* ================================================================= /
/ ESCENA 1: EL STACK                                               /
/ ================================================================= */
let stackFramesList = [
    { id: 1, name: 'main()', ret: 'Retorno 0', vars: 'estado = activo' }
];

function renderScene1(container) {
    document.getElementById('scene-title').textContent = 'Escena 1 — El Stack: Memoria Automática y Rápida';
    document.getElementById('scene-description').textContent = 'Pila ordenada (LIFO). Cada tarea o función apila sus datos temporales. Cuando termina, se borra de forma automática e inmediata.';

    let html = `
        <div class="w-full max-w-4xl flex flex-col md:flex-row items-center justify-between gap-6 py-2">
            
            <!-- Control Panel -->
            <div class="w-full md:w-1/2 flex flex-col gap-4">
                <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3 shadow-xl">
                    <span class="text-[10px] font-mono text-blue-400 font-bold tracking-widest uppercase flex items-center gap-2">
                        <i class="fa-solid fa-sliders"></i> Flujo del Programa
                    </span>

                    <div class="grid grid-cols-2 gap-2">
                        <button onclick="pushStackFrame()" class="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all hover:scale-105">
                            <i class="fa-solid fa-arrow-down font-mono"></i> Crear Tarea (Push)
                        </button>
                        <button onclick="popStackFrame()" class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all hover:scale-105 border border-slate-700">
                            <i class="fa-solid fa-arrow-up font-mono"></i> Finalizar Tarea (Pop)
                        </button>
                    </div>

                    <button onclick="triggerStackOverflow()" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all">
                        <i class="fa-solid fa-bolt"></i> Llenar la Pila sin Parar ⚡
                    </button>
                </div>

                <!-- LIFO Info -->
                <div class="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div class="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                        <span class="text-blue-400 font-bold block mb-1">Orden LIFO</span>
                        <span class="text-slate-400 text-[11px]">El último en entrar es el primero en salir.</span>
                    </div>
                    <div class="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                        <span class="text-emerald-400 font-bold block mb-1">Limpieza Automática</span>
                        <span class="text-slate-400 text-[11px]">Se borra solo al terminar la función.</span>
                    </div>
                </div>

                <div class="bg-blue-950/30 p-3 rounded-xl border border-blue-500/20 text-[11px] text-blue-200 flex items-center gap-2.5">
                    <i class="fa-solid fa-circle-info text-blue-400 shrink-0"></i>
                    <span><b>Idea clave:</b> Imagina platos apilados. Solo puedes poner o quitar el plato de arriba.</span>
                </div>
            </div>

            <!-- Visualization Box -->
            <div class="w-full md:w-1/2 flex flex-col items-center">
                <div class="w-full max-w-sm bg-slate-950 p-4 rounded-3xl border-2 border-blue-500/30 shadow-2xl flex flex-col gap-2 relative min-h-[360px] overflow-hidden">
                    
                    <div class="flex justify-between items-center text-[10px] font-mono text-slate-500 border-b border-slate-800 pb-2">
                        <span>Límite Superior (Entrada)</span>
                        <span class="text-blue-400 font-bold flex items-center gap-1">
                            <i class="fa-solid fa-arrow-down-long"></i> Se Apila ⬇
                        </span>
                    </div>

                    <div id="stack-container" class="flex flex-col gap-2 flex-1 justify-start py-2">
                        <!-- Renderizado Dinámico -->
                    </div>

                    <div class="border-t-2 border-dashed border-red-500/40 pt-1 flex justify-between items-center text-[10px] font-mono text-red-400/80">
                        <span>LÍMITE MÁXIMO DE CAPACIDAD</span>
                    </div>

                    <!-- Overflow Modal -->
                    <div id="s1-overflow-modal" class="hidden absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-shake z-30">
                        <div class="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center text-2xl mb-3">
                            <i class="fa-solid fa-skull"></i>
                        </div>
                        <h4 class="font-extrabold text-red-400 text-base">¡STACK OVERFLOW!</h4>
                        <span class="text-[10px] font-mono text-slate-400 bg-red-950/60 border border-red-500/30 px-2 py-0.5 rounded mt-1">
                            Memoria Stack Colapsada
                        </span>
                        <p class="text-xs text-slate-300 mt-3 leading-relaxed">
                            Intentaste apilar demasiadas tareas sin terminar ninguna. La memoria del Stack se llenó por completo.
                        </p>
                        <button onclick="resetStack()" class="mt-4 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-500/30">
                            <i class="fa-solid fa-rotate-left"></i> Vaciar Pila y Reiniciar
                        </button>
                    </div>

                </div>
            </div>

        </div>
    `;
    container.innerHTML = html;
    updateStackUI();
}

function updateStackUI() {
    const container = document.getElementById('stack-container');
    if (!container) return;

    if (stackFramesList.length === 0) {
        container.innerHTML = `
            <div class="flex-1 flex flex-col items-center justify-center text-slate-600 font-mono text-xs gap-1 py-12">
                <i class="fa-solid fa-box-open text-2xl opacity-40"></i>
                <span>Pila Vacía</span>
            </div>
        `;
        return;
    }

    container.innerHTML = stackFramesList.map((frame, idx) => {
        const isTop = (idx === stackFramesList.length - 1);

        return `
            <div class="stack-frame p-3 rounded-2xl ${isTop ? 'bg-blue-950/80 border-2 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-slate-900 border border-slate-800 opacity-70'} flex flex-col gap-1.5 font-mono text-xs relative">
                <div class="flex justify-between items-center">
                    <span class="font-bold ${isTop ? 'text-blue-300' : 'text-slate-300'} flex items-center gap-1.5">
                        <i class="fa-solid fa-box-archive text-[10px]"></i> Bloque: ${frame.name}
                    </span>
                </div>

                <div class="grid grid-cols-2 gap-2 text-[10px] mt-0.5">
                    <div class="bg-slate-950/80 px-2 py-1 rounded border border-slate-800 text-slate-300 truncate">
                        <span class="text-slate-500">Datos:</span> ${frame.vars}
                    </div>
                    <div class="bg-purple-950/50 px-2 py-1 rounded border border-purple-500/30 text-purple-300 flex items-center gap-1 truncate">
                        <i class="fa-solid fa-arrow-turn-down text-[9px]"></i>
                        <span>${frame.ret}</span>
                    </div>
                </div>

                ${isTop ? '<div class="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-blue-400 rounded-full"></div>' : ''}
            </div>
        `;
    }).reverse().join('');
}

function pushStackFrame() {
    if (stackFramesList.length >= 6) {
        const modal = document.getElementById('s1-overflow-modal');
        if (modal) modal.classList.remove('hidden');
        playErrorSound();
        return;
    }

    const funcNames = ['CalcularTotal()', 'ProcesarPago()', 'ObtenerUsuario()', 'ValidarClave()', 'MostrarPantalla()'];
    const nextIdx = stackFramesList.length;
    const chosenName = funcNames[(nextIdx - 1) % funcNames.length];

    stackFramesList.push({
        id: Date.now(),
        name: chosenName,
        ret: 'Al terminar ➔ Volver',
        vars: `temp = ${Math.floor(Math.random() * 90 + 10)}`
    });

    playTone(400 + nextIdx * 80, 'sine', 0.08, 0.04);
    updateStackUI();
}

function popStackFrame() {
    if (stackFramesList.length <= 1) {
        playTone(200, 'sawtooth', 0.08, 0.03);
        return;
    }
    stackFramesList.pop();
    playTone(320, 'sine', 0.08, 0.04);
    updateStackUI();
}

function triggerStackOverflow() {
    stackFramesList = [
        { id: 1, name: 'InicioMain()', ret: 'Retorno 0', vars: 'activo = verdadero' }
    ];
    
    let count = 0;
    const timer = setInterval(() => {
        count++;
        stackFramesList.push({
            id: Date.now() + count,
            name: `TareaInfinita(${count})`,
            ret: 'Pendiente...',
            vars: `nivel = ${count}`
        });
        updateStackUI();
        playTone(300 + count * 90, 'triangle', 0.04, 0.03);

        if (count >= 5) {
            clearInterval(timer);
            setTimeout(() => {
                const modal = document.getElementById('s1-overflow-modal');
                if (modal) modal.classList.remove('hidden');
                playErrorSound();
            }, 150);
        }
    }, 120);
}

function resetStack() {
    stackFramesList = [
        { id: 1, name: 'InicioMain()', ret: 'Retorno 0', vars: 'estado = activo' }
    ];
    const modal = document.getElementById('s1-overflow-modal');
    if (modal) modal.classList.add('hidden');
    playSuccessSound();
    updateStackUI();
}

/* ================================================================= /
/ ESCENA 2: EL HEAP                                                /
/ ================================================================= */

let scene2State = { allocated: false, written: false, freed: false };

function renderScene2(container) {
    document.getElementById('scene-title').textContent = 'Escena 2 — El Heap: El Almacén de Memoria Dinámica';
    document.getElementById('scene-description').textContent = 'A diferencia del Stack (que borra todo automáticamente), el Heap es un gran almacén donde tú pides un espacio libre, lo usas el tiempo que quieras y debes liberarlo cuando termines.';

    let html = `
        <div class="w-full max-w-4xl flex flex-col items-center gap-6 py-2">
            
            <!-- Pasos Guiados sin Código Técnico -->
            <div class="flex items-center gap-2 sm:gap-3 bg-slate-950 p-2.5 rounded-2xl border border-slate-800 flex-wrap justify-center">
                <button onclick="s2StepAlloc()" id="s2-btn-1" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20">
                    <i class="fa-solid fa-box-archive"></i>
                    <span>1. Alquilar Espacio en el Almacén</span>
                </button>
                <button onclick="s2StepWrite()" id="s2-btn-2" disabled class="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-40">
                    <i class="fa-solid fa-pen-to-square"></i>
                    <span>2. Guardar Datos</span>
                </button>
                <button onclick="s2StepFree()" id="s2-btn-3" disabled class="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-40">
                    <i class="fa-solid fa-trash-can"></i>
                    <span>3. Devolver Espacio</span>
                </button>
                <button onclick="s2Reset()" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5" title="Reiniciar Escena">
                    <i class="fa-solid fa-rotate-left"></i>
                </button>
            </div>

            <!-- Comparativa Visual: La Tarjeta de Acceso vs El Espacio Reservado -->
            <div class="w-full grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                
                <!-- STACK: La Tarjeta de Referencia -->
                <div class="bg-slate-950 p-6 rounded-3xl border-2 border-blue-500/40 flex flex-col items-center gap-4 relative shadow-2xl">
                    <div class="absolute top-3 left-4 text-[10px] font-mono text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <i class="fa-solid fa-id-card text-xs"></i> STACK (Tu Pila Rapida)
                    </div>

                    <div class="mt-6 w-full bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
                        <div class="flex items-center justify-between text-xs">
                            <span class="text-slate-300 font-bold">Tarjeta de Acceso</span>
                            <span class="text-xs bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 font-mono">En tu bolsillo</span>
                        </div>

                        <div id="s2-stack-key" class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between transition-all">
                            <div class="flex items-center gap-3">
                                <div class="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-base">
                                    <i class="fa-solid fa-key"></i>
                                </div>
                                <div>
                                    <span class="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Número de Casillero:</span>
                                    <span id="s2-ptr-val" class="font-bold text-slate-400 text-sm">Sin asignar (Vacío)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p class="text-[11px] text-slate-400 text-center leading-relaxed">
                        El <b>Stack</b> guarda una referencia ligera (la "tarjeta" o número de casillero). Ocupa muy poco espacio.
                    </p>
                </div>

                <!-- HEAP: El Almacén Dinámico -->
                <div class="bg-slate-950 p-6 rounded-3xl border-2 border-emerald-500/40 flex flex-col items-center gap-4 relative shadow-2xl">
                    <div class="absolute top-3 left-4 text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <i class="fa-solid fa-warehouse text-xs"></i> HEAP (Gran Almacén Dinámico)
                    </div>

                    <div class="mt-6 w-full bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3 min-h-[140px] justify-center items-center relative">
                        
                        <div id="s2-heap-empty" class="text-center font-mono text-xs text-slate-500 flex flex-col items-center gap-2 py-3">
                            <i class="fa-solid fa-boxes-packing text-3xl opacity-30"></i>
                            <span>No has alquilado ningún casillero en el Heap</span>
                        </div>

                        <div id="s2-heap-house" class="hidden w-full p-4 rounded-2xl bg-emerald-950/70 border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-between transition-all">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 flex items-center justify-center text-lg">
                                    <i class="fa-solid fa-box text-xl"></i>
                                </div>
                                <div>
                                    <span class="text-[10px] text-emerald-300 font-bold block uppercase">CASILLERO #108 RESERVADO</span>
                                    <span class="text-xs text-slate-300">Capacidad para datos grandes</span>
                                </div>
                            </div>
                            <div class="text-right">
                                <span class="text-[10px] text-slate-400 block font-bold">CONTENIDO:</span>
                                <span id="s2-house-val" class="text-sm font-extrabold text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-500/30 block mt-0.5">Vacío</span>
                            </div>
                        </div>

                    </div>

                    <p class="text-[11px] text-slate-400 text-center leading-relaxed">
                        El <b>Heap</b> es donde realmente viven los datos pesados (imágenes, listas grandes, archivos). Sobrevive a todo hasta que decidas entregarlo.
                    </p>
                </div>

            </div>

            <!-- Panel Informativo Explicativo -->
            <div id="s2-banner" class="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-center text-slate-300 leading-relaxed shadow-lg">
                💡 Haz clic en <b>"1. Alquilar Espacio"</b> para pedirle al sistema un bloque de memoria flexible en el Heap.
            </div>

        </div>
    `;
    container.innerHTML = html;
}

function s2StepAlloc() {
    scene2State.allocated = true;
    document.getElementById('s2-heap-empty').classList.add('hidden');
    
    const house = document.getElementById('s2-heap-house');
    house.classList.remove('hidden');
    house.classList.add('scene-enter');

    document.getElementById('s2-ptr-val').textContent = 'Casillero #108';
    document.getElementById('s2-ptr-val').className = 'font-extrabold text-amber-400 text-sm';

    document.getElementById('s2-btn-1').disabled = true;
    document.getElementById('s2-btn-1').className = 'px-3.5 py-2 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs opacity-50';

    const btn2 = document.getElementById('s2-btn-2');
    btn2.disabled = false;
    btn2.className = 'px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105 flex items-center gap-2';

    document.getElementById('s2-banner').innerHTML = '✅ <b>¡Espacio Reservado!</b> El sistema te asignó el <b class="text-emerald-400">Casillero #108</b> en el Heap y guardó la tarjeta de acceso en tu Stack.';

    playSuccessSound();
}

function s2StepWrite() {
    scene2State.written = true;
    document.getElementById('s2-house-val').textContent = '"Perfil de Usuario"';
    document.getElementById('s2-house-val').className = 'text-xs font-black text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-400 animate-pulse block mt-0.5';

    document.getElementById('s2-btn-2').disabled = true;
    document.getElementById('s2-btn-2').className = 'px-3.5 py-2 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs opacity-50';

    const btn3 = document.getElementById('s2-btn-3');
    btn3.disabled = false;
    btn3.className = 'px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-500/20 transition-all hover:scale-105 flex items-center gap-2';

    document.getElementById('s2-banner').innerHTML = '✍️ <b>Datos Guardados:</b> Se guardó la información dentro del espacio reservado en el Heap usando el número de casillero que tenías guardado.';

    playTone(600, 'sine', 0.1, 0.05);
}

function s2StepFree() {
    scene2State.freed = true;
    
    const house = document.getElementById('s2-heap-house');
    house.classList.add('opacity-40', 'scale-95');
    document.getElementById('s2-house-val').textContent = 'LIBERADO';
    document.getElementById('s2-house-val').className = 'text-xs text-red-400 font-bold block mt-0.5';

    document.getElementById('s2-ptr-val').textContent = 'Vacío / Sin Acceso';
    document.getElementById('s2-ptr-val').className = 'font-bold text-slate-500 text-xs';

    document.getElementById('s2-btn-3').disabled = true;
    document.getElementById('s2-btn-3').className = 'px-3.5 py-2 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs opacity-50';

    document.getElementById('s2-banner').innerHTML = '🧹 <b>¡Espacio Liberado!</b> Devolviste el casillero al almacén. Ahora otros programas pueden rebarajar y usar ese espacio en la memoria RAM.';

    playTone(250, 'sawtooth', 0.12, 0.04);
}

function s2Reset() {
    scene2State = { allocated: false, written: false, freed: false };
    loadScene(2);
}

/* ================================================================= /
/ ESCENA 3: ERRORES CRÍTICOS                                       /
/ ================================================================= */
function renderScene3(container) {
    document.getElementById('scene-title').textContent = 'Escena 3 — Los 3 Problemas Más Comunes con la Memoria';
    document.getElementById('scene-description').textContent = 'Descubre qué pasa cuando algo sale mal al usar el Stack o el Heap. Haz clic en cada botón para ver la simulación.';

    let html = `
    <div class="w-full max-w-4xl flex flex-col items-center gap-6 py-2">
        
        <div class="w-full bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 p-3.5 rounded-2xl border border-amber-500/30 flex items-center justify-between text-xs font-mono shadow-lg">
            <div class="flex items-center gap-2.5">
                <i class="fa-solid fa-crown text-amber-400 text-base"></i>
                <span><b>Regla de Oro:</b> "Si pediste espacio en el Heap, tú debes devolverlo. El Stack se limpia solo."</span>
            </div>
        </div>

        <div class="grid grid-cols-3 gap-2 w-full font-mono text-xs">
            <button onclick="selectBugTab(1)" id="bug-tab-1" class="p-3 rounded-2xl bg-red-950/60 border-2 border-red-500 text-red-300 font-bold flex flex-col items-center gap-1 shadow-lg">
                <i class="fa-solid fa-burst text-sm"></i>
                <span>1. Pila Desbordada</span>
            </button>
            <button onclick="selectBugTab(2)" id="bug-tab-2" class="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 flex flex-col items-center gap-1">
                <i class="fa-solid fa-droplet-slash text-sm"></i>
                <span>2. Memoria que se Pierde</span>
            </button>
            <button onclick="selectBugTab(3)" id="bug-tab-3" class="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 flex flex-col items-center gap-1">
                <i class="fa-solid fa-link-slash text-sm"></i>
                <span>3. Usar algo que ya Tiraste</span>
            </button>
        </div>

        <div id="bug-viewport" class="w-full bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl min-h-[260px] flex flex-col items-center justify-center relative overflow-hidden">
            <!-- Renderizado dinámico -->
        </div>

    </div>
`;
    container.innerHTML = html;
    selectBugTab(1);


}

function selectBugTab(bugIndex) {
    for (let i = 1; i <= 3; i++) {
        const btn = document.getElementById(`bug-tab-${i}`);
        if (btn) {
            if (i === bugIndex) {
                btn.className = "p-3 rounded-2xl bg-slate-900 border-2 border-cyan-400 text-cyan-300 font-bold flex flex-col items-center gap-1 shadow-lg shadow-cyan-500/10";
            } else {
                btn.className = "p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300 flex flex-col items-center gap-1";
            }
        }
    }

    const viewport = document.getElementById('bug-viewport');
    if (!viewport) return;

    playTone(350 + bugIndex * 80, 'sine', 0.05, 0.03);

    if (bugIndex === 1) {
        viewport.innerHTML = `
        <div class="w-full flex flex-col items-center gap-4 text-center">
            <div class="flex items-center gap-3 text-red-400 font-mono text-xs font-bold bg-red-950/40 px-3 py-1 rounded-full border border-red-500/30">
                <i class="fa-solid fa-skull"></i> El programa se detiene al instante
            </div>

            <div class="w-full max-w-md bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col gap-2 font-mono text-xs">
                <div class="flex justify-between text-slate-400 text-[11px]">
                    <span>Causa: Una función se llama a sí misma sin parar nunca</span>
                    <span class="text-red-400 font-bold">Se nota: De inmediato</span>
                </div>
                <div class="bg-slate-950 p-3 rounded-xl border border-red-500/40 text-left text-red-300 text-[11px]">
                    Imagina apilar platos uno sobre otro sin parar jamás. Como el mueble donde los guardas tiene un límite de altura, en algún momento ya no cabe ni un plato más y todo se cae.
                </div>
            </div>

            <button onclick="triggerStackOverflowDemo()" class="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-500/20">
                <i class="fa-solid fa-play"></i> Simular que la Pila se Desborda
            </button>

            <div id="bug1-status" class="hidden w-full p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-mono animate-shake">
                💥 <b>EL PROGRAMA SE CIERRA SOLO:</b> Intentó guardar más "platos" de los que caben en el espacio que tenía asignado, así que el sistema operativo lo detiene para evitar daños mayores.
            </div>
        </div>
    `;
    } else if (bugIndex === 2) {
        viewport.innerHTML = `
        <div class="w-full flex flex-col items-center gap-4 text-center">
            <div class="flex items-center gap-3 text-amber-400 font-mono text-xs font-bold bg-amber-950/40 px-3 py-1 rounded-full border border-amber-500/30">
                <i class="fa-solid fa-droplet-slash"></i> El programa se come la memoria poco a poco
            </div>

            <div class="w-full max-w-md bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col gap-2 font-mono text-xs">
                <div class="flex justify-between text-slate-400 text-[11px]">
                    <span>Causa: Pides espacio prestado y olvidas devolverlo</span>
                    <span class="text-amber-400 font-bold">Se nota: Poco a poco, con el tiempo</span>
                </div>
                <div id="leak-blocks-container" class="grid grid-cols-6 gap-1.5 bg-slate-950 p-2 rounded-xl border border-slate-800 min-h-[48px] items-center">
                    <span class="text-[10px] text-slate-600 col-span-6">Espacio pedido que nadie ha devuelto...</span>
                </div>
            </div>

            <button onclick="triggerMemoryLeakDemo()" class="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20">
                <i class="fa-solid fa-plus"></i> Pedir espacio varias veces sin devolverlo
            </button>

            <div id="bug2-status" class="hidden w-full p-3 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs font-mono">
                🐌 <b>SE ACABA EL ESPACIO:</b> Es como pedir prestadas cajas de una bodega y nunca devolverlas. Nadie avisa de inmediato, pero la bodega se va llenando hasta que ya no queda espacio para nada más.
            </div>
        </div>
    `;
    } else {
        viewport.innerHTML = `
        <div class="w-full flex flex-col items-center gap-4 text-center">
            <div class="flex items-center gap-3 text-purple-400 font-mono text-xs font-bold bg-purple-950/40 px-3 py-1 rounded-full border border-purple-500/30">
                <i class="fa-solid fa-link-slash"></i> Usar algo que ya tiraste a la basura
            </div>

            <div class="w-full max-w-md bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3 font-mono text-xs">
                <div class="flex justify-between text-slate-400 text-[11px]">
                    <span>Causa: Devolviste el espacio, pero sigues usando la nota con su dirección</span>
                    <span class="text-purple-400 font-bold">Se nota: A veces sí, a veces no (impredecible)</span>
                </div>

                <div class="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div class="text-left">
                        <span class="text-[10px] text-slate-500 block">TU NOTA CON LA DIRECCIÓN:</span>
                        <span id="uaf-ptr" class="text-amber-400 font-bold">"Casillero 2000"</span>
                    </div>
                    <div class="text-right">
                        <span class="text-[10px] text-slate-500 block">ESE ESPACIO AHORA ESTÁ:</span>
                        <span id="uaf-heap-state" class="text-red-400 font-bold">YA DEVUELTO</span>
                    </div>
                </div>
            </div>

            <button onclick="triggerUseAfterFreeDemo()" class="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20">
                <i class="fa-solid fa-hand-pointer"></i> Intentar usar ese casillero otra vez
            </button>

            <div id="bug3-status" class="hidden w-full p-3 rounded-xl bg-purple-950/80 border border-purple-500/50 text-purple-200 text-xs font-mono animate-shake">
                ⚠️ <b>PELIGRO — ESE ESPACIO YA NO ES TUYO:</b> Es como guardar la nota de un casillero de gimnasio, devolver el casillero, y luego usar esa misma nota para abrirlo de nuevo: puede que esté vacío, o puede que ya tenga las cosas de otra persona. No hay forma de saberlo con certeza, y por eso este error es tan peligroso.
            </div>
        </div>
    `;
    }


}

function triggerStackOverflowDemo() {
    const status = document.getElementById('bug1-status');
    if (status) status.classList.remove('hidden');
    playErrorSound();
}

let leakCount = 0;
function triggerMemoryLeakDemo() {
    const container = document.getElementById('leak-blocks-container');
    leakCount++;

    if (leakCount === 1) container.innerHTML = '';

    if (leakCount <= 6) {
        const block = document.createElement('div');
        block.className = 'h-8 rounded-lg bg-amber-500/30 border border-amber-400 text-amber-300 font-mono text-[9px] flex items-center justify-center animate-bounce';
        block.textContent = `Caja ${leakCount}`;
        container.appendChild(block);
        playTone(250 + leakCount * 60, 'sawtooth', 0.05, 0.03);
    }

    if (leakCount >= 6) {
        const status = document.getElementById('bug2-status');
        if (status) status.classList.remove('hidden');
        playErrorSound();
    }


}

function triggerUseAfterFreeDemo() {
    const status = document.getElementById('bug3-status');
    if (status) status.classList.remove('hidden');
    playErrorSound();
}


// ==========================================
// CICLO DE VIDA DE LA LECCIÓN (Enrutador)
// ==========================================

export function init() {
    // Exponer handlers al ámbito global
    window.loadScene = loadScene;
    window.nextScene = nextScene;
    window.prevScene = prevScene;
    window.toggleSound = toggleSound;
    window.pushStackFrame = pushStackFrame;
    window.popStackFrame = popStackFrame;
    window.triggerStackOverflow = triggerStackOverflow;
    window.resetStack = resetStack;
    window.s2StepAlloc = s2StepAlloc;
    window.s2StepWrite = s2StepWrite;
    window.s2StepFree = s2StepFree;
    window.s2Reset = s2Reset;
    window.selectBugTab = selectBugTab;
    window.triggerStackOverflowDemo = triggerStackOverflowDemo;
    window.triggerMemoryLeakDemo = triggerMemoryLeakDemo;
    window.triggerUseAfterFreeDemo = triggerUseAfterFreeDemo;

    // Arrancar
    loadScene(1);
}

export function destroy() {
    // Limpiar handlers y bindings
    delete window.loadScene;
    delete window.nextScene;
    delete window.prevScene;
    delete window.toggleSound;
    delete window.pushStackFrame;
    delete window.popStackFrame;
    delete window.triggerStackOverflow;
    delete window.resetStack;
    delete window.s2StepAlloc;
    delete window.s2StepWrite;
    delete window.s2StepFree;
    delete window.s2Reset;
    delete window.selectBugTab;
    delete window.triggerStackOverflowDemo;
    delete window.triggerMemoryLeakDemo;
    delete window.triggerUseAfterFreeDemo;
    
    // Suspender audio si estaba corriendo
    if (audioCtx && audioCtx.state === 'running') {
        audioCtx.suspend();
    }
}