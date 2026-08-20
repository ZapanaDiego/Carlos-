// blockRenderer.js — Vista de bloques de memoria (patrón Vista)
//
// ╔══════════════════════════════════════════════════════════════════╗
// ║  Rol: VISTA en la arquitectura Modelo/Vista/Controlador.       ║
// ║                                                                ║
// ║  Responsabilidades:                                            ║
// ║  - Recibir diffs del MemoryState y aplicarlos al DOM.          ║
// ║  - Crear elementos DOM solo para bloques nuevos (added).       ║
// ║  - Actualizar solo el texto que cambió (updated), reutilizando ║
// ║    el nodo DOM existente — esto evita recrear todo el DOM.     ║
// ║  - Animar y eliminar bloques removidos (removed).              ║
// ║  - Mantener un Map<id, HTMLElement> como caché de nodos DOM.   ║
// ║  - NO calcula diffs ni mantiene estado de datos — solo         ║
// ║    renderiza lo que el Modelo le indica.                       ║
// ║                                                                ║
// ║  Reutiliza las clases CSS existentes en memory.css:            ║
// ║  .memory-block, .block-name, .block-type, .block-value,       ║
// ║  .block-address                                                ║
// ╚══════════════════════════════════════════════════════════════════╝

window.BlockRenderer = (function () {
    'use strict';

    /** Duración máxima de la animación de removing (ms). Fallback si animationend no se dispara. */
    const REMOVE_ANIMATION_TIMEOUT = 500;

    class BlockRenderer {
        /**
         * @param {string} containerId - ID del contenedor DOM (e.g. 'stack-blocks', 'heap-blocks').
         * @param {string} cssClass    - Clase CSS de sección: 'stack' o 'heap'.
         */
        constructor(containerId, cssClass) {
            this._containerId = containerId;
            this._cssClass = cssClass;
            /** @type {HTMLElement|null} Referencia cacheada al contenedor DOM. */
            this._container = null;
            /** @type {Map<string, HTMLElement>} Caché de nodos DOM indexados por block id. */
            this._elementMap = new Map();
        }

        /**
         * Obtiene el contenedor DOM, cacheando la referencia para evitar
         * llamadas repetidas a getElementById.
         * @returns {HTMLElement|null}
         * @private
         */
        _getContainer() {
            if (!this._container) {
                this._container = document.getElementById(this._containerId);
            }
            return this._container;
        }

        // ─── Creación de Elementos ─────────────────────────────────────

        /**
         * Crea un elemento DOM para un bloque de memoria.
         * Usa la misma estructura HTML que ya define memory.css.
         * @param {Object} block - Datos del bloque del snapshot.
         * @returns {HTMLElement}
         * @private
         */
        _createBlockElement(block) {
            const div = document.createElement('div');
            div.className = `memory-block ${this._cssClass} fade-in`;
            div.dataset.blockId = block.id;

            // Badge de dirección (posición absoluta arriba-derecha)
            const addressSpan = document.createElement('span');
            addressSpan.className = 'block-address';
            addressSpan.textContent = block.address || '';
            div.appendChild(addressSpan);

            // Etiqueta de frame (solo para bloques de stack con info de frame)
            if (block.frame) {
                const frameDiv = document.createElement('div');
                frameDiv.className = 'block-frame';
                frameDiv.textContent = block.frame;
                div.appendChild(frameDiv);
            }

            // Nombre de la variable
            const nameDiv = document.createElement('div');
            nameDiv.className = 'block-name';
            nameDiv.textContent = block.name || block.id;
            div.appendChild(nameDiv);

            // Tipo C++
            const typeDiv = document.createElement('div');
            typeDiv.className = 'block-type';
            typeDiv.textContent = block.type || '';
            div.appendChild(typeDiv);

            // Valor actual
            const valueDiv = document.createElement('div');
            valueDiv.className = 'block-value';
            valueDiv.textContent = block.value || '';
            div.appendChild(valueDiv);

            // Estado: si es heap y está liberado, marcar visualmente
            if (block.status === 'freed') {
                div.classList.add('block-freed');
            }

            return div;
        }

        // ─── Aplicación de Diffs ───────────────────────────────────────

        /**
         * Aplica un diff recibido del MemoryState al DOM.
         *
         * Esta es la función central de la Vista: en lugar de hacer
         * innerHTML = '' y reconstruir todo, solo toca los nodos
         * que realmente cambiaron.
         *
         * @param {{ added: Object[], updated: Object[], removed: Object[] }} diff
         */
        applyDiff(diff) {
            const container = this._getContainer();
            if (!container) {
                console.warn(`[BlockRenderer] Contenedor #${this._containerId} no encontrado`);
                return;
            }

            // 1. ADDED: crear nodos DOM nuevos
            for (const block of diff.added) {
                const el = this._createBlockElement(block);
                container.appendChild(el);
                this._elementMap.set(block.id, el);
            }

            // 2. UPDATED: reutilizar nodo existente, solo cambiar texto
            for (const block of diff.updated) {
                const el = this._elementMap.get(block.id);
                if (!el) continue;

                this._updateBlockElement(el, block);
            }

            // 3. REMOVED: animar fade-out y luego eliminar del DOM
            for (const block of diff.removed) {
                this._removeBlockElement(block.id);
            }
        }

        /**
         * Actualiza los campos de texto de un elemento DOM existente.
         * Solo modifica los campos que realmente cambiaron.
         * Agrega la clase .value-changed temporalmente para animar el cambio.
         *
         * @param {HTMLElement} el - Nodo DOM del bloque.
         * @param {Object} block - Datos nuevos del bloque.
         * @private
         */
        _updateBlockElement(el, block) {
            // Actualizar dirección
            const addressEl = el.querySelector('.block-address');
            if (addressEl) addressEl.textContent = block.address || '';

            // Actualizar nombre
            const nameEl = el.querySelector('.block-name');
            if (nameEl) nameEl.textContent = block.name || block.id;

            // Actualizar tipo
            const typeEl = el.querySelector('.block-type');
            if (typeEl) typeEl.textContent = block.type || '';

            // Actualizar valor — con animación si cambió
            const valueEl = el.querySelector('.block-value');
            if (valueEl) {
                const oldValue = valueEl.textContent;
                const newValue = block.value || '';
                valueEl.textContent = newValue;

                if (oldValue !== newValue) {
                    this._animateFlash(valueEl);
                }
            }

            // Manejar estado freed/alive para bloques heap
            if (block.status === 'freed' && !el.classList.contains('block-freed')) {
                el.classList.add('block-freed');
                this._animateFlash(el);
            } else if (block.status !== 'freed') {
                el.classList.remove('block-freed');
            }
        }

        /**
         * Agrega la clase .value-changed temporalmente para disparar
         * la animación CSS highlightPulse, y la remueve al terminar.
         *
         * @param {HTMLElement} el
         * @private
         */
        _animateFlash(el) {
            // Remover primero por si ya está animando (reiniciar animación)
            el.classList.remove('value-changed');
            // Forzar reflow para reiniciar la animación CSS
            void el.offsetWidth;
            el.classList.add('value-changed');
            el.addEventListener('animationend', () => {
                el.classList.remove('value-changed');
            }, { once: true });
        }

        /**
         * Anima la remoción de un bloque y lo elimina del DOM tras la animación.
         * Incluye un fallback con setTimeout en caso de que animationend no se dispare.
         *
         * @param {string} blockId
         * @private
         */
        _removeBlockElement(blockId) {
            const el = this._elementMap.get(blockId);
            if (!el) return;

            el.classList.add('removing');
            const cleanup = () => {
                if (this._elementMap.has(blockId)) {
                    el.remove();
                    this._elementMap.delete(blockId);
                }
            };

            el.addEventListener('animationend', cleanup, { once: true });

            // Fallback: si animationend no se dispara (sin animación CSS definida),
            // eliminar después de un timeout razonable.
            setTimeout(cleanup, REMOVE_ANIMATION_TIMEOUT);
        }

        // ─── Reset ─────────────────────────────────────────────────────

        /**
         * Limpia todos los bloques del contenedor y la caché interna.
         * Se usa cuando el usuario presiona "Reset".
         */
        clear() {
            const container = this._getContainer();
            if (container) {
                container.innerHTML = '';
            }
            this._elementMap.clear();
        }
    }

    return BlockRenderer;
})();
