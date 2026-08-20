// editor.js — Lógica del editor de código C++ + API pública EditorView
//
// ╔══════════════════════════════════════════════════════════════════╗
// ║  Rol: VISTA del editor en la arquitectura MVC.                 ║
// ║                                                                ║
// ║  Responsabilidades:                                            ║
// ║  - Manejar números de línea y scroll sync (funcionalidad       ║
// ║    original, preservada tal cual).                             ║
// ║  - Interceptar Tab para insertar 4 espacios.                   ║
// ║  - Exponer API pública vía window.EditorView para que el       ║
// ║    Controlador (execution.js) pueda:                           ║
// ║    • Resaltar líneas con error de compilación.                 ║
// ║    • Resaltar la línea actual en ejecución.                    ║
// ║    • Bloquear/desbloquear el editor durante la ejecución.      ║
// ║    • Obtener el código fuente del textarea.                    ║
// ╚══════════════════════════════════════════════════════════════════╝

window.EditorView = (function () {
    'use strict';

    /** @type {HTMLTextAreaElement|null} */
    let editor = null;
    /** @type {HTMLElement|null} */
    let lineNumbers = null;
    /** @type {boolean} Flag interno para saber si ya se inicializó */
    let initialized = false;

    // ─── Funcionalidad Original (preservada) ───────────────────────

    /**
     * Actualiza los números de línea basándose en el contenido del textarea.
     */
    function updateLineNumbers() {
        if (!editor || !lineNumbers) return;
        const lines = editor.value.split('\n');
        const count = lines.length;
        let html = '';
        for (let i = 1; i <= count; i++) {
            html += `<div class="line-number" data-line="${i}">${i}</div>`;
        }
        lineNumbers.innerHTML = html;
    }

    /**
     * Sincroniza el scroll del panel de números de línea con el textarea.
     */
    function syncScroll() {
        if (lineNumbers && editor) {
            lineNumbers.scrollTop = editor.scrollTop;
        }
    }

    // ─── Inicialización ────────────────────────────────────────────

    function init() {
        editor = document.getElementById('code-editor');
        lineNumbers = document.getElementById('line-numbers');
        if (!editor || !lineNumbers) return;

        editor.addEventListener('input', updateLineNumbers);
        editor.addEventListener('scroll', syncScroll);

        // Tab key inserts 4 spaces
        editor.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = editor.selectionStart;
                const end = editor.selectionEnd;
                editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
                editor.selectionStart = editor.selectionEnd = start + 4;
                updateLineNumbers();
            }
        });

        // Initialize line numbers
        // Use placeholder content if textarea is empty
        if (!editor.value && editor.placeholder) {
            const placeholderLines = editor.placeholder.split('\n').length;
            let html = '';
            for (let i = 1; i <= placeholderLines; i++) {
                html += `<div class="line-number" data-line="${i}">${i}</div>`;
            }
            lineNumbers.innerHTML = html;
        } else {
            updateLineNumbers();
        }

        initialized = true;
    }

    document.addEventListener('DOMContentLoaded', init);

    // ─── API Pública (nuevos métodos para el Controlador) ──────────

    /**
     * Resalta una línea con error de compilación.
     * Agrega la clase .line-error al div de número de línea correspondiente.
     *
     * @param {number} lineNumber - Número de línea (1-indexed).
     */
    function highlightErrorLine(lineNumber) {
        if (!lineNumbers) return;
        clearHighlights(); // Limpiar resaltados previos

        const lineDiv = lineNumbers.querySelector(`[data-line="${lineNumber}"]`);
        if (lineDiv) {
            lineDiv.classList.add('line-error');
        }
    }

    /**
     * Resalta la línea actualmente en ejecución.
     * Agrega la clase .line-current al div de número de línea correspondiente.
     *
     * @param {number} lineNumber - Número de línea (1-indexed).
     */
    function highlightCurrentLine(lineNumber) {
        if (!lineNumbers) return;

        // Quitar resaltado de ejecución anterior (pero no el de error)
        const prevCurrent = lineNumbers.querySelectorAll('.line-current');
        prevCurrent.forEach(el => el.classList.remove('line-current'));

        const lineDiv = lineNumbers.querySelector(`[data-line="${lineNumber}"]`);
        if (lineDiv) {
            lineDiv.classList.add('line-current');
        }
    }

    /**
     * Quita todos los resaltados (error y línea actual).
     */
    function clearHighlights() {
        if (!lineNumbers) return;
        const highlighted = lineNumbers.querySelectorAll('.line-error, .line-current');
        highlighted.forEach(el => {
            el.classList.remove('line-error', 'line-current');
        });
    }

    /**
     * Bloquea o desbloquea el textarea del editor.
     * Se usa para impedir edición mientras el programa se está ejecutando.
     *
     * @param {boolean} readOnly - true para bloquear, false para desbloquear.
     */
    function setReadOnly(readOnly) {
        if (!editor) return;
        editor.readOnly = readOnly;

        const wrapper = editor.closest('.editor-wrapper');
        if (wrapper) {
            if (readOnly) {
                wrapper.classList.add('editor-readonly');
            } else {
                wrapper.classList.remove('editor-readonly');
            }
        }
    }

    /**
     * Obtiene el código fuente actual del textarea.
     * @returns {string}
     */
    function getCode() {
        return editor ? editor.value : '';
    }

    // ─── Exportar API Pública ──────────────────────────────────────

    return {
        highlightErrorLine,
        highlightCurrentLine,
        clearHighlights,
        setReadOnly,
        getCode,
        updateLineNumbers
    };
})();
