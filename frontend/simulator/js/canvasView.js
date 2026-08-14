// canvasView.js - Lógica de visualización de memoria

window.MemoryCanvas = (function() {
    // Referencias a los contenedores
    let stackContainer;
    let heapContainer;

    // Datos de ejemplo
    const demoStack = [
        {name: 'x', type: 'int', value: '10', address: '0x7ffc01'},
        {name: 'ptr', type: 'int*', value: '→ 0x55a302', address: '0x7ffc02'}
    ];

    const demoHeap = [
        {name: '*ptr', type: 'int', value: '42', address: '0x55a302'}
    ];

    function createBlockElement(block, sectionClass) {
        const div = document.createElement('div');
        div.className = `memory-block ${sectionClass} fade-in`;
        div.innerHTML = `
            <span class="block-address">${block.address}</span>
            <div class="block-name">${block.name}</div>
            <div class="block-type">${block.type}</div>
            <div class="block-value">${block.value}</div>
        `;
        return div;
    }

    function renderStack(blocks) {
        if (!stackContainer) stackContainer = document.getElementById('stack-blocks');
        if (!stackContainer) return;
        
        stackContainer.innerHTML = '';
        blocks.forEach(block => {
            stackContainer.appendChild(createBlockElement(block, 'stack'));
        });
    }

    function renderHeap(blocks) {
        if (!heapContainer) heapContainer = document.getElementById('heap-blocks');
        if (!heapContainer) return;
        
        heapContainer.innerHTML = '';
        blocks.forEach(block => {
            heapContainer.appendChild(createBlockElement(block, 'heap'));
        });
    }

    function clearMemory() {
        if (!stackContainer) stackContainer = document.getElementById('stack-blocks');
        if (!heapContainer) heapContainer = document.getElementById('heap-blocks');
        
        if (stackContainer) stackContainer.innerHTML = '';
        if (heapContainer) heapContainer.innerHTML = '';
    }

    function renderDemo() {
        renderStack(demoStack);
        renderHeap(demoHeap);
    }

    document.addEventListener('DOMContentLoaded', () => {
        stackContainer = document.getElementById('stack-blocks');
        heapContainer = document.getElementById('heap-blocks');
        if (stackContainer && heapContainer) {
            renderDemo();
        }
    });

    return {
        renderStack,
        renderHeap,
        clearMemory,
        renderDemo
    };
})();
