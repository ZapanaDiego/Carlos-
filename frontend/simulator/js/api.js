// api.js — Módulo de comunicación con el backend C++
//
// ╔══════════════════════════════════════════════════════════════════╗
// ║  Rol: SERVICIO / Capa de Datos en la arquitectura MVC.         ║
// ║                                                                ║
// ║  Responsabilidades:                                            ║
// ║  - Encapsular toda la comunicación con el backend C++.         ║
// ║  - Mantener el sessionId de la sesión actual de simulación.    ║
// ║  - Proveer compile(), nextStep() (REST), y runStreaming() (WS).║
// ║  - Los mocks devuelven datos en el formato EXACTO del contrato ║
// ║    de datos, para que conectar el backend real después sea      ║
// ║    solo cambiar la URL.                                        ║
// ║                                                                ║
// ║  Contrato: Los snapshots usan IDs ESTABLES por bloque para     ║
// ║  permitir diffing eficiente en MemoryState.                    ║
// ╚══════════════════════════════════════════════════════════════════╝

window.SimulatorAPI = (function () {
    'use strict';

    const API_BASE = 'http://localhost:8080';
    const WS_URL   = 'ws://localhost:8080';

    // ═══════════════════════════════════════════════════════════════
    // Snapshots Mock — Secuencia progresiva para el código demo
    // ═══════════════════════════════════════════════════════════════
    //
    // Simula la ejecución paso a paso de:
    //   int main() {
    //       int x = 10;            ← paso 1 (línea 5)
    //       int* ptr = new int(42); ← paso 2 (línea 6): ptr en stack
    //                               ← paso 3 (línea 6): alloc en heap
    //       cout << *ptr << endl;   ← paso 4 (línea 7): output "42\n"
    //       delete ptr;             ← paso 5 (línea 8): heap freed
    //       return 0;               ← paso 6 (línea 9): finished
    //   }

    const MOCK_SNAPSHOTS = [
        // Paso 1: int x = 10
        {
            step: 1,
            currentLine: 5,
            finished: false,
            output: [],
            error: null,
            stack: [
                { id: 's_x', frame: 'main', name: 'x', type: 'int', value: '10', address: '0x7ffc01' }
            ],
            heap: [],
            structures: null
        },
        // Paso 2: int* ptr = new int(42) — se crea el puntero en stack
        {
            step: 2,
            currentLine: 6,
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
        },
        // Paso 3: cout << *ptr << endl — se lee el valor y se imprime
        {
            step: 3,
            currentLine: 7,
            finished: false,
            output: [{ type: 'stdout', text: '42\n' }],
            error: null,
            stack: [
                { id: 's_x', frame: 'main', name: 'x', type: 'int', value: '10', address: '0x7ffc01' },
                { id: 's_ptr', frame: 'main', name: 'ptr', type: 'int*', value: '0x55a302', address: '0x7ffc02', pointsTo: 'h_1' }
            ],
            heap: [
                { id: 'h_1', type: 'int', value: '42', address: '0x55a302', status: 'alive' }
            ],
            structures: null
        },
        // Paso 4: delete ptr — el bloque heap se libera
        {
            step: 4,
            currentLine: 8,
            finished: false,
            output: [],
            error: null,
            stack: [
                { id: 's_x', frame: 'main', name: 'x', type: 'int', value: '10', address: '0x7ffc01' },
                { id: 's_ptr', frame: 'main', name: 'ptr', type: 'int*', value: '0x55a302', address: '0x7ffc02', pointsTo: 'h_1' }
            ],
            heap: [
                { id: 'h_1', type: 'int', value: '???', address: '0x55a302', status: 'freed' }
            ],
            structures: null
        },
        // Paso 5: return 0 — se liberan las variables de stack
        {
            step: 5,
            currentLine: 9,
            finished: true,
            output: [],
            error: null,
            stack: [],
            heap: [],
            structures: null
        }
    ];

    class SimulatorAPI {
        constructor() {
            /** @type {string|null} ID de la sesión actual de simulación */
            this._sessionId = null;
            /** @type {WebSocket|null} Conexión WebSocket activa (modo streaming) */
            this._ws = null;
            /** @type {number} Índice del mock actual para nextStep() */
            this._mockStep = 0;
        }

        // ─── Getters ───────────────────────────────────────────────

        get sessionId() { return this._sessionId; }

        // ─── Compilación ───────────────────────────────────────────

        /**
         * Envía código C++ al backend para compilar.
         *
         * @param {string} code - Código fuente C++.
         * @returns {Promise<{success: boolean, sessionId: string, error?: {line: number, message: string}}>}
         */
        async compile(code) {
            // TODO: backend C++ — descomentar para producción:
            // const res = await fetch(`${API_BASE}/api/compile`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ code })
            // });
            // return await res.json();

            console.log('[API Mock] Compilando código...');
            this._mockStep = 0;

            return new Promise(resolve => {
                setTimeout(() => {
                    this._sessionId = 'mock-session-' + Date.now();
                    resolve({
                        success: true,
                        sessionId: this._sessionId
                    });
                }, 300);
            });
        }

        // ─── Paso a paso (REST) ────────────────────────────────────

        /**
         * Solicita el siguiente paso de ejecución vía REST.
         * Se usa cuando el usuario hace clic en "Paso".
         *
         * @returns {Promise<Object>} Snapshot de memoria con el formato del contrato.
         */
        async nextStep() {
            // TODO: backend C++ — descomentar para producción:
            // const res = await fetch(`${API_BASE}/api/step`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ sessionId: this._sessionId, step: this._mockStep })
            // });
            // return await res.json();

            console.log(`[API Mock] Ejecutando paso ${this._mockStep + 1}...`);

            return new Promise((resolve) => {
                setTimeout(() => {
                    if (this._mockStep >= MOCK_SNAPSHOTS.length) {
                        // Ya terminó — devolver el último snapshot con finished: true
                        resolve(MOCK_SNAPSHOTS[MOCK_SNAPSHOTS.length - 1]);
                        return;
                    }
                    const snapshot = MOCK_SNAPSHOTS[this._mockStep];
                    this._mockStep++;
                    resolve(snapshot);
                }, 200);
            });
        }

        // ─── Ejecución Streaming (WebSocket) ───────────────────────

        /**
         * Ejecuta el programa completo con animación continua.
         * En producción: abre un WebSocket y recibe snapshots en tiempo real.
         * En mock: simula la secuencia con setTimeout encadenados.
         *
         * @param {string} code       - Código fuente C++.
         * @param {Function} onSnapshot - Callback por cada snapshot recibido.
         * @param {Function} onDone     - Callback cuando la ejecución termina.
         * @param {Function} onError    - Callback en caso de error.
         */
        runStreaming(code, onSnapshot, onDone, onError) {
            // TODO: backend C++ — descomentar para producción:
            // try {
            //     this._ws = new WebSocket(WS_URL);
            //     this._ws.onopen = () => {
            //         this._ws.send(JSON.stringify({
            //             action: 'run',
            //             sessionId: this._sessionId,
            //             code: code
            //         }));
            //     };
            //     this._ws.onmessage = (event) => {
            //         const snapshot = JSON.parse(event.data);
            //         onSnapshot(snapshot);
            //         if (snapshot.finished) {
            //             this._ws.close();
            //             this._ws = null;
            //             onDone();
            //         }
            //     };
            //     this._ws.onerror = (err) => {
            //         onError(err);
            //         this._ws = null;
            //     };
            //     this._ws.onclose = () => { this._ws = null; };
            // } catch (err) {
            //     onError(err);
            // }

            // Mock: simular la secuencia de snapshots con setTimeout
            console.log('[API Mock] Iniciando ejecución streaming...');
            this._mockStep = 0;
            let cancelled = false;

            const sendNext = () => {
                if (cancelled) return;
                if (this._mockStep >= MOCK_SNAPSHOTS.length) {
                    onDone();
                    return;
                }

                const snapshot = MOCK_SNAPSHOTS[this._mockStep];
                this._mockStep++;
                console.log(`[API Mock] Streaming paso ${snapshot.step}...`);

                try {
                    onSnapshot(snapshot);
                } catch (err) {
                    onError(err);
                    return;
                }

                if (snapshot.finished) {
                    onDone();
                    return;
                }

                // Siguiente snapshot después de un delay (simula tiempo real)
                setTimeout(sendNext, 600);
            };

            // Comenzar después de un pequeño delay
            setTimeout(sendNext, 400);

            // Retornar función para cancelar (útil para Reset durante ejecución)
            return () => { cancelled = true; };
        }

        // ─── Reset ─────────────────────────────────────────────────

        /**
         * Resetea la sesión de simulación.
         * Cierra el WebSocket si está abierto.
         *
         * @returns {Promise<{success: boolean}>}
         */
        async reset() {
            // TODO: backend C++ — descomentar para producción:
            // if (this._sessionId) {
            //     await fetch(`${API_BASE}/api/reset`, {
            //         method: 'POST',
            //         headers: { 'Content-Type': 'application/json' },
            //         body: JSON.stringify({ sessionId: this._sessionId })
            //     });
            // }

            console.log('[API Mock] Reseteando simulación...');

            // Cerrar WebSocket si está activo
            if (this._ws) {
                this._ws.close();
                this._ws = null;
            }

            this._sessionId = null;
            this._mockStep = 0;

            return { success: true };
        }
    }

    // Exponer una instancia singleton
    return new SimulatorAPI();
})();
