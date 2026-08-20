// structureRenderer.js — Vista de estructuras de datos (patrón Vista + Strategy)
//
// ╔══════════════════════════════════════════════════════════════════╗
// ║  Rol: VISTA en la arquitectura Modelo/Vista/Controlador.       ║
// ║                                                                ║
// ║  Responsabilidades:                                            ║
// ║  - Renderizar estructuras de datos (grafos, listas, árboles)   ║
// ║    cuando el snapshot incluye el campo `structures`.           ║
// ║  - Seleccionar automáticamente la estrategia de renderizado:   ║
// ║    • SVG inline si nodes.length <= 60 (inspectable, accesible) ║
// ║    • Canvas 2D si nodes.length > 60 (rendimiento)              ║
// ║  - Para Canvas, incluye un Quadtree ligero para hit-testing.   ║
// ║  - El layout de posiciones es una función intercambiable       ║
// ║    (Strategy pattern) — por ahora circular y grid.             ║
// ║                                                                ║
// ║  Patrón Strategy:                                              ║
// ║  setLayoutStrategy(fn) donde fn tiene la firma:                ║
// ║    (nodes, edges, width, height) → Map<nodeId, {x, y}>        ║
// ╚══════════════════════════════════════════════════════════════════╝

window.StructureRenderer = (function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // Quadtree — Implementación ligera para hit-testing en Canvas
    // ═══════════════════════════════════════════════════════════════

    /**
     * Rectángulo delimitador para el Quadtree.
     */
    class Rect {
        constructor(x, y, w, h) {
            this.x = x; // centro X
            this.y = y; // centro Y
            this.w = w; // mitad del ancho
            this.h = h; // mitad del alto
        }

        contains(point) {
            return (
                point.x >= this.x - this.w &&
                point.x <= this.x + this.w &&
                point.y >= this.y - this.h &&
                point.y <= this.y + this.h
            );
        }

        intersects(range) {
            return !(
                range.x - range.w > this.x + this.w ||
                range.x + range.w < this.x - this.w ||
                range.y - range.h > this.y + this.h ||
                range.y + range.h < this.y - this.h
            );
        }
    }

    /**
     * Quadtree para búsqueda espacial eficiente de nodos.
     * Se usa para hit-testing de clics en el modo Canvas.
     *
     * Complejidad de búsqueda: O(log n) promedio vs O(n) lineal.
     */
    class QuadTree {
        /**
         * @param {Rect} boundary - Límites de este cuadrante.
         * @param {number} capacity - Máximo de puntos antes de subdividir.
         */
        constructor(boundary, capacity = 4) {
            this.boundary = boundary;
            this.capacity = capacity;
            this.points = [];
            this.divided = false;
            this.ne = null;
            this.nw = null;
            this.se = null;
            this.sw = null;
        }

        subdivide() {
            const { x, y, w, h } = this.boundary;
            const hw = w / 2;
            const hh = h / 2;
            this.ne = new QuadTree(new Rect(x + hw, y - hh, hw, hh), this.capacity);
            this.nw = new QuadTree(new Rect(x - hw, y - hh, hw, hh), this.capacity);
            this.se = new QuadTree(new Rect(x + hw, y + hh, hw, hh), this.capacity);
            this.sw = new QuadTree(new Rect(x - hw, y + hh, hw, hh), this.capacity);
            this.divided = true;
        }

        /**
         * Inserta un punto en el Quadtree.
         * @param {{ x: number, y: number, data: Object }} point
         * @returns {boolean}
         */
        insert(point) {
            if (!this.boundary.contains(point)) return false;

            if (this.points.length < this.capacity) {
                this.points.push(point);
                return true;
            }

            if (!this.divided) this.subdivide();

            return (
                this.ne.insert(point) ||
                this.nw.insert(point) ||
                this.se.insert(point) ||
                this.sw.insert(point)
            );
        }

        /**
         * Busca todos los puntos dentro de un rango rectangular.
         * @param {Rect} range
         * @param {Array} found
         * @returns {Array}
         */
        query(range, found = []) {
            if (!this.boundary.intersects(range)) return found;

            for (const p of this.points) {
                if (range.contains(p)) found.push(p);
            }

            if (this.divided) {
                this.ne.query(range, found);
                this.nw.query(range, found);
                this.se.query(range, found);
                this.sw.query(range, found);
            }

            return found;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Layout Strategies (intercambiables vía Strategy pattern)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Layout circular: posiciona los nodos en un círculo.
     * Bueno para grafos generales donde no hay jerarquía.
     *
     * @param {Object[]} nodes  - Array de nodos { id, label, ... }
     * @param {Object[]} edges  - Array de aristas { from, to }
     * @param {number} width    - Ancho disponible en píxeles.
     * @param {number} height   - Alto disponible en píxeles.
     * @returns {Map<string, {x: number, y: number}>} Posiciones de cada nodo por id.
     */
    function circularLayout(nodes, edges, width, height) {
        const positions = new Map();
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.min(width, height) * 0.38;
        const n = nodes.length;

        if (n === 0) return positions;
        if (n === 1) {
            positions.set(nodes[0].id, { x: cx, y: cy });
            return positions;
        }

        for (let i = 0; i < n; i++) {
            const angle = (2 * Math.PI * i) / n - Math.PI / 2;
            positions.set(nodes[i].id, {
                x: cx + radius * Math.cos(angle),
                y: cy + radius * Math.sin(angle)
            });
        }

        return positions;
    }

    /**
     * Layout grid: posiciona los nodos en una cuadrícula.
     * Bueno para tablas hash y arreglos.
     *
     * @param {Object[]} nodes
     * @param {Object[]} edges
     * @param {number} width
     * @param {number} height
     * @returns {Map<string, {x: number, y: number}>}
     */
    function gridLayout(nodes, edges, width, height) {
        const positions = new Map();
        const n = nodes.length;
        if (n === 0) return positions;

        const cols = Math.ceil(Math.sqrt(n));
        const rows = Math.ceil(n / cols);
        const cellW = width / (cols + 1);
        const cellH = height / (rows + 1);

        for (let i = 0; i < n; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            positions.set(nodes[i].id, {
                x: cellW * (col + 1),
                y: cellH * (row + 1)
            });
        }

        return positions;
    }

    // ═══════════════════════════════════════════════════════════════
    // StructureRenderer
    // ═══════════════════════════════════════════════════════════════

    /** Umbral de nodos para decidir entre SVG y Canvas */
    const SVG_THRESHOLD = 60;
    /** Radio de los nodos en la visualización */
    const NODE_RADIUS = 20;
    /** Radio de hit-testing para clics en Canvas */
    const HIT_RADIUS = 25;

    // Colores del sistema de diseño (coinciden con variables.css)
    const COLORS = {
        nodeFill:    '#21262d',
        nodeStroke:  '#58a6ff',
        edgeStroke:  '#8b949e',
        labelFill:   '#e6edf3',
        arrowHead:   '#8b949e',
        hoverFill:   '#30363d'
    };

    class StructureRenderer {
        /**
         * @param {string} containerId - ID del contenedor DOM para las estructuras.
         */
        constructor(containerId) {
            this._containerId = containerId;
            this._container = null;
            /** @type {Function} Estrategia de layout actual (Strategy pattern) */
            this._layoutStrategy = circularLayout;
            /** @type {QuadTree|null} Quadtree para hit-testing en modo Canvas */
            this._quadTree = null;
            /** @type {Map<string, Object>|null} Nodos actuales para referencia en hit-testing */
            this._currentNodes = null;
            /** @type {HTMLCanvasElement|null} Canvas actual (si está en modo Canvas) */
            this._canvas = null;
        }

        /**
         * Obtiene el contenedor DOM.
         * @returns {HTMLElement|null}
         * @private
         */
        _getContainer() {
            if (!this._container) {
                this._container = document.getElementById(this._containerId);
            }
            return this._container;
        }

        // ─── Strategy Pattern ──────────────────────────────────────────

        /**
         * Cambia la estrategia de layout.
         * @param {Function} strategyFn - Función con firma (nodes, edges, w, h) → Map<id, {x,y}>
         */
        setLayoutStrategy(strategyFn) {
            if (typeof strategyFn === 'function') {
                this._layoutStrategy = strategyFn;
            }
        }

        /**
         * Devuelve las estrategias de layout disponibles.
         * @returns {{ circular: Function, grid: Function }}
         */
        static get layouts() {
            return { circular: circularLayout, grid: gridLayout };
        }

        // ─── Renderizado Principal ─────────────────────────────────────

        /**
         * Renderiza un array de estructuras.
         * Cada estructura puede tener distinto kind (graph, list, tree, etc.)
         *
         * @param {Object[]} structures - Array de estructuras del snapshot.
         */
        render(structures) {
            const container = this._getContainer();
            if (!container) {
                console.warn(`[StructureRenderer] Contenedor #${this._containerId} no encontrado`);
                return;
            }

            // Limpiar contenedor
            container.innerHTML = '';
            container.style.display = 'block';

            if (!structures || structures.length === 0) {
                container.style.display = 'none';
                return;
            }

            for (const struct of structures) {
                const wrapper = document.createElement('div');
                wrapper.className = 'structure-wrapper';

                // Título de la estructura
                const title = document.createElement('h4');
                title.className = 'structure-title';
                title.textContent = `${struct.kind || 'structure'}: ${struct.id}`;
                wrapper.appendChild(title);

                // Contenedor para la visualización
                const vizContainer = document.createElement('div');
                vizContainer.className = 'structure-viz';
                wrapper.appendChild(vizContainer);

                container.appendChild(wrapper);

                // Decidir SVG vs Canvas según número de nodos
                const nodes = struct.nodes || [];
                const edges = struct.edges || [];

                if (nodes.length <= SVG_THRESHOLD) {
                    this._renderSVG(vizContainer, nodes, edges);
                } else {
                    this._renderCanvas(vizContainer, nodes, edges);
                }
            }
        }

        // ─── SVG Rendering (≤60 nodos) ────────────────────────────────

        /**
         * Renderiza una estructura como SVG inline.
         * Ventajas: cada nodo y arista es un elemento DOM real,
         * fácil de inspeccionar, estilizar con CSS, y hacer hover.
         *
         * @param {HTMLElement} container
         * @param {Object[]} nodes
         * @param {Object[]} edges
         * @private
         */
        _renderSVG(container, nodes, edges) {
            const width = container.clientWidth || 400;
            const height = Math.max(300, nodes.length * 8);

            const svgNS = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(svgNS, 'svg');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', height);
            svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
            svg.classList.add('structure-svg');

            // Definir marcador de flecha
            const defs = document.createElementNS(svgNS, 'defs');
            const marker = document.createElementNS(svgNS, 'marker');
            marker.setAttribute('id', 'struct-arrowhead');
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '7');
            marker.setAttribute('refX', '10');
            marker.setAttribute('refY', '3.5');
            marker.setAttribute('orient', 'auto');
            const polygon = document.createElementNS(svgNS, 'polygon');
            polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
            polygon.setAttribute('fill', COLORS.arrowHead);
            marker.appendChild(polygon);
            defs.appendChild(marker);
            svg.appendChild(defs);

            // Calcular posiciones con la estrategia actual
            const positions = this._layoutStrategy(nodes, edges, width, height);

            // Dibujar aristas primero (debajo de los nodos)
            for (const edge of edges) {
                const fromPos = positions.get(edge.from);
                const toPos = positions.get(edge.to);
                if (!fromPos || !toPos) continue;

                // Calcular punto en el borde del nodo destino (no en el centro)
                const dx = toPos.x - fromPos.x;
                const dy = toPos.y - fromPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist === 0) continue;

                const targetX = toPos.x - (dx / dist) * NODE_RADIUS;
                const targetY = toPos.y - (dy / dist) * NODE_RADIUS;

                const line = document.createElementNS(svgNS, 'line');
                line.setAttribute('x1', fromPos.x);
                line.setAttribute('y1', fromPos.y);
                line.setAttribute('x2', targetX);
                line.setAttribute('y2', targetY);
                line.setAttribute('stroke', COLORS.edgeStroke);
                line.setAttribute('stroke-width', '2');
                line.setAttribute('marker-end', 'url(#struct-arrowhead)');
                line.classList.add('structure-edge');

                // Etiqueta de arista (si tiene)
                if (edge.label) {
                    const midX = (fromPos.x + toPos.x) / 2;
                    const midY = (fromPos.y + toPos.y) / 2;
                    const text = document.createElementNS(svgNS, 'text');
                    text.setAttribute('x', midX);
                    text.setAttribute('y', midY - 5);
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('fill', COLORS.edgeStroke);
                    text.setAttribute('font-size', '10');
                    text.textContent = edge.label;
                    svg.appendChild(text);
                }

                svg.appendChild(line);
            }

            // Dibujar nodos
            for (const node of nodes) {
                const pos = positions.get(node.id);
                if (!pos) continue;

                const g = document.createElementNS(svgNS, 'g');
                g.classList.add('structure-node');
                g.dataset.nodeId = node.id;

                // Círculo del nodo
                const circle = document.createElementNS(svgNS, 'circle');
                circle.setAttribute('cx', pos.x);
                circle.setAttribute('cy', pos.y);
                circle.setAttribute('r', NODE_RADIUS);
                circle.setAttribute('fill', COLORS.nodeFill);
                circle.setAttribute('stroke', COLORS.nodeStroke);
                circle.setAttribute('stroke-width', '2');
                g.appendChild(circle);

                // Etiqueta del nodo
                const text = document.createElementNS(svgNS, 'text');
                text.setAttribute('x', pos.x);
                text.setAttribute('y', pos.y + 4);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('fill', COLORS.labelFill);
                text.setAttribute('font-size', '12');
                text.setAttribute('font-family', "'JetBrains Mono', monospace");
                text.textContent = node.label || node.id;
                g.appendChild(text);

                // Dirección (pequeña, debajo del nodo)
                if (node.address) {
                    const addrText = document.createElementNS(svgNS, 'text');
                    addrText.setAttribute('x', pos.x);
                    addrText.setAttribute('y', pos.y + NODE_RADIUS + 14);
                    addrText.setAttribute('text-anchor', 'middle');
                    addrText.setAttribute('fill', COLORS.edgeStroke);
                    addrText.setAttribute('font-size', '9');
                    addrText.setAttribute('font-family', "'JetBrains Mono', monospace");
                    addrText.textContent = node.address;
                    g.appendChild(addrText);
                }

                // Tooltip al hacer hover
                const titleEl = document.createElementNS(svgNS, 'title');
                titleEl.textContent = `${node.label || node.id}${node.address ? ' @ ' + node.address : ''}`;
                g.appendChild(titleEl);

                svg.appendChild(g);
            }

            container.appendChild(svg);
        }

        // ─── Canvas Rendering (>60 nodos) ──────────────────────────────

        /**
         * Renderiza una estructura en Canvas 2D para mejor rendimiento
         * con muchos nodos. Usa Quadtree para hit-testing de clics.
         *
         * @param {HTMLElement} container
         * @param {Object[]} nodes
         * @param {Object[]} edges
         * @private
         */
        _renderCanvas(container, nodes, edges) {
            const width = container.clientWidth || 600;
            const height = Math.max(400, nodes.length * 4);
            const dpr = window.devicePixelRatio || 1;

            const canvas = document.createElement('canvas');
            canvas.className = 'structure-canvas';
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            this._canvas = canvas;

            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);

            // Calcular posiciones
            const positions = this._layoutStrategy(nodes, edges, width, height);

            // Construir Quadtree para hit-testing
            const treeBound = new Rect(width / 2, height / 2, width / 2, height / 2);
            this._quadTree = new QuadTree(treeBound);
            this._currentNodes = new Map();

            for (const node of nodes) {
                const pos = positions.get(node.id);
                if (!pos) continue;
                this._quadTree.insert({ x: pos.x, y: pos.y, data: node });
                this._currentNodes.set(node.id, { ...node, ...pos });
            }

            // Dibujar aristas
            ctx.strokeStyle = COLORS.edgeStroke;
            ctx.lineWidth = 1;
            for (const edge of edges) {
                const fromPos = positions.get(edge.from);
                const toPos = positions.get(edge.to);
                if (!fromPos || !toPos) continue;

                ctx.beginPath();
                ctx.moveTo(fromPos.x, fromPos.y);
                ctx.lineTo(toPos.x, toPos.y);
                ctx.stroke();

                // Dibujar cabeza de flecha simple
                this._drawArrowHead(ctx, fromPos, toPos);
            }

            // Dibujar nodos
            ctx.font = "11px 'JetBrains Mono', monospace";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            for (const node of nodes) {
                const pos = positions.get(node.id);
                if (!pos) continue;

                // Círculo
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, NODE_RADIUS * 0.7, 0, Math.PI * 2);
                ctx.fillStyle = COLORS.nodeFill;
                ctx.fill();
                ctx.strokeStyle = COLORS.nodeStroke;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Etiqueta
                ctx.fillStyle = COLORS.labelFill;
                ctx.fillText(node.label || node.id, pos.x, pos.y);
            }

            container.appendChild(canvas);

            // Hit-testing con clics
            canvas.addEventListener('click', (e) => {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const hitRange = new Rect(x, y, HIT_RADIUS, HIT_RADIUS);
                const hits = this._quadTree.query(hitRange);

                if (hits.length > 0) {
                    // Encontrar el más cercano al clic
                    let closest = hits[0];
                    let minDist = Infinity;
                    for (const h of hits) {
                        const dx = h.x - x;
                        const dy = h.y - y;
                        const d = dx * dx + dy * dy;
                        if (d < minDist) { minDist = d; closest = h; }
                    }
                    console.log('[StructureRenderer] Nodo clickeado:', closest.data);
                }
            });
        }

        /**
         * Dibuja una cabeza de flecha simple en Canvas.
         * @param {CanvasRenderingContext2D} ctx
         * @param {{x: number, y: number}} from
         * @param {{x: number, y: number}} to
         * @private
         */
        _drawArrowHead(ctx, from, to) {
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) return;

            const r = NODE_RADIUS * 0.7;
            const endX = to.x - (dx / dist) * r;
            const endY = to.y - (dy / dist) * r;

            const angle = Math.atan2(dy, dx);
            const headLen = 8;

            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - headLen * Math.cos(angle - Math.PI / 6),
                endY - headLen * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - headLen * Math.cos(angle + Math.PI / 6),
                endY - headLen * Math.sin(angle + Math.PI / 6)
            );
            ctx.strokeStyle = COLORS.arrowHead;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // ─── Limpieza ──────────────────────────────────────────────────

        /**
         * Limpia el contenedor y los datos internos.
         */
        clear() {
            const container = this._getContainer();
            if (container) {
                container.innerHTML = '';
                container.style.display = 'none';
            }
            this._quadTree = null;
            this._currentNodes = null;
            this._canvas = null;
        }
    }

    return StructureRenderer;
})();
