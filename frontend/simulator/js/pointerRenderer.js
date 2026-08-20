// pointerRenderer.js — Renderiza flechas SVG para punteros

window.PointerRenderer = (function () {
    'use strict';

    class PointerRenderer {
        /**
         * @param {string} svgId - ID del <svg> overlay.
         * @param {MemoryState} memoryState - Instancia del modelo.
         */
        constructor(svgId, memoryState) {
            this.svg = document.getElementById(svgId);
            this.memoryState = memoryState;
            
            if (!this.svg) {
                console.warn('PointerRenderer: No se encontró el SVG con id ' + svgId);
            }

            // Redibujar cuando la ventana cambie de tamaño
            window.addEventListener('resize', () => this.draw());
        }

        /**
         * Limpia todas las flechas (excepto <defs>).
         */
        clear() {
            if (!this.svg) return;
            // Mantener solo el <defs>
            const defs = this.svg.querySelector('defs');
            this.svg.innerHTML = '';
            if (defs) {
                this.svg.appendChild(defs);
            }
        }

        /**
         * Calcula y dibuja las flechas según el estado actual.
         */
        draw() {
            if (!this.svg || !this.memoryState) return;
            
            this.clear();

            // Asegurarnos de que el layout del navegador esté listo
            requestAnimationFrame(() => {
                const stackBlocks = Array.from(this.memoryState.stack.values());
                const heapBlocks = Array.from(this.memoryState.heap.values());
                const allBlocks = [...stackBlocks, ...heapBlocks];

                // Buscar bloques que tengan un 'pointsTo'
                const pointers = allBlocks.filter(b => b.pointsTo);

                for (const pointer of pointers) {
                    const targetId = pointer.pointsTo;
                    const sourceEl = document.getElementById('block-' + pointer.id);
                    const targetEl = document.getElementById('block-' + targetId);

                    if (sourceEl && targetEl) {
                        this._drawArrow(sourceEl, targetEl);
                    }
                }
            });
        }

        _drawArrow(sourceEl, targetEl) {
            const svgRect = this.svg.getBoundingClientRect();
            const srcRect = sourceEl.getBoundingClientRect();
            const tgtRect = targetEl.getBoundingClientRect();

            // Calcular puntos relativos al SVG
            const startX = srcRect.right - svgRect.left;
            const startY = srcRect.top + (srcRect.height / 2) - svgRect.top;

            let endX = tgtRect.left - svgRect.left;
            let endY = tgtRect.top + (tgtRect.height / 2) - svgRect.top;

            // Si el bloque destino está a la izquierda (ej: pointer a algo del stack), apuntar al lado derecho
            if (startX > endX) {
                endX = tgtRect.right - svgRect.left;
            }

            // Puntos de control para curva Bezier
            let controlPointX1 = startX + (endX - startX) * 0.5;
            let controlPointY1 = startY;
            let controlPointX2 = startX + (endX - startX) * 0.5;
            let controlPointY2 = endY;
            
            // Ajustar si la flecha va hacia la izquierda
            if (startX > endX) {
                controlPointX1 = startX + 50;
                controlPointX2 = endX + 50;
            }

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const d = \M \ \ C \ \, \ \, \ \\;
            
            path.setAttribute('d', d);
            path.setAttribute('class', 'pointer-arrow');

            this.svg.appendChild(path);
        }
    }

    return PointerRenderer;
})();
