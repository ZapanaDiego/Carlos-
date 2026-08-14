// Global App State
let currentScene = 1;
let soundEnabled = true;

// Web Audio API Synthesizer for UI Effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type = "sine", duration = 0.08, gainVal = 0.05) {
  if (!soundEnabled) return;
  try {
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioCtx.currentTime + duration,
    );
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Audio mute fallback
  }
}

function playErrorSound() {
  if (!soundEnabled) return;
  playTone(150, "sawtooth", 0.15, 0.1);
  setTimeout(() => playTone(110, "sawtooth", 0.2, 0.1), 80);
}

function playSuccessSound() {
  if (!soundEnabled) return;
  playTone(523.25, "sine", 0.1, 0.05); // C5
  setTimeout(() => playTone(659.25, "sine", 0.1, 0.05), 80); // E5
  setTimeout(() => playTone(783.99, "sine", 0.15, 0.05), 160); // G5
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const icon = document.getElementById("sound-icon");
  const btn = document.getElementById("sound-btn");
  if (soundEnabled) {
    icon.className = "fa-solid fa-volume-high text-cyan-400";
    btn.classList.remove("opacity-50");
    playTone(440, "sine", 0.1, 0.05);
  } else {
    icon.className = "fa-solid fa-volume-xmark text-slate-500";
    btn.classList.add("opacity-50");
  }
}

// Navigation Controllers
function updateNavUI() {
  document.querySelectorAll(".nav-btn").forEach((btn, idx) => {
    const stepNum = idx + 1;
    if (stepNum === currentScene) {
      btn.className =
        "nav-btn px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-2 text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 shadow-lg shadow-cyan-500/10";
      btn.querySelector("span").className =
        "w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-xs font-mono font-bold";
    } else {
      btn.className =
        "nav-btn px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900";
      btn.querySelector("span").className =
        "w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-xs font-mono font-bold";
    }
  });

  document.getElementById("prev-scene-btn").disabled = currentScene === 1;

  const nextBtn = document.getElementById("next-scene-btn");
  if (currentScene === 5) {
    nextBtn.innerHTML =
      'Reiniciar <i class="fa-solid fa-rotate-right text-xs"></i>';
  } else {
    nextBtn.innerHTML =
      'Siguiente <i class="fa-solid fa-arrow-right text-xs"></i>';
  }
}

function loadScene(sceneNumber) {
  currentScene = sceneNumber;
  updateNavUI();
  playTone(350 + sceneNumber * 50, "sine", 0.06, 0.04);

  const viewport = document.getElementById("scene-viewport");
  viewport.className =
    "relative bg-slate-900/60 border border-slate-800 rounded-3xl p-4 md:p-8 min-h-[460px] w-full flex flex-col justify-center items-center shadow-2xl overflow-hidden backdrop-blur-xl scene-enter";

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
    case 4:
      renderScene4(viewport);
      break;
    case 5:
      renderScene5(viewport);
      break;
  }
}

window.loadScene = loadScene;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => loadScene(1));
} else {
  loadScene(1);
}

function nextScene() {
  if (currentScene < 5) {
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

function renderScene1(container) {
  document.getElementById("scene-title").textContent =
    "Escena 1 — La Matriz de Memoria (Espacio Físico de Celdas)";
  document.getElementById("scene-description").textContent =
    "La memoria RAM es una matriz de celdas físicas estructurada en filas de direcciones y columnas de desplazamiento. Pasa el cursor por la matriz para interactuar con cada casilla.";

  const rows = 6;
  const cols = 8;
  const baseAddress = 0x1000;

  let html = `
                <div class="w-full flex flex-col items-center justify-center gap-5 py-2">
                    <div class="text-center max-w-lg">
                        <span class="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-mono tracking-widest uppercase">
                            Fotograma Cero — Organización Matricial
                        </span>
                        <h2 class="text-xl font-bold text-white mt-2">Matriz Bidimensional de Celdas de Memoria</h2>
                        <p class="text-xs text-slate-400 mt-1">Cada casilla representa 1 Byte en la dirección <code class="text-cyan-300">Base + Columna</code>. Pasa el cursor sobre la matriz para inspeccionar las coordenadas de memoria.</p>
                    </div>

                    <!-- Matrix Inspection Readout -->
                    <div class="flex items-center gap-4 bg-slate-950/80 px-5 py-2 rounded-xl border border-cyan-500/30 font-mono text-xs text-slate-300 shadow-lg">
                        <span class="flex items-center gap-1.5"><i class="fa-solid fa-crosshairs text-cyan-400"></i> Celda Seleccionada:</span>
                        <span id="s1-cell-addr" class="text-cyan-300 font-bold text-sm">0x1000</span>
                        <span class="text-slate-600">|</span>
                        <span>Fila: <strong id="s1-cell-row" class="text-purple-300">0x1000</strong></span>
                        <span class="text-slate-600">|</span>
                        <span>Offset(desplazamiento): <strong id="s1-cell-col" class="text-amber-300">+0x00</strong></span>
                    </div>

                    <!-- 2D Memory Matrix Grid Container -->
                    <div class="w-full overflow-x-auto custom-scrollbar py-3 px-2">
                        <div class="min-w-[620px] max-w-3xl mx-auto bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-2xl flex flex-col gap-3">
                            
                            <!-- Matrix Header (Column Offsets) -->
                            <div class="grid grid-cols-9 gap-2 text-center font-mono text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-2">
                                <div class="text-slate-600 text-left pl-2">DIRECCIÓN</div>
                                ${Array.from({ length: cols })
                                  .map(
                                    (_, c) => `
                                    <div class="text-cyan-400/80 bg-cyan-950/30 py-1 rounded border border-cyan-500/20">+0x0${c}</div>
                                `,
                                  )
                                  .join("")}
                            </div>

                            <!-- Matrix Rows -->
                            ${Array.from({ length: rows })
                              .map((_, r) => {
                                const rowBase = baseAddress + r * cols;
                                const rowHex = rowBase
                                  .toString(16)
                                  .toUpperCase();

                                return `
                                    <div class="grid grid-cols-9 gap-2 items-center">
                                        <!-- Row Address Label -->
                                        <div class="font-mono text-xs font-extrabold text-purple-400 bg-purple-950/20 px-2 py-2 rounded border border-purple-500/20 text-left">
                                            0x${rowHex}
                                        </div>

                                        <!-- Row Byte Cells -->
                                        ${Array.from({ length: cols })
                                          .map((_, c) => {
                                            const cellAddr = rowBase + c;
                                            const cellHex = cellAddr
                                              .toString(16)
                                              .toUpperCase();
                                            const cellIndex = r * cols + c;

                                            return `
                                                <div class="matrix-cell cursor-pointer h-12 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-cyan-400 hover:bg-cyan-950/50 flex flex-col items-center justify-between p-1.5 font-mono group"
                                                     onmouseenter="inspectMatrixCell('0x${cellHex}', '0x${rowHex}', '+0x0${c}', ${cellIndex})"
                                                     onclick="inspectMatrixCell('0x${cellHex}', '0x${rowHex}', '+0x0${c}', ${cellIndex})">
                                                    <div class="w-full flex justify-between items-center text-[9px] text-slate-500 group-hover:text-cyan-300">
                                                        <span>#${cellIndex}</span>
                                                        <i class="fa-solid fa-microchip text-[8px] opacity-40 group-hover:opacity-100"></i>
                                                    </div>
                                                    <span class="text-xs font-bold text-slate-300 group-hover:text-white">0x00</span>
                                                </div>
                                            `;
                                          })
                                          .join("")}
                                    </div>
                                `;
                              })
                              .join("")}
                        </div>
                    </div>

                    <!-- Visual Footer Note -->
                    <div class="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800">
                        <i class="fa-solid fa-border-all text-cyan-400"></i>
                        <span>Organización Matricial: La arquitectura RAM direcciona física y lógicamente bloques de celdas de 8 bits.</span>
                    </div>
                </div>
            `;
  container.innerHTML = html;

  window.inspectMatrixCell = function (addrHex, rowHex, colHex, index) {
    document.getElementById("s1-cell-addr").textContent = addrHex;
    document.getElementById("s1-cell-row").textContent = rowHex;
    document.getElementById("s1-cell-col").textContent = colHex;
    playTone(300 + (index % 16) * 25, "sine", 0.04, 0.02);
  };
}

let scene2Timer = null;
function renderScene2(container) {
  if (scene2Timer) clearInterval(scene2Timer);

  document.getElementById("scene-title").textContent =
    "Escena 2 — Decimal Desbordado vs Hexadecimal Compacto";
  document.getElementById("scene-description").textContent =
    "¿Por qué no usamos decimales para direccionar memoria? Los números decimales crecen demasiado rápido y rompen los límites visuales. Hexadecimal mantiene las direcciones limpias y uniformes.";

  let html = `
                <div class="w-full max-w-4xl flex flex-col items-center justify-center gap-8 py-2">
                    
                    <!-- Controls Bar -->
                    <div class="flex flex-wrap items-center justify-between w-full bg-slate-950/80 p-3 rounded-2xl border border-slate-800 gap-4">
                        <div class="flex items-center gap-3">
                            <button id="s2-toggle-btn" onclick="toggleOdometer()" class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20">
                                <i class="fa-solid fa-play" id="s2-play-icon"></i> <span id="s2-btn-text">Iniciar Conteo de Memoria</span>
                            </button>
                            <button onclick="resetOdometer()" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold">
                                <i class="fa-solid fa-rotate-left"></i> Reiniciar
                            </button>
                        </div>
                        <div class="flex items-center gap-2 text-xs text-slate-400">
                            <span class="font-mono text-cyan-400">Direccionando Gigabytes de RAM...</span>
                        </div>
                    </div>

                    <!-- Counters Comparison Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        
                        <!-- LEFT: DECIMAL (CHAOS / OVERFLOW) -->
                        <div class="relative bg-slate-950 p-6 rounded-2xl border-2 border-red-500/40 flex flex-col items-center gap-4 overflow-hidden shadow-2xl group">
                            <div class="absolute top-3 right-3 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-mono font-bold uppercase">
                                Desorden / Caos
                            </div>
                            
                            <div class="text-left w-full">
                                <h3 class="text-sm font-bold text-red-400 flex items-center gap-2">
                                    <i class="fa-solid fa-triangle-exclamation"></i> Dirección Decimal (Base 10)
                                </h3>
                                <p class="text-[11px] text-slate-400 mt-1">Los dígitos crecen impredeciblemente y desbordan el contenedor fijado.</p>
                            </div>

                            <!-- Odometer Box -->
                            <div class="w-full py-6 px-4 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-center relative min-h-[110px]">
                                <div id="dec-container" class="font-mono text-2xl sm:text-3xl font-extrabold text-red-400 tracking-wider transition-all duration-100 flex items-center justify-center text-center break-all max-w-full">
                                    <span id="dec-odometer" class="px-2 py-1 bg-red-950/40 rounded border border-red-500/30">0</span>
                                </div>
                            </div>

                            <!-- Overflow Warning Badge (hidden until overflow) -->
                            <div id="dec-warning" class="w-full p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center justify-center gap-2 opacity-0 transition-opacity">
                                <i class="fa-solid fa-bomb text-red-400 animate-bounce"></i>
                                <span class="font-bold">¡DESBORDAMIENTO! El registro de 32 bits no puede representar direcciones más grandes.</span>
                            </div>
                        </div>

                        <!-- RIGHT: HEXADECIMAL (COMPACT / ORDER) -->
                        <div class="relative bg-slate-950 p-6 rounded-2xl border-2 border-emerald-500/40 flex flex-col items-center gap-4 overflow-hidden shadow-2xl group">
                            <div class="absolute top-3 right-3 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase">
                                Eficiencia / Orden
                            </div>
                            
                            <div class="text-left w-full">
                                <h3 class="text-sm font-bold text-emerald-400 flex items-center gap-2">
                                    <i class="fa-solid fa-shield-halved"></i> Dirección Hexadecimal (Base 16)
                                </h3>
                                <p class="text-[11px] text-slate-400 mt-1">Mantiene exactamente la misma longitud fija para rangos gigantescos.</p>
                            </div>

                            <!-- Odometer Box -->
                            <div class="w-full py-6 px-4 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-center relative min-h-[110px]">
                                <div id="hex-container" class="font-mono text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-widest flex items-center justify-center">
                                    <span id="hex-odometer" class="px-3 py-1 bg-emerald-950/40 rounded border border-emerald-500/30">0x00000000</span>
                                </div>
                            </div>

                            <!-- Perfect Alignment Badge -->
                            <div id="hex-status" class="w-full p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-center gap-2">
                                <i class="fa-solid fa-circle-check text-emerald-400"></i>
                                <span>Alineación perfecta: 8 dígitos cubren 4GB de RAM.</span>
                            </div>
                        </div>

                    </div>
                </div>
            `;
  container.innerHTML = html;

// Odometer State
  let counterValue = 0;
  let isRunning = false;
  const MAX_ADDRESS = 4294967295; // 2^32 - 1 = 0xFFFFFFFF (límite real de 32 bits)

  window.toggleOdometer = function () {
    isRunning = !isRunning;
    const btnText = document.getElementById("s2-btn-text");
    const playIcon = document.getElementById("s2-play-icon");

    if (isRunning) {
      btnText.textContent = "Pausar Contador";
      playIcon.className = "fa-solid fa-pause";

      scene2Timer = setInterval(() => {
        // Accelerate counting to demonstrate rapid jump to big addresses
        if (counterValue < 100) {
          counterValue += 1;
        } else if (counterValue < 1000) {
          counterValue += 193;
        } else if (counterValue < 100000) {
          counterValue += 49678;
        } else if (counterValue < 10000000) {
          counterValue += 1234567;
        } else {
            counterValue += 50876532;
        }

        // Clamp exacto en el límite real (0xFFFFFFFF), no antes
        let hitLimit = false;
        if (counterValue >= MAX_ADDRESS) {
          counterValue = MAX_ADDRESS;
          hitLimit = true;
        }

        updateOdometerDisplays(counterValue, hitLimit);
        playTone(200 + (counterValue % 800), "triangle", 0.02, 0.015);

        if (hitLimit) {
          clearInterval(scene2Timer);
          isRunning = false;
          document.getElementById("s2-btn-text").textContent =
            "Iniciar Conteo de Memoria";
          document.getElementById("s2-play-icon").className =
            "fa-solid fa-play";
        }
      }, 50);
    } else {
      btnText.textContent = "Reanudar Conteo";
      playIcon.className = "fa-solid fa-play";
      clearInterval(scene2Timer);
    }
  };

  window.resetOdometer = function () {
    if (scene2Timer) clearInterval(scene2Timer);
    isRunning = false;
    counterValue = 0;
    document.getElementById("s2-btn-text").textContent =
      "Iniciar Conteo de Memoria";
    document.getElementById("s2-play-icon").className = "fa-solid fa-play";
    updateOdometerDisplays(0, false);
  };

  function updateOdometerDisplays(val, isOverflow = false) {
    const decElem = document.getElementById("dec-odometer");
    const hexElem = document.getElementById("hex-odometer");
    const decContainer = document.getElementById("dec-container");
    const decWarning = document.getElementById("dec-warning");

    decElem.textContent = val.toLocaleString("es-ES");

    // Formatted 8-digit padding for hex
    const hexStr = "0x" + val.toString(16).padStart(8, "0").toUpperCase();
    hexElem.textContent = hexStr;

    // El badge ahora depende del límite real de 32 bits, no de "se ve largo"
    if (isOverflow) {
      decContainer.classList.add("animate-shake", "scale-110", "text-red-300");
      decWarning.classList.remove("opacity-0");
      decWarning.classList.add("opacity-100");
    } else {
      decContainer.classList.remove(
        "animate-shake",
        "scale-110",
        "text-red-300",
      );
      decWarning.classList.add("opacity-0");
      decWarning.classList.remove("opacity-100");
    }
  }
}

function renderScene3(container) {
  document.getElementById("scene-title").textContent =
    "Escena 3 — Dentro de una Celda: 8 Bits a 2 Dígitos Hexadecimales";
  document.getElementById("scene-description").textContent =
    "Haz clic en las bombillas para encender/apagar los bits (1 ó 0). Observa cómo cada grupo de 4 bits (Nibble) se condensa exactamente en 1 dígito Hexadecimal.";

  let bitState = [1, 0, 1, 0, 0, 1, 0, 1]; // Default 0xA5 (165)

  let html = `
                <div class="w-full max-w-4xl flex flex-col items-center justify-center gap-6 py-2">
                    
                    <!-- Decimal Real-Time Output Box -->
                    <div class="flex items-center gap-6 bg-slate-950 px-8 py-3 rounded-2xl border border-cyan-500/40 shadow-xl shadow-cyan-500/10">
                        <div class="text-center">
                            <span class="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Valor Decimal Vivo</span>
                            <span id="s3-dec-val" class="font-mono text-3xl sm:text-4xl font-black text-cyan-400">165</span>
                        </div>
                        <div class="h-10 w-px bg-slate-800"></div>
                        <div class="text-center">
                            <span class="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Código Hexadecimal</span>
                            <span id="s3-hex-val" class="font-mono text-3xl sm:text-4xl font-black text-purple-400">0xA5</span>
                        </div>
                    </div>

                    <!-- Zoom Cell Container (Inside 1 Byte House) -->
                    <div class="w-full bg-slate-950/90 border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 flex flex-col items-center gap-8 relative shadow-2xl">
                        
                        <!-- House Identifier Badge -->
                        <div class="absolute -top-3 bg-purple-600 text-slate-950 font-mono font-bold text-xs px-4 py-1 rounded-full shadow-md">
                            CASA DE MEMORIA #0x1000 (1 BYTE = 8 BITS)
                        </div>

                        <!-- Hex Nibble Floating Displays Above Bits -->
                        <div class="grid grid-cols-2 gap-8 sm:gap-16 w-full max-w-2xl">
                            
                            <!-- High Nibble Floating Hex -->
                            <div class="flex flex-col items-center gap-1 bg-slate-900/80 p-3 rounded-2xl border border-purple-500/30 animate-pulse-glow">
                                <span class="text-[10px] font-mono text-purple-300 font-semibold">NIBBLE ALTO (BITS 7-4)</span>
                                <div id="s3-nibble-high-hex" class="text-4xl font-black font-mono text-purple-400 drop-shadow-[0_0_12px_rgba(139,92,246,0.8)]">
                                    A
                                </div>
                                <span class="text-[10px] font-mono text-slate-400">(4 bits = 1 símbolo hex)</span>
                            </div>

                            <!-- Low Nibble Floating Hex -->
                            <div class="flex flex-col items-center gap-1 bg-slate-900/80 p-3 rounded-2xl border border-cyan-500/30 animate-pulse-glow">
                                <span class="text-[10px] font-mono text-cyan-300 font-semibold">NIBBLE BAJO (BITS 3-0)</span>
                                <div id="s3-nibble-low-hex" class="text-4xl font-black font-mono text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]">
                                    5
                                </div>
                                <span class="text-[10px] font-mono text-slate-400">(4 bits = 1 símbolo hex)</span>
                            </div>
                        </div>

                        <!-- 8 Bit Bulbs Interactive Grid -->
                        <div class="grid grid-cols-2 gap-6 sm:gap-12 w-full max-w-2xl">
                            
                            <!-- High Nibble Bulbs (Bit 7 to 4) -->
                            <div class="grid grid-cols-4 gap-2 sm:gap-3 p-3 rounded-2xl bg-slate-900 border border-purple-500/30">
                                ${[7, 6, 5, 4]
                                  .map(
                                    (bitIdx) => `
                                    <div class="flex flex-col items-center gap-2">
                                        <span class="text-[10px] font-mono text-slate-400">2<sup>${bitIdx}</sup> = ${Math.pow(2, bitIdx)}</span>
                                        <button onclick="toggleBit(${bitIdx})" id="bit-btn-${bitIdx}" class="bit-bulb w-10 h-14 sm:w-12 sm:h-16 rounded-xl flex flex-col items-center justify-between p-2 font-mono font-extrabold text-base border-2 transition-all">
                                            <i class="fa-solid fa-lightbulb text-xs"></i>
                                            <span id="bit-val-${bitIdx}">0</span>
                                        </button>
                                        <span class="text-[9px] font-mono text-purple-400 font-bold">Bit ${bitIdx}</span>
                                    </div>
                                `,
                                  )
                                  .join("")}
                            </div>

                            <!-- Low Nibble Bulbs (Bit 3 to 0) -->
                            <div class="grid grid-cols-4 gap-2 sm:gap-3 p-3 rounded-2xl bg-slate-900 border border-cyan-500/30">
                                ${[3, 2, 1, 0]
                                  .map(
                                    (bitIdx) => `
                                    <div class="flex flex-col items-center gap-2">
                                        <span class="text-[10px] font-mono text-slate-400">2<sup>${bitIdx}</sup> = ${Math.pow(2, bitIdx)}</span>
                                        <button onclick="toggleBit(${bitIdx})" id="bit-btn-${bitIdx}" class="bit-bulb w-10 h-14 sm:w-12 sm:h-16 rounded-xl flex flex-col items-center justify-between p-2 font-mono font-extrabold text-base border-2 transition-all">
                                            <i class="fa-solid fa-lightbulb text-xs"></i>
                                            <span id="bit-val-${bitIdx}">0</span>
                                        </button>
                                        <span class="text-[9px] font-mono text-cyan-400 font-bold">Bit ${bitIdx}</span>
                                    </div>
                                `,
                                  )
                                  .join("")}
                            </div>
                        </div>

                        <!-- Quick presets button row -->
                        <div class="flex items-center gap-2 flex-wrap justify-center text-xs">
                            <span class="text-slate-400 font-mono">Probar valores:</span>
                            <button onclick="setBitPreset(0)" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 font-mono text-slate-300">0x00 (0)</button>
                            <button onclick="setBitPreset(255)" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 font-mono text-slate-300">0xFF (255)</button>
                            <button onclick="setBitPreset(170)" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 font-mono text-slate-300">0xAA (170)</button>
                            <button onclick="setBitPreset(42)" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 font-mono text-slate-300">0x2A (42)</button>
                        </div>

                    </div>
                </div>
            `;
  container.innerHTML = html;

  window.toggleBit = function (bitIndex) {
    bitState[7 - bitIndex] = bitState[7 - bitIndex] === 1 ? 0 : 1;
    playTone(300 + bitIndex * 80, "sine", 0.08, 0.05);
    updateBitView();
  };

  window.setBitPreset = function (decimalVal) {
    for (let i = 0; i < 8; i++) {
      bitState[7 - i] = (decimalVal >> i) & 1;
    }
    playTone(600, "sine", 0.1, 0.05);
    updateBitView();
  };

  function updateBitView() {
    let decSum = 0;
    for (let i = 0; i < 8; i++) {
      const isVal = bitState[7 - i];
      const bitIdx = i;
      const btn = document.getElementById(`bit-btn-${bitIdx}`);
      const valTxt = document.getElementById(`bit-val-${bitIdx}`);

      if (isVal === 1) {
        decSum += Math.pow(2, bitIdx);
        btn.className =
          "bit-bulb active w-10 h-14 sm:w-12 sm:h-16 rounded-xl flex flex-col items-center justify-between p-2 font-mono font-extrabold text-base border-cyan-300";
        valTxt.textContent = "1";
      } else {
        btn.className =
          "bit-bulb w-10 h-14 sm:w-12 sm:h-16 rounded-xl flex flex-col items-center justify-between p-2 font-mono font-extrabold text-base border-slate-800 bg-slate-950 text-slate-600 hover:border-slate-700";
        valTxt.textContent = "0";
      }
    }

    // High Nibble (bits 7..4)
    const highVal =
      (bitState[0] << 3) |
      (bitState[1] << 2) |
      (bitState[2] << 1) |
      bitState[3];
    // Low Nibble (bits 3..0)
    const lowVal = (bitState[4]<<3) | (bitState[5]<<2) | (bitState[6]<<1) | bitState[7];
//            = (0<<3)         | (1<<2)          | (0<<1)          | 1
//            = 0 + 4 + 0 + 1 = 5  ✓

    const highHex = highVal.toString(16).toUpperCase();
    const lowHex = lowVal.toString(16).toUpperCase();

    document.getElementById("s3-dec-val").textContent = decSum;
    document.getElementById("s3-hex-val").textContent = `0x${highHex}${lowHex}`;
    document.getElementById("s3-nibble-high-hex").textContent = highHex;
    document.getElementById("s3-nibble-low-hex").textContent = lowHex;
  }

  // Init initial state
  updateBitView();
}


function renderScene4(container) {
  document.getElementById("scene-title").textContent =
    "Escena 4 — Un Int (4 Bytes) en la Matriz de Memoria (Contigüidad)";
  document.getElementById("scene-description").textContent =
    "Un entero (32-bit int) requiere 4 celdas/bytes estrictamente consecutivos dentro de la matriz. La arquitectura de hardware no tolera la fragmentación de celdas para un mismo tipo de dato primitivo.";

  let html = `
    <div class="w-full max-w-4xl flex flex-col items-center justify-center gap-6 py-2">
        
        <!-- Toggle Contiguity Variant Buttons -->
        <div class="flex items-center gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800">
            <button id="s4-btn-contiguous" onclick="testContiguity(true)" class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all">
                <i class="fa-solid fa-link"></i> Int Contiguo en Matriz (Válido)
            </button>
            <button id="s4-btn-fragmented" onclick="testContiguity(false)" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-2 transition-all">
                <i class="fa-solid fa-link-slash text-red-400"></i> Int Fragmentado (No Contiguo)
            </button>
        </div>

        <!-- Dynamic Status Banner -->
        <div id="s4-status-banner" class="w-full p-4 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 text-sm flex items-center justify-between transition-all">
            <div class="flex items-center gap-3">
                <i id="s4-status-icon" class="fa-solid fa-circle-check text-cyan-400 text-xl"></i>
                <div>
                    <h4 id="s4-status-title" class="font-bold">4 Celdas de la Matriz Integradas</h4>
                    <p id="s4-status-desc" class="text-xs text-slate-300">4 celdas consecutivas (0x1000 - 0x1003) forman un bloque unificado para el entero <b>42</b> (Little-Endian: LSB 0x2A en 0x1000).</p>
                </div>
            </div>
            <span id="s4-int-val-badge" class="font-mono text-xl font-extrabold text-cyan-400 bg-slate-950 px-4 py-1.5 rounded-xl border border-cyan-500/30">
                int x = 42;
            </span>
        </div>

        <!-- 2D Memory Matrix Grid View -->
        <div class="w-full bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl overflow-x-auto custom-scrollbar">
            <div class="min-w-[580px] max-w-2xl mx-auto flex flex-col gap-3">
                
                <!-- Column Headers -->
                <div class="grid grid-cols-9 gap-2 text-center font-mono text-[10px] font-bold text-slate-400 border-b border-slate-800 pb-2">
                    <div class="text-slate-600 text-left pl-1">DIRECCIÓN</div>
                    ${Array.from({ length: 8 })
                      .map(
                        (_, c) => `
                        <div class="text-cyan-400/80 bg-cyan-950/20 py-1 rounded">+0x0${c}</div>
                    `,
                      )
                      .join("")}
                </div>

                <!-- Row 0x1000 -->
                <div class="grid grid-cols-9 gap-2 items-center">
                    <div class="font-mono text-xs font-bold text-purple-400 bg-purple-950/20 px-2 py-2 rounded text-left">0x1000</div>
                    ${Array.from({ length: 8 })
                      .map(
                        (_, c) => `
                        <div id="s4-mcell-${c}" class="h-14 rounded-xl bg-slate-900 border-2 border-slate-800 flex flex-col items-center justify-between p-1.5 font-mono transition-all">
                            <span class="text-[9px] text-slate-500 font-bold">#${c}</span>
                            <span class="s4-cell-val text-xs font-bold text-slate-500">0x00</span>
                            <span class="text-[8px] text-slate-600">0x100${c}</span>
                        </div>
                    `,
                      )
                      .join("")}
                </div>

                <!-- Row 0x1008 -->
                <div class="grid grid-cols-9 gap-2 items-center">
                    <div class="font-mono text-xs font-bold text-purple-400 bg-purple-950/20 px-2 py-2 rounded text-left">0x1008</div>
                    ${Array.from({ length: 8 })
                      .map((_, c) => {
                        const cIdx = c + 8;
                        const cHex = (8 + c)
                          .toString(16)
                          .toUpperCase();
                        return `
                            <div id="s4-mcell-${cIdx}" class="h-14 rounded-xl bg-slate-900 border-2 border-slate-800 flex flex-col items-center justify-between p-1.5 font-mono transition-all">
                                <span class="text-[9px] text-slate-500 font-bold">#${cIdx}</span>
                                <span class="s4-cell-val text-xs font-bold text-slate-500">0x00</span>
                                <span class="text-[8px] text-slate-600">0x100${cHex}</span>
                            </div>
                        `;
                      })
                      .join("")}
                </div>

            </div>
        </div>

        <!-- Explanatory note -->
        <p class="text-xs text-slate-400 text-center max-w-xl leading-relaxed">
            En la RAM, un entero de 32 bits ocupa 4 bytes consecutivas. En arquitecturas x86/x64 se utiliza el orden <b>Little-Endian</b>, donde el byte menos significativo (<b>0x2A</b>) se posiciona en la dirección inicial más baja (<b>0x1000</b>).
        </p>
    </div>
  `;
  container.innerHTML = html;

  window.testContiguity = function (isValid) {
    const btnContig = document.getElementById("s4-btn-contiguous");
    const btnFrag = document.getElementById("s4-btn-fragmented");
    const banner = document.getElementById("s4-status-banner");
    const icon = document.getElementById("s4-status-icon");
    const title = document.getElementById("s4-status-title");
    const desc = document.getElementById("s4-status-desc");
    const badge = document.getElementById("s4-int-val-badge");

    // Restablecer todas las 16 celdas de la matriz
    for (let i = 0; i < 16; i++) {
      const cell = document.getElementById(`s4-mcell-${i}`);
      if (cell) {
        cell.className =
          "h-14 rounded-xl bg-slate-900 border-2 border-slate-800 flex flex-col items-center justify-between p-1.5 font-mono transition-all opacity-50";
        const val = cell.querySelector(".s4-cell-val");
        if (val) {
          val.textContent = "0x00";
          val.className = "s4-cell-val text-xs font-bold text-slate-600";
        }
      }
    }

    if (isValid) {
      btnContig.className =
        "px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all";
      btnFrag.className =
        "px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-2 transition-all";

      banner.className =
        "w-full p-4 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 text-sm flex items-center justify-between transition-all";
      icon.className = "fa-solid fa-circle-check text-cyan-400 text-xl";
      title.textContent = "Celdas de la Matriz Integradas Correctamente";
      desc.innerHTML =
        "4 celdas contiguas (0x1000 - 0x1003) unificadas para el entero <b>42</b> (Little-Endian: byte LSB 0x2A en 0x1000).";
      badge.className =
        "font-mono text-xl font-extrabold text-cyan-400 bg-slate-950 px-4 py-1.5 rounded-xl border border-cyan-500/30";
      badge.textContent = "int x = 42;";

      // Resaltar celdas contiguas 0, 1, 2, 3 en x86 Little-Endian
      const byteVals = ["0x2A", "0x00", "0x00", "0x00"];
      for (let i = 0; i < 4; i++) {
        const cell = document.getElementById(`s4-mcell-${i}`);
        if (cell) {
          cell.className =
            "h-14 rounded-xl bg-cyan-950/70 border-2 border-cyan-400 flex flex-col items-center justify-between p-1.5 font-mono transition-all scale-105 shadow-[0_0_15px_rgba(6,182,212,0.4)] opacity-100 z-10";
          const val = cell.querySelector(".s4-cell-val");
          if (val) {
            val.textContent = byteVals[i];
            val.className = "s4-cell-val text-xs font-bold text-cyan-300";
          }
        }
      }

      if (typeof playSuccessSound === "function") playSuccessSound();
    } else {
      btnFrag.className =
        "px-4 py-2 rounded-xl bg-red-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all";
      btnContig.className =
        "px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-2 transition-all";

      banner.className =
        "w-full p-4 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 text-sm flex items-center justify-between transition-all animate-shake";
      icon.className = "fa-solid fa-triangle-exclamation text-red-400 text-xl";
      title.textContent = "Error de Contigüidad en Memoria";
      desc.innerHTML =
        "Las celdas asignadas están dispersas. Los datos de tipos primitivos no pueden fragmentarse en la arquitectura de hardware.";
      badge.className =
        "font-mono text-xl font-extrabold text-red-400 bg-slate-950 px-4 py-1.5 rounded-xl border border-red-500/30";
      badge.textContent = "ERROR: MEMORIA_NO_CONTIGUA";

      // Resaltar celdas fragmentadas/dispersas (#0, #2, #9, #13)
      [0, 2, 9, 13].forEach((i) => {
        const cell = document.getElementById(`s4-mcell-${i}`);
        if (cell) {
          cell.className =
            "h-14 rounded-xl bg-red-950/80 border-2 border-red-500 flex flex-col items-center justify-between p-1.5 font-mono transition-all scale-105 shadow-[0_0_15px_rgba(239,68,68,0.5)] opacity-100 z-10";
          const val = cell.querySelector(".s4-cell-val");
          if (val) {
            val.textContent = "0x??";
            val.className = "s4-cell-val text-xs font-bold text-red-400";
          }
        }
      });

      if (typeof playErrorSound === "function") playErrorSound();
    }
  };

  // Inicializar vista contigua por defecto
  testContiguity(true);
}


function renderScene5(container) {
  document.getElementById("scene-title").textContent =
    "Escena 5 — Indexación de Array como Aritmética de Matriz";
  document.getElementById("scene-description").textContent =
    "Cada elemento de un array de enteros ocupa un bloque contiguo de 4 celdas en la matriz de memoria. La fórmula calcula la dirección física exacta en la matriz.";

  const baseAddr = 0x2000;
  const elementSize = 4; // 4 bytes per int element

  let html = `
                <div class="w-full max-w-4xl flex flex-col items-center justify-center gap-6 py-2">
                    
                    <!-- Interactive Index Selector Buttons -->
                    <div class="flex items-center gap-2 sm:gap-4 bg-slate-950 p-3 rounded-2xl border border-slate-800 flex-wrap justify-center">
                        <span class="text-xs font-mono text-slate-400 font-bold mr-1">Seleccionar Índice:</span>
                        ${[0, 1, 2, 3]
                          .map(
                            (idx) => `
                            <button id="s5-idx-btn-${idx}" onclick="selectArrayIndex(${idx})" class="s5-idx-btn px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-400 font-mono font-extrabold text-sm transition-all hover:scale-105 flex items-center gap-1.5">
                                <span>array[4]</span>
                            </button>
                        `,
                          )
                          .join("")}

                        <div class="w-px h-6 bg-slate-800 mx-1"></div>

                        <!-- Out of bounds trigger -->
                        <button id="s5-idx-btn-5" onclick="selectArrayIndex(5)" class="s5-idx-btn px-3 py-2 rounded-xl bg-red-950/40 border border-red-500/40 hover:border-red-400 text-red-400 font-mono font-bold text-xs transition-all hover:scale-105 flex items-center gap-1.5">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            <span>array[4] (Fuera de Rango)</span>
                        </button>
                    </div>

                    <!-- Live Equation Calculation Display Bar -->
                    <div class="w-full bg-slate-950 p-6 rounded-2xl border-2 border-cyan-500/40 shadow-2xl relative overflow-hidden flex flex-col items-center gap-3">
                        <span class="text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-widest">Fórmula de Dirección en Matriz de Memoria</span>
                        
                        <!-- Equation Visual Breakdown -->
                        <div id="s5-equation-box" class="flex items-center gap-2 sm:gap-3 font-mono text-lg sm:text-2xl font-extrabold text-slate-200 flex-wrap justify-center">
                            <span class="text-purple-400 bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-500/30" id="eq-base">
                                0x${baseAddr.toString(16).toUpperCase()}
                            </span>
                            <span class="text-slate-500">+</span>
                            <span class="text-slate-400">(</span>
                            <span class="text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-500/30" id="eq-index">
                                0
                            </span>
                            <span class="text-slate-500">×</span>
                            <span class="text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-500/30" id="eq-size">
                                4 bytes
                            </span>
                            <span class="text-slate-400">)</span>
                            <span class="text-slate-500">=</span>
                            <span class="text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-lg border-2 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] text-xl sm:text-3xl" id="eq-result">
                                0x${baseAddr.toString(16).toUpperCase()}
                            </span>
                        </div>

                        <p id="s5-math-desc" class="text-xs text-slate-400 text-center font-mono">
                            Dirección Base de Matriz + (Índice × 4 Celdas)
                        </p>
                    </div>

                    <!-- 2D Memory Matrix with Allocated Array Region -->
                    <div class="w-full bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-2xl overflow-x-auto custom-scrollbar">
                        <div class="min-w-[620px] max-w-3xl mx-auto flex flex-col gap-2">
                            
                            <!-- Header Info -->
                            <div class="flex items-center justify-between text-xs font-mono mb-1">
                                <span class="text-cyan-400 font-bold flex items-center gap-2">
                                    <i class="fa-solid fa-border-all"></i> Matriz RAM: Reserva int array[4] (16 Celdas/Bytes)
                                </span>
                                <span class="text-slate-500">Dirección Base: 0x2000</span>
                            </div>

                            <!-- Row 0x2000 (0x2000 - 0x2007: array[0] and array[1]) -->
                            <div class="grid grid-cols-9 gap-1.5 items-center">
                                <div class="font-mono text-[11px] font-bold text-purple-400 bg-purple-950/30 px-2 py-1.5 rounded border border-purple-500/20 text-left">0x2000</div>
                                ${Array.from({ length: 8 })
                                  .map(
                                    (_, c) => `
                                    <div id="s5-mcell-${c}" class="h-12 rounded-lg bg-slate-900 border border-cyan-500/30 flex flex-col items-center justify-between p-1 font-mono transition-all">
                                        <span class="text-[8px] text-slate-500">#${c}</span>
                                        <span class="text-[9px] font-bold text-cyan-400">${c < 4 ? "[0]" : "[1]"}</span>
                                        <span class="text-[8px] text-slate-600">..0${c}</span>
                                    </div>
                                `,
                                  )
                                  .join("")}
                            </div>

                            <!-- Row 0x2008 (0x2008 - 0x200F: array[2] and array[3]) -->
                            <div class="grid grid-cols-9 gap-1.5 items-center">
                                <div class="font-mono text-[11px] font-bold text-purple-400 bg-purple-950/30 px-2 py-1.5 rounded border border-purple-500/20 text-left">0x2008</div>
                                ${Array.from({ length: 8 })
                                  .map((_, c) => {
                                    const idx = c + 8;
                                    const cHex = idx.toString(16).toUpperCase();
                                    return `
                                        <div id="s5-mcell-${idx}" class="h-12 rounded-lg bg-slate-900 border border-cyan-500/30 flex flex-col items-center justify-between p-1 font-mono transition-all">
                                            <span class="text-[8px] text-slate-500">#${idx}</span>
                                            <span class="text-[9px] font-bold text-cyan-400">${c < 4 ? "[2]" : "[3]"}</span>
                                            <span class="text-[8px] text-slate-600">..0${cHex}</span>
                                        </div>
                                    `;
                                  })
                                  .join("")}
                            </div>

                            <!-- Row 0x2010 (Unallocated RAM Matrix space) -->
                            <div class="grid grid-cols-9 gap-1.5 items-center opacity-60">
                                <div class="font-mono text-[11px] font-bold text-slate-500 bg-slate-900 px-2 py-1.5 rounded text-left">0x2010</div>
                                ${Array.from({ length: 8 })
                                  .map((_, c) => {
                                    const idx = c + 16;
                                    const cHex = idx.toString(16).toUpperCase();
                                    return `
                                        <div id="s5-mcell-${idx}" class="h-12 rounded-lg bg-slate-950 border border-slate-800 flex flex-col items-center justify-between p-1 font-mono transition-all">
                                            <span class="text-[8px] text-slate-600">#${idx}</span>
                                            <span class="text-[8px] font-bold text-slate-600">N/A</span>
                                            <span class="text-[8px] text-slate-700">..${cHex}</span>
                                        </div>
                                    `;
                                  })
                                  .join("")}
                            </div>

                        </div>
                    </div>

                    <!-- Warning box for Buffer Overflow concept -->
                    <div id="s5-overflow-warning" class="hidden w-full p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-3 animate-shake">
                        <i class="fa-solid fa-triangle-exclamation text-red-400 text-lg"></i>
                        <div>
                            <strong class="font-bold">¡DESBORDAMIENTO DE MATRIZ "En un sistema real, el hardware no comprueba los límites del array. El desbordamiento puede corromper otras variables silenciosamente (peligro de seguridad), o directamente provocar un SegFault si accedes a memoria protegida."</strong>
                            <p class="text-[11px] text-red-300 mt-0.5">La dirección 0x2000 + (5 × 4) calcula la celda 0x2014 fuera de la región reservada para el array. ¡Accedes a celdas de la matriz pertenecientes a otras variables!</p>
                            <p class="text-[11px] text-red-300 mt-0.5">Un SegFault (fallo de segmentación) es un error que ocurre cuando un programa intenta leer o escribir en una zona de la memoria RAM que no le pertenece o no tiene permiso de usar</p>
                        </div>
                    </div>

                </div>
            `;
  container.innerHTML = html;

  window.selectArrayIndex = function (idx) {
    const targetAddr = baseAddr + idx * elementSize;
    const hexTarget = "0x" + targetAddr.toString(16).toUpperCase();

    document.getElementById("eq-index").textContent = idx;
    document.getElementById("eq-result").textContent = hexTarget;

    document.querySelectorAll(".s5-idx-btn").forEach((btn) => {
      btn.classList.remove("ring-2", "ring-cyan-400", "bg-cyan-950");
    });
    const activeBtn = document.getElementById(`s5-idx-btn-${idx}`);
    if (activeBtn)
      activeBtn.classList.add("ring-2", "ring-cyan-400", "bg-cyan-950");

    const isOutOfBounds = idx > 3;
    const warnBox = document.getElementById("s5-overflow-warning");

    if (isOutOfBounds) {
      warnBox.classList.remove("hidden");
      playErrorSound();
    } else {
      warnBox.classList.add("hidden");
      playSuccessSound();
    }

    const startCellIdx = idx * 4;

    for (let i = 0; i < 24; i++) {
      const cell = document.getElementById(`s5-mcell-${i}`);
      const isTarget = i >= startCellIdx && i < startCellIdx + 4;

      if (isTarget) {
        if (isOutOfBounds) {
          cell.className =
            "h-12 rounded-lg bg-red-950 border-2 border-red-500 flex flex-col items-center justify-between p-1 font-mono transition-all scale-110 shadow-[0_0_15px_rgba(239,68,68,0.8)] z-20";
        } else {
          cell.className =
            "h-12 rounded-lg bg-cyan-950 border-2 border-cyan-400 flex flex-col items-center justify-between p-1 font-mono transition-all scale-110 shadow-[0_0_15px_rgba(6,182,212,0.8)] z-20";
        }
      } else {
        const isAllocated = i < 16;
        cell.className = `h-12 rounded-lg ${isAllocated ? "bg-slate-900 border-cyan-500/20 opacity-50" : "bg-slate-950 border-slate-800 opacity-30"} border flex flex-col items-center justify-between p-1 font-mono transition-all`;
      }
    }
  };

  selectArrayIndex(0);
}

export function init() {
  window.loadScene = loadScene;
  window.nextScene = nextScene;
  window.prevScene = prevScene;
  window.toggleSound = toggleSound;
  window.toggleOdometer = toggleOdometer;
  window.resetOdometer = resetOdometer;
  window.inspectMatrixCell = inspectMatrixCell;
  window.toggleBit = toggleBit;
  window.setBitPreset = setBitPreset;
  window.testContiguity = testContiguity;
  window.selectArrayIndex = selectArrayIndex;

  // Arrancar la primera escena
  loadScene(1);
}

export function destroy() {
  // Limpiar intervalos
  if (scene2Timer) clearInterval(scene2Timer);

  // Limpiar referencias a window
  delete window.loadScene;
  delete window.nextScene;
  delete window.prevScene;
  delete window.toggleSound;
  delete window.toggleOdometer;
  delete window.resetOdometer;
  delete window.inspectMatrixCell;
  delete window.toggleBit;
  delete window.setBitPreset;
  delete window.testContiguity;
  delete window.selectArrayIndex;

  // Suspender contexto de audio para liberar recursos si no se usa
  if (audioCtx && audioCtx.state === "running") {
    audioCtx.suspend();
  }
}
