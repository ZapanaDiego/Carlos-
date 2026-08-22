// execution.js — Controlador de ejecución (patrón Controlador)
//
// ╔══════════════════════════════════════════════════════════════════╗
// ║  Rol: CONTROLADOR en la arquitectura Modelo/Vista/Controlador. ║
// ║                                                                ║
// ║  Responsabilidades:                                            ║
// ║  - Orquestar la interacción entre los 3 botones del UI,        ║
// ║    la API (SimulatorAPI), el Modelo (MemoryState), y las       ║
// ║    Vistas (BlockRenderer, StructureRenderer, EditorView).      ║
// ║  - Manejar el flujo: compilar → ejecutar/paso → reset.        ║
// ║  - Manejar errores de compilación (consola + highlight).       ║
// ║  - Gestionar el estado de la UI (botones habilitados/          ║
// ║    deshabilitados, editor read-only durante ejecución).        ║
// ║                                                                ║
// ║  No contiene lógica de negocio ni de renderizado — solo        ║
// ║  conecta los módulos entre sí.                                 ║
// ╚══════════════════════════════════════════════════════════════════╝

window.ExecutionController = (function () {
    'use strict';

    // ─── Estado del Controlador ────────────────────────────────────

    /** @type {MemoryState|null} */
    let memoryState = null;
    /** @type {BlockRenderer|null} */
    let stackRenderer = null;
    /** @type {BlockRenderer|null} */
    let heapRenderer = null;
    /** @type {StructureRenderer|null} */
    let structureRenderer = null;
    /** @type {ArrowRenderer|null} */
    let arrowRenderer = null;
    /** @type {HTMLElement|null} */
    let outputConsole = null;

    /** @type {boolean} ¿Se compiló el código y hay una sesión activa? */
    let isCompiled = false;
    /** @type {boolean} ¿Está en modo ejecución continua (streaming)? */
    let isRunning = false;
    /** @type {Function|null} Función para cancelar el streaming actual */
    let cancelStreaming = null;

    // ─── Consola de Salida ─────────────────────────────────────────

    /** Texto por defecto que muestra la consola cuando está vacía */
    const CONSOLE_PLACEHOLDER = '// La salida del programa aparecerá aquí...';

    /**
     * Agrega una línea de texto a la consola de salida.
     * @param {string} text - Texto a mostrar.
     * @param {string} type - Tipo: 'info', 'success', 'error', 'stdout'.
     */
    function appendOutput(text, type = 'info') {
        if (!outputConsole) return;

        // Limpiar placeholder si es la primera línea real
        if (outputConsole.innerText.trim() === CONSOLE_PLACEHOLDER) {
            outputConsole.innerHTML = '';
        }

        const div = document.createElement('div');
        div.className = `output-line output-${type}`;
        div.textContent = text;
        outputConsole.appendChild(div);

        // Auto-scroll al final
        outputConsole.scrollTop = outputConsole.scrollHeight;
    }

    /**
     * Limpia la consola y muestra el placeholder.
     */
    function clearConsole() {
        if (outputConsole) {
            outputConsole.innerHTML = CONSOLE_PLACEHOLDER;
        }
    }

    // ─── Procesamiento de Snapshots ────────────────────────────────

    /**
     * Procesa un snapshot recibido de la API.
     * Lo pasa por el MemoryState (que calcula diffs y notifica a las Vistas)
     * y maneja los datos adicionales (output, línea actual, estructuras).
     *
     * @param {Object} snapshot - Snapshot con el formato del contrato de datos.
     */
    function processSnapshot(snapshot) {
        if (!memoryState) return;

        // 1. Aplicar snapshot al modelo (esto calcula diffs y notifica las Vistas)
        memoryState.applySnapshot(snapshot);

        // 2. Resaltar la línea actual en el editor
        if (snapshot.currentLine) {
            window.EditorView.highlightCurrentLine(snapshot.currentLine);
        }

        // 3. Mostrar output en la consola
        if (Array.isArray(snapshot.output)) {
            for (const out of snapshot.output) {
                if (out.text) {
                    appendOutput(out.text.replace(/\n$/, ''), out.type === 'stderr' ? 'error' : 'stdout');
                }
            }
        }

        // 4. Renderizar estructuras si las hay
        if (snapshot.structures && structureRenderer) {
            structureRenderer.render(snapshot.structures);
        }

        // 5. Manejar error
        if (snapshot.error) {
            appendOutput(`Error: ${snapshot.error}`, 'error');
        }
    }

    // ─── Gestión de Estado de Botones ──────────────────────────────

    /**
     * Actualiza el estado visual de los botones según el estado actual.
     */
    function updateButtonStates() {
        const btnRun  = document.getElementById('btn-run');
        const btnStep = document.getElementById('btn-step');
        const btnReset = document.getElementById('btn-reset');

        if (btnRun) {
            btnRun.disabled = isRunning;
            btnRun.textContent = isRunning ? '⏸ Ejecutando...' : '▶ Ejecutar';
        }
        if (btnStep) {
            btnStep.disabled = isRunning;
        }
        if (btnReset) {
            btnReset.disabled = false; // Reset siempre disponible
        }
    }

    // ─── Handlers de Botones ───────────────────────────────────────

    /**
     * Handler del botón "Ejecutar" — Compilar y ejecutar todo con animación.
     */
    async function handleRun() {
        if (isRunning) return;
        const api = window.SimulatorAPI;
        if (!api) {
            appendOutput('Error: SimulatorAPI no disponible', 'error');
            return;
        }

        const code = window.EditorView.getCode();
        if (!code.trim()) {
            appendOutput('⚠ Escribe código C++ para ejecutar', 'info');
            return;
        }

        // Resetear estado previo
        await handleReset(true); // reset silencioso

        appendOutput('⚡ Compilando programa...', 'info');
        window.EditorView.setReadOnly(true);

        try {
            // Paso 1: Compilar
            const compileResult = await api.compile(code);

            if (!compileResult.success) {
                // Error de compilación
                const errMsg = compileResult.error
                    ? compileResult.error.message
                    : 'Error de compilación desconocido';
                const errLine = compileResult.error ? compileResult.error.line : null;

                appendOutput(`✗ Error de compilación: ${errMsg}`, 'error');

                if (errLine) {
                    window.EditorView.highlightErrorLine(errLine);
                }

                window.EditorView.setReadOnly(false);
                return;
            }

            appendOutput('✓ Compilación exitosa', 'success');
            isCompiled = true;

            // Paso 2: Ejecutar streaming
            isRunning = true;
            updateButtonStates();

            cancelStreaming = api.runStreaming(
                code,
                // onSnapshot
                (snapshot) => {
                    processSnapshot(snapshot);
                },
                // onDone
                () => {
                    isRunning = false;
                    appendOutput('✓ Ejecución completada', 'success');
                    window.EditorView.setReadOnly(false);
                    updateButtonStates();
                },
                // onError
                (err) => {
                    isRunning = false;
                    appendOutput(`✗ Error de ejecución: ${err.message || err}`, 'error');
                    window.EditorView.setReadOnly(false);
                    updateButtonStates();
                }
            );
        } catch (err) {
            isRunning = false;
            appendOutput(`✗ Error: ${err.message || err}`, 'error');
            window.EditorView.setReadOnly(false);
            updateButtonStates();
        }
    }

    /**
     * Handler del botón "Paso" — Ejecutar un solo paso.
     */
    async function handleStep() {
        if (isRunning) return;
        const api = window.SimulatorAPI;
        if (!api) {
            appendOutput('Error: SimulatorAPI no disponible', 'error');
            return;
        }

        // Si no se ha compilado, compilar primero
        if (!isCompiled) {
            const code = window.EditorView.getCode();
            if (!code.trim()) {
                appendOutput('⚠ Escribe código C++ para ejecutar', 'info');
                return;
            }

            appendOutput('⚡ Compilando programa...', 'info');

            try {
                const compileResult = await api.compile(code);
                if (!compileResult.success) {
                    const errMsg = compileResult.error
                        ? compileResult.error.message
                        : 'Error de compilación desconocido';
                    const errLine = compileResult.error ? compileResult.error.line : null;

                    appendOutput(`✗ Error de compilación: ${errMsg}`, 'error');
                    if (errLine) window.EditorView.highlightErrorLine(errLine);
                    return;
                }

                appendOutput('✓ Compilación exitosa', 'success');
                isCompiled = true;
                window.EditorView.setReadOnly(true);
            } catch (err) {
                appendOutput(`✗ Error: ${err.message || err}`, 'error');
                return;
            }
        }

        // Verificar si la ejecución ya terminó
        if (memoryState && memoryState.finished) {
            appendOutput('ℹ La ejecución ya ha terminado. Presiona Reset para reiniciar.', 'info');
            return;
        }

        // Ejecutar un paso
        try {
            const snapshot = await api.nextStep();
            processSnapshot(snapshot);

            if (snapshot.finished) {
                appendOutput('✓ Ejecución completada', 'success');
                window.EditorView.setReadOnly(false);
            }
        } catch (err) {
            appendOutput(`✗ Error en paso: ${err.message || err}`, 'error');
        }
    }

    /**
     * Handler del botón "Reset" — Limpiar todo y volver al estado inicial.
     * @param {boolean} silent - Si true, no muestra mensajes en la consola.
     */
    async function handleReset(silent = false) {
        // Cancelar streaming si está activo
        if (cancelStreaming) {
            cancelStreaming();
            cancelStreaming = null;
        }

        isRunning = false;
        isCompiled = false;

        // Reset de la API
        const api = window.SimulatorAPI;
        if (api) {
            await api.reset();
        }

        // Reset del modelo
        if (memoryState) {
            memoryState.reset();
        }

        // Reset de las vistas
        if (stackRenderer)     stackRenderer.clear();
        if (heapRenderer)      heapRenderer.clear();
        if (structureRenderer) structureRenderer.clear();
        if (arrowRenderer)     arrowRenderer.clear();

        // Reset del editor
        window.EditorView.clearHighlights();
        window.EditorView.setReadOnly(false);

        // Reset de la consola
        clearConsole();

        // Reset de botones
        updateButtonStates();

        if (!silent) {
            appendOutput('↺ Simulación reseteada', 'info');
        }
    }

    // ─── Inicialización ────────────────────────────────────────────

    document.addEventListener('DOMContentLoaded', () => {
        outputConsole = document.getElementById('output-console');

        // Crear instancias del Modelo y las Vistas
        memoryState       = new window.MemoryState();
        stackRenderer     = new window.BlockRenderer('stack-blocks', 'stack');
        heapRenderer      = new window.BlockRenderer('heap-blocks', 'heap');
        structureRenderer = new window.StructureRenderer('structures-container');
        arrowRenderer     = new window.ArrowRenderer('pointers-overlay');

        // Suscribir las Vistas al Modelo (patrón Observer)
        // Cuando MemoryState notifica un cambio, las Vistas aplican el diff
        memoryState.subscribe((event) => {
            if (event.reset) {
                // En reset, las vistas ya se limpiaron arriba
                return;
            }
            stackRenderer.applyDiff(event.stackDiff);
            heapRenderer.applyDiff(event.heapDiff);
            
        // Las flechas se actualizan *después* de los bloques (para tener DOM fresco)
        // y requieren el estado completo del stack/heap para validar dangling pointers.
        arrowRenderer.render(memoryState.stackMap, memoryState.heapMap);
    });

    // Conectar botones
    const btnRun   = document.getElementById('btn-run');
    const btnStep  = document.getElementById('btn-step');
    const btnReset = document.getElementById('btn-reset');

    if (btnRun)   btnRun.addEventListener('click', handleRun);
    if (btnStep)  btnStep.addEventListener('click', handleStep);
    if (btnReset) btnReset.addEventListener('click', handleReset);

    // Renderizar datos de ejemplo (demo) para visualizar inicialmente la UI
    // Esto reemplaza el antiguo renderDemo() de canvasView.js, usando el nuevo sistema.
    const demoSnapshot = {
        step: 0,
        currentLine: null,
        finished: false,
        output: [],
        error: null,
        stack: [
            { id: 's_x', frame: 'main', name: 'x', type: 'int', value: '10', address: '0x7ffc01' },
            { id: 's_ptr', frame: 'main', name: 'ptr', type: 'int*', value: '0x55a302', address: '0x7ffc02', pointsTo: 'h_1' }
        ],
        heap: [
            { id: 'h_1', type: 'int', value: '42', address: '0x55a302', status: 'alive' }
        ],
        structures: null
    };
    processSnapshot(demoSnapshot);
});

    // ─── API Pública ───────────────────────────────────────────────

    return {
        appendOutput
    };
})();

