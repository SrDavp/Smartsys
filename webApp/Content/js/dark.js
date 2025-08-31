// Función para aplicar el tema inmediatamente al cargar la página
function applyTheme() {
    const colorLocal = localStorage.getItem('color-scheme');
    const colorSistema = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    let finalColor = colorLocal || colorSistema;

    if (finalColor === 'dark') {
        document.body.classList.add('dark');
        document.body.style.background = '#101828';
    } else {
        document.body.classList.remove('dark');
        document.body.style.background = '#fafafa';
    }
}

// Aplicar tema antes de cargar completamente la página
applyTheme();

// Función para configurar los botones
function setupThemeToggle() {
    const dark = document.getElementById("btnDark");
    const light = document.getElementById("btnLight");

    if (dark) {
        dark.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.add("dark");
            document.body.style.background = "#101828";
            localStorage.setItem('color-scheme', 'dark');
        });
    }

    if (light) {
        light.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.remove("dark");
            document.body.style.background = "#fafafa";
            localStorage.setItem('color-scheme', 'light');
        });
    }
}

// Configurar los botones cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', setupThemeToggle);

// Escuchar cambios del sistema si no hay preferencia guardada
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const colorLocal = localStorage.getItem('color-scheme');
    if (!colorLocal) {
        if (e.matches) {
            document.body.classList.add('dark');
            document.body.style.background = '#101828';
        } else {
            document.body.classList.remove('dark');
            document.body.style.background = '#fafafa';
        }
    }
});
