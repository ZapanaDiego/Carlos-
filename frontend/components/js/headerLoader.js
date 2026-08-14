document.addEventListener("DOMContentLoaded", () => {
    const headerContainer = document.getElementById("header-container");

    if (!headerContainer) return;

    // Cargar el header.html usando fetch
    fetch("/components/header.html")
        .then(response => {
            if (!response.ok) throw new Error("No se pudo cargar el header.");
            return response.text();
        })
        .then(html => {
            headerContainer.innerHTML = html;
            initDropdown(); // Inicializar interacción del menú desplegable
        })
        .catch(err => console.error("Error al cargar el header:", err));
});

// Lógica de apertura/cierre del menú desplegable
function initDropdown() {
    const dropdownBtn = document.getElementById("lessonsDropdownBtn");
    const dropdownContent = document.getElementById("lessonsDropdownContent");

    if (dropdownBtn && dropdownContent) {
        dropdownBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdownContent.classList.toggle("show");
        });

        // Cerrar el menú si se hace clic fuera de él
        document.addEventListener("click", () => {
            if (dropdownContent.classList.contains("show")) {
                dropdownContent.classList.remove("show");
            }
        });
    }
}