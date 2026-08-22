// memoryState.js — Modelo de estado de memoria (patrón Modelo + Observer)
//
// ╔══════════════════════════════════════════════════════════════════╗
// ║  Rol: MODELO en la arquitectura Modelo/Vista/Controlador.      ║
// ║                                                                ║
// ║  Responsabilidades:                                            ║
// ║  - Mantener el estado de memoria (stack, heap) como Maps       ║
// ║    indexados por el `id` estable de cada bloque.               ║
// ║  - Recibir snapshots del backend vía applySnapshot().          ║
// ║  - Calcular el diff (added/updated/removed) contra el estado  ║
// ║    anterior — esto es lo que hace posible las actualizaciones  ║
// ║    incrementales del DOM en lugar de reconstruir todo.         ║
// ║  - Notificar a suscriptores (Vistas) cuando el estado cambia. ║
// ║  - NO toca el DOM — es puro modelo de datos.                  ║
// ║                                                                ║
// ║  Patrón Observer: las Vistas se suscriben con subscribe(cb)   ║
// ║  y reciben un objeto evento con los diffs de stack y heap.    ║
// ╚══════════════════════════════════════════════════════════════════╝

window.MemoryState = (function () {
    'use strict';

    /**
     * Campos del bloque que se comparan para detectar cambios.
     * Si cualquiera de estos difiere entre el bloque anterior y el nuevo,
     * el bloque se reporta como "updated" en el diff.
     */
    const COMPARABLE_FIELDS = ['value', 'type', 'name', 'address', 'status', 'pointsTo', 'frame'];

    class MemoryState {
        constructor() {
            /** @type {Map<string, Object>} Bloques de stack indexados por id */
            this._stackMap = new Map();
            /** @type {Map<string, Object>} Bloques de heap indexados por id */
            this._heapMap = new Map();
            /** @type {Function[]} Callbacks suscritos al patrón Observer */
            this._subscribers = [];

            // Metadatos del snapshot actual
            this._step = 0;
            this._currentLine = 0;
            this._finished = false;
            this._output = [];
            this._error = null;
            this._structures = null;
        }

        // ─── Getters ───────────────────────────────────────────────────
        get step()       { return this._step; }
        get currentLine(){ return this._currentLine; }
        get finished()   { return this._finished; }
        get output()     { return this._output; }
        get error()      { return this._error; }
        get structures() { return this._structures; }
        get stackMap()   { return this._stackMap; }
        get heapMap()    { return this._heapMap; }

        // ─── Observer Pattern ──────────────────────────────────────────

        /**
         * Suscribe un callback que será llamado cada vez que el estado cambie.
         * @param {Function} callback - Recibe un objeto evento con los diffs.
         */
        subscribe(callback) {
            if (typeof callback === 'function' && !this._subscribers.includes(callback)) {
                this._subscribers.push(callback);
            }
        }

        /**
         * Elimina un callback previamente suscrito.
         * @param {Function} callback
         */
        unsubscribe(callback) {
            this._subscribers = this._subscribers.filter(cb => cb !== callback);
        }

        /**
         * Notifica a todos los suscriptores con el evento dado.
         * Envuelve cada llamada en try/catch para que un error en un
         * suscriptor no rompa la cadena de notificaciones.
         * @param {Object} event
         * @private
         */
        _notify(event) {
            for (const cb of this._subscribers) {
                try {
                    cb(event);
                } catch (err) {
                    console.error('[MemoryState] Error en suscriptor:', err);
                }
            }
        }

        // ─── Core: Aplicar Snapshot y Calcular Diffs ───────────────────

        /**
         * Recibe un snapshot completo del backend y calcula los diffs
         * contra el estado anterior para stack y heap.
         *
         * @param {Object} snapshot - Snapshot con el formato del contrato de datos.
         * @returns {{ stackDiff: Object, heapDiff: Object }} Los diffs calculados.
         */
        applySnapshot(snapshot) {
            // Actualizar metadatos
            this._step        = snapshot.step        ?? this._step;
            this._currentLine = snapshot.currentLine ?? this._currentLine;
            this._finished    = snapshot.finished    ?? false;
            this._error       = snapshot.error       ?? null;
            this._structures  = snapshot.structures  ?? null;

            // Acumular output (cada snapshot puede traer nuevas líneas)
            if (Array.isArray(snapshot.output)) {
                this._output = this._output.concat(snapshot.output);
            }

            // Calcular diffs para stack y heap
            const stackDiff = this._computeDiff(this._stackMap, snapshot.stack || []);
            const heapDiff  = this._computeDiff(this._heapMap,  snapshot.heap  || []);

            // Notificar a las Vistas
            const event = {
                step:        this._step,
                currentLine: this._currentLine,
                finished:    this._finished,
                output:      snapshot.output || [],
                error:       this._error,
                structures:  this._structures,
                stackDiff,
                heapDiff
            };
            this._notify(event);

            return { stackDiff, heapDiff };
        }

        /**
         * Compara el estado actual de un Map con un nuevo array de bloques.
         * Calcula qué bloques fueron added, updated, o removed.
         *
         * IMPORTANTE: Modifica el Map in-place para reflejar el nuevo estado.
         *
         * @param {Map<string, Object>} currentMap - Estado actual.
         * @param {Object[]} newBlocks - Nuevos bloques del snapshot.
         * @returns {{ added: Object[], updated: Object[], removed: Object[] }}
         * @private
         */
        _computeDiff(currentMap, newBlocks) {
            const diff = { added: [], updated: [], removed: [] };
            const newIds = new Set();

            // Recorrer los nuevos bloques
            for (const block of newBlocks) {
                newIds.add(block.id);
                const existing = currentMap.get(block.id);

                if (!existing) {
                    // Bloque nuevo — no existía antes
                    diff.added.push(block);
                    currentMap.set(block.id, { ...block });
                } else {
                    // Bloque existente — verificar si cambió
                    const changes = this._getChanges(existing, block);
                    if (changes) {
                        diff.updated.push({ ...block, _changes: changes });
                        currentMap.set(block.id, { ...block });
                    }
                    // Si no cambió, no se reporta (no hay nada que actualizar en el DOM)
                }
            }

            // Encontrar bloques removidos (estaban en el Map pero ya no en el snapshot)
            for (const [id, block] of currentMap) {
                if (!newIds.has(id)) {
                    diff.removed.push(block);
                    currentMap.delete(id);
                }
            }

            return diff;
        }

        /**
         * Compara dos versiones de un bloque campo por campo.
         * @param {Object} oldBlock
         * @param {Object} newBlock
         * @returns {Object|null} Objeto con los campos que cambiaron, o null si no hay cambios.
         * @private
         */
        _getChanges(oldBlock, newBlock) {
            const changes = {};
            let hasChanges = false;

            for (const field of COMPARABLE_FIELDS) {
                if (oldBlock[field] !== newBlock[field]) {
                    changes[field] = { from: oldBlock[field], to: newBlock[field] };
                    hasChanges = true;
                }
            }

            return hasChanges ? changes : null;
        }

        // ─── Reset ─────────────────────────────────────────────────────

        /**
         * Limpia todo el estado y notifica a los suscriptores.
         * Se llama cuando el usuario presiona "Reset".
         */
        reset() {
            this._stackMap.clear();
            this._heapMap.clear();
            this._step = 0;
            this._currentLine = 0;
            this._finished = false;
            this._output = [];
            this._error = null;
            this._structures = null;

            this._notify({
                step: 0,
                currentLine: 0,
                finished: false,
                output: [],
                error: null,
                structures: null,
                stackDiff: { added: [], updated: [], removed: [] },
                heapDiff:  { added: [], updated: [], removed: [] },
                reset: true
            });
        }
    }

    return MemoryState;
})();
