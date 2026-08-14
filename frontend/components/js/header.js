// header.js - Carga el header y marca la página actual activa
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('header-container');
    if (!container) return;

    fetch('./frontend/components/header.html')
        .then(r => { 
            if (!r.ok) throw new Error('Error al cargar el header'); 
            return r.text(); 
        })
        .then(html => {
            container.innerHTML = html;
            // Detecta la página actual y marca el enlace activo
            const currentPath = window.location.pathname;
            const isLessons = currentPath.includes('lessons');
            const links = container.querySelectorAll('.nav-link');
            links.forEach(link => {
                if (isLessons && link.dataset.page === 'lessons') {
                    link.classList.add('active');
                } else if (!isLessons && link.dataset.page === 'home') {
                    link.classList.add('active');
                }
            });
        })
        .catch(err => console.error('Error cargando header:', err));
});