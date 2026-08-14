// api.js — Módulo de comunicación con el backend C++
// Por ahora contiene stubs que retornan datos mock.
// Cuando el backend esté listo, estos fetch() apuntarán al servidor C++.

const API_BASE = 'http://localhost:8080';

const SimulatorAPI = {
    /**
     * Envía código C++ al backend para compilar y ejecutar.
     * @param {string} code - Código fuente C++
     * @returns {Promise<Object>} - Resultado de la compilación
     */
    async compile(code) {
        // TODO: Conectar con backend real
        // return await fetch(`${API_BASE}/api/compile`, { method: 'POST', body: JSON.stringify({code}), headers: {'Content-Type': 'application/json'} }).then(r => r.json());
        
        console.log('[API Mock] Compilando código...');
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    success: true,
                    output: 'Programa compilado exitosamente',
                    steps: 5
                });
            }, 300);
        });
    },

    /**
     * Solicita el siguiente paso de ejecución.
     * @param {number} step - Número de paso actual
     * @returns {Promise<Object>} - Snapshot de memoria del paso
     */
    async nextStep(step) {
        // TODO: Conectar con backend real
        console.log(`[API Mock] Ejecutando paso ${step}...`);
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    step: step,
                    line: step + 3,
                    stack: [
                        { name: 'x', type: 'int', value: '10', address: '0x7ffc01' },
                        { name: 'ptr', type: 'int*', value: '→ 0x55a302', address: '0x7ffc02' }
                    ],
                    heap: [
                        { name: '*ptr', type: 'int', value: '42', address: '0x55a302' }
                    ],
                    output: '',
                    finished: step >= 5
                });
            }, 200);
        });
    },

    /**
     * Resetea la sesión de simulación.
     * @returns {Promise<Object>}
     */
    async reset() {
        console.log('[API Mock] Reseteando simulación...');
        return { success: true };
    }
};

// Exponer globalmente
window.SimulatorAPI = SimulatorAPI;
