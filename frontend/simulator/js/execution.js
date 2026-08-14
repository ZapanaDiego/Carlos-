// execution.js - Lógica de control de ejecución

window.ExecutionController = (function() {
    let outputConsole = null;
    let stepCount = 0;

    function appendOutput(text, type = 'info') {
        if (!outputConsole) return;
        
        // Si tiene el texto por defecto, limpiarlo
        if (outputConsole.innerText.trim() === '// La salida del programa aparecerá aquí...') {
            outputConsole.innerHTML = '';
        }

        const div = document.createElement('div');
        div.className = `output-line output-${type}`;
        div.textContent = text;
        outputConsole.appendChild(div);
        
        // Auto-scroll al final
        outputConsole.scrollTop = outputConsole.scrollHeight;
    }

    document.addEventListener('DOMContentLoaded', () => {
        outputConsole = document.getElementById('output-console');
        const btnRun = document.getElementById('btn-run');
        const btnStep = document.getElementById('btn-step');
        const btnReset = document.getElementById('btn-reset');

        if (btnRun) {
            btnRun.addEventListener('click', () => {
                appendOutput('⚡ Compilando programa...', 'info');
                setTimeout(() => {
                    appendOutput('✓ Ejecución completada', 'success');
                }, 500);
            });
        }

        if (btnStep) {
            btnStep.addEventListener('click', () => {
                stepCount++;
                appendOutput(`→ Paso ejecutado (línea ${stepCount})`, 'info');
            });
        }

        if (btnReset) {
            btnReset.addEventListener('click', () => {
                if (outputConsole) {
                    outputConsole.innerHTML = '// La salida del programa aparecerá aquí...';
                }
                stepCount = 0;
                if (window.MemoryCanvas && typeof window.MemoryCanvas.renderDemo === 'function') {
                    window.MemoryCanvas.renderDemo();
                }
            });
        }
    });

    return {
        appendOutput
    };
})();
