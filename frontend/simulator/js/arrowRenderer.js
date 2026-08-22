// arrowRenderer.js — Vista de flechas de punteros (Stack -> Heap)
//
// ╔══════════════════════════════════════════════════════════════════╗
// ║  Rol: VISTA en la arquitectura Modelo/Vista/Controlador.       ║
// ║                                                                ║
// ║  Responsabilidades:                                            ║
// ║  - Dibuja flechas SVG desde bloques de Stack hacia Heap.       ║
// ║  - Utiliza un único overlay SVG (#pointers-overlay).           ║
// ║  - Mantiene un Map<arrowId, SVGPathElement> para hacer diff.   ║
// ║  - Evita layout thrashing leyendo todas las coordenadas con    ║
// ║    getBoundingClientRect() en un solo batch ANTES de escribir. ║
// ║  - Identifica punteros "dangling" (Use-After-Free) y los       ║
// ║    dibuja con clase especial .arrow-dangling.                  ║
// ╚══════════════════════════════════════════════════════════════════╝

window.ArrowRenderer = (function () {
    'use strict';

    class ArrowRenderer {
        constructor(overlayId) {
            this._overlayId = overlayId;
            this._overlay = null;
            /** @type {Map<string, SVGPathElement>} Caché de nodos SVG indexados por arrowId */
            this._arrowMap = new Map();
        }

        _getOverlay() {
            if (!this._overlay) {
                this._overlay = document.getElementById(this._overlayId);
            }
            return this._overlay;
        }

        /**
         * Reconcilia el estado de las flechas basado en el estado actual de la memoria.
         * Se llama desde execution.js en cada notificación de MemoryState.
         *
         * @param {Map<string, Object>} stackMap - Estado completo actual del stack
         * @param {Map<string, Object>} heapMap - Estado completo actual del heap
         */
        render(stackMap, heapMap) {
            const overlay = this._getOverlay();
            if (!overlay) return;

            // 1. Identificar las flechas necesarias (basadas en pointsTo del stack)
            const newArrowStates = new Map();

            for (const [stackId, block] of stackMap.entries()) {
                if (block.pointsTo) {
                    const targetId = block.pointsTo;
                    const arrowId = `${stackId}->${targetId}`;
                    const targetBlock = heapMap.get(targetId);
                    
                    // Es dangling si el destino no existe en el Map o si su status es 'freed'
                    const isDangling = !targetBlock || targetBlock.status === 'freed';
                    newArrowStates.set(arrowId, { sourceId: stackId, targetId, isDangling });
                }
            }

            // 2. Calcular Diff (added, updated, removed)
            const added = [];
            const updated = [];
            const removed = [];

            for (const [arrowId, state] of newArrowStates.entries()) {
                if (!this._arrowMap.has(arrowId)) {
                    added.push({ arrowId, ...state });
                } else {
                    updated.push({ arrowId, ...state });
                }
            }

            for (const arrowId of this._arrowMap.keys()) {
                if (!newArrowStates.has(arrowId)) {
                    removed.push(arrowId);
                }
            }

            // 3. Remover las eliminadas (con animación)
            for (const arrowId of removed) {
                const path = this._arrowMap.get(arrowId);
                if (path) {
                    path.classList.remove('arrow-entering');
                    path.classList.add('arrow-exiting');
                    path.addEventListener('animationend', () => {
                        // Verifica que no se haya re-agregado rápidamente
                        if (this._arrowMap.has(arrowId) === false && path.parentNode) {
                            path.remove();
                        }
                    }, { once: true });
                    
                    // Fallback de seguridad
                    setTimeout(() => { 
                        if (this._arrowMap.has(arrowId) === false && path.parentNode) {
                            path.remove(); 
                        }
                    }, 400);

                    this._arrowMap.delete(arrowId);
                }
            }

            // 4. Batch READ: Leer coordenadas DOM sin escribir nada todavía
            const toUpdate = [...added, ...updated];
            if (toUpdate.length === 0) return;

            const overlayRect = overlay.getBoundingClientRect();
            const rectCache = new Map();
            const pathCoords = new Map();

            const getBlockRect = (id) => {
                if (rectCache.has(id)) return rectCache.get(id);
                // Buscar el nodo en el DOM (ya actualizado previamente por BlockRenderer)
                const el = document.querySelector(`[data-block-id="${id}"]`);
                if (el) {
                    const r = el.getBoundingClientRect();
                    rectCache.set(id, r);
                    return r;
                }
                return null;
            };

            for (const arrow of toUpdate) {
                const sourceRect = getBlockRect(arrow.sourceId);
                const targetRect = getBlockRect(arrow.targetId);
                
                // Si el origen fue eliminado del DOM, no podemos dibujar su flecha
                if (!sourceRect) continue;

                // Coordenadas relativas al overlay SVG
                const startX = sourceRect.right - overlayRect.left;
                const startY = sourceRect.top + sourceRect.height / 2 - overlayRect.top;

                let targetX, targetY;
                if (targetRect) {
                    // El destino está en el DOM (vivo o con clase freed)
                    targetX = targetRect.left - overlayRect.left;
                    targetY = targetRect.top + targetRect.height / 2 - overlayRect.top;
                } else {
                    // Dangling puro: el bloque de heap ya desapareció del DOM
                    // Dibujamos una flecha que apunte al vacío hacia la derecha
                    targetX = startX + 150;
                    targetY = startY;
                }

                // Generar trayectoria de curva Bezier (C) suave
                const offset = Math.max(50, Math.abs(targetX - startX) / 2);
                const d = `M ${startX} ${startY} C ${startX + offset} ${startY}, ${targetX - offset} ${targetY}, ${targetX} ${targetY}`;
                pathCoords.set(arrow.arrowId, d);
            }

            // 5. Batch WRITE: Escribir atributos y mutar el DOM
            const svgNS = 'http://www.w3.org/2000/svg';
            
            for (const arrow of added) {
                const d = pathCoords.get(arrow.arrowId);
                if (!d) continue; // origen no encontrado

                const path = document.createElementNS(svgNS, 'path');
                path.setAttribute('d', d);
                // Asignar clase base usando classList
                path.classList.add('pointer-arrow', 'arrow-entering');
                
                if (arrow.isDangling) {
                    path.classList.add('arrow-dangling');
                }

                overlay.appendChild(path);
                this._arrowMap.set(arrow.arrowId, path);
            }

            for (const arrow of updated) {
                const d = pathCoords.get(arrow.arrowId);
                if (!d) continue;

                const path = this._arrowMap.get(arrow.arrowId);
                path.setAttribute('d', d);
                path.classList.remove('arrow-entering'); // evitar reiniciar animación
                
                // Actualizar estilo si cambió su estado dangling
                if (arrow.isDangling) {
                    path.classList.add('arrow-dangling');
                } else {
                    path.classList.remove('arrow-dangling');
                }
            }
        }

        /**
         * Limpia todas las flechas (útil para el Reset).
         */
        clear() {
            const overlay = this._getOverlay();
            if (overlay) {
                // Seleccionar y eliminar solo los <path> creados, 
                // preservando el <defs> interno.
                const paths = overlay.querySelectorAll('path');
                paths.forEach(p => p.remove());
            }
            this._arrowMap.clear();
        }
    }

    return ArrowRenderer;
})();
