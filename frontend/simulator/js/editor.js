// editor.js — Lógica del editor de código C++
document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('code-editor');
    const lineNumbers = document.getElementById('line-numbers');
    if (!editor || !lineNumbers) return;

    function updateLineNumbers() {
        const lines = editor.value.split('\n');
        const count = lines.length;
        let html = '';
        for (let i = 1; i <= count; i++) {
            html += `<div class="line-number">${i}</div>`;
        }
        lineNumbers.innerHTML = html;
    }

    function syncScroll() {
        lineNumbers.scrollTop = editor.scrollTop;
    }

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
        // Count placeholder lines for initial display
        const placeholderLines = editor.placeholder.split('\n').length;
        let html = '';
        for (let i = 1; i <= placeholderLines; i++) {
            html += `<div class="line-number">${i}</div>`;
        }
        lineNumbers.innerHTML = html;
    } else {
        updateLineNumbers();
    }
});
