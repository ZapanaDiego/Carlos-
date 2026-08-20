// lessonRouter.js — Router AJAX para cargar lecciones dinámicamente
document.addEventListener('DOMContentLoaded', () => {
    const contentArea = document.getElementById('lesson-content');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    
    if (!contentArea || !sidebarLinks.length) return;

    // Load a lesson by name
    let activeLessonModule = null;

    async function loadLesson(lessonName) {
        // 1. Cleanup previous lesson if it had a destroy method
        if (activeLessonModule && typeof activeLessonModule.destroy === 'function') {
            try {
                activeLessonModule.destroy();
            } catch (e) {
                console.error('Error cleaning up lesson:', e);
            }
            activeLessonModule = null;
        }

        // Show loading state
        contentArea.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
        
        try {
            const response = await fetch(`./frontend/lessons/html/${lessonName}.html`);
            if (!response.ok) throw new Error(`Lección '${lessonName}' no encontrada`);
            const html = await response.text();
            
            contentArea.innerHTML = html;
            contentArea.classList.add('fade-in');
            
            // Remove animation class after it plays
            setTimeout(() => contentArea.classList.remove('fade-in'), 300);
            
            // Cargar Dinámicamente el JavaScript de la lección
            try {
                // Importación dinámica usando ES Modules y rutas absolutas desde la raíz
                const module = await import(`/frontend/lessons/js/lessons/${lessonName}.js?t=${Date.now()}`);
                activeLessonModule = module;
                
                // Inicializar la lección
                if (typeof module.init === 'function') {
                    module.init();
                } else {
                    console.warn(`La lección ${lessonName} no tiene una función init() exportada.`);
                }
            } catch (jsError) {
                console.log(`Sin JS interactivo para la lección: ${lessonName}`, jsError);
            }

            // Update active state in sidebar
            sidebarLinks.forEach(link => {
                link.classList.toggle('active', link.dataset.lesson === lessonName);
            });
            
            // Update URL without reload
            history.pushState({ lesson: lessonName }, '', `#${lessonName}`);
            
        } catch (error) {
            contentArea.innerHTML = `
                <div class="welcome-state">
                    <div class="welcome-icon">🚧</div>
                    <h2>Contenido en construcción</h2>
                    <p>Esta lección aún no está disponible. ¡Pronto será agregada!</p>
                </div>
            `;
            console.warn('Error cargando lección:', error);
        }
    }

    // Click handlers on sidebar links
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const lessonName = link.dataset.lesson;
            if (lessonName) loadLesson(lessonName);
        });
    });

    // Accordion functionality for sidebar categories
    const categories = document.querySelectorAll('.sidebar-category');
    categories.forEach(category => {
        category.addEventListener('click', () => {
            const group = category.closest('.sidebar-group');
            group.classList.toggle('active');
        });
    });

    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.lesson) {
            loadLesson(e.state.lesson);
        } else {
            // Restore welcome state
            contentArea.innerHTML = `
                <div class="welcome-state">
                    <div class="welcome-icon">📖</div>
                    <h2>Selecciona un tema</h2>
                    <p>Elige un tema del panel izquierdo para comenzar a aprender sobre estructuras de datos y su representación en memoria.</p>
                </div>
            `;
            sidebarLinks.forEach(link => link.classList.remove('active'));
        }
    });

    // Check if URL has a hash on load
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash) {
        loadLesson(initialHash);
    }
});
