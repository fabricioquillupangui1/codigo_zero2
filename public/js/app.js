document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    fetchModules();
});

// Cargar datos del usuario autenticado (desde localStorage o Supabase)
function loadUserData() {
    const userData = JSON.parse(localStorage.getItem('cz_user')) || {
        nickname: 'Fabricio',
        role: 'Estudiante',
        avatar: ''
    };

    // Asegurarnos de leer siempre el puntaje actualizado desde 'cz_score' en localStorage
    const currentScore = parseInt(localStorage.getItem('cz_score')) || 0;
    userData.score = currentScore;

    // Extraer nombre de usuario o nickname de forma segura
    const displayName = userData.nickname || userData.name || 'Fabricio';
    const displayRole = userData.role ? userData.role.toUpperCase() : 'ESTUDIANTE';

    const nameEl = document.getElementById('user-name-display');
    if (nameEl) nameEl.textContent = displayName;

    const roleEl = document.getElementById('user-role-display');
    if (roleEl) roleEl.textContent = `ROL: ${displayRole}`;
    
    const avatarImg = document.getElementById('user-avatar');
    const fallbackDiv = document.getElementById('avatar-fallback');

    // Validar si el avatar es una URL válida (que empiece por http o data)
    if(avatarImg && fallbackDiv) {
        if(userData.avatar && (userData.avatar.startsWith('http') || userData.avatar.startsWith('data:'))) {
            avatarImg.src = userData.avatar;
            avatarImg.style.display = 'block';
            fallbackDiv.style.display = 'none';
        } else {
            // Si no hay imagen real, mostramos respaldo con iniciales
            avatarImg.style.display = 'none';
            fallbackDiv.style.display = 'flex';
            fallbackDiv.textContent = displayName.substring(0, 2).toUpperCase();
        }
    }

    updateScoreDisplay(userData.score);
}

function updateScoreDisplay(score) {
    const scoreValEl = document.getElementById('total-score-val');
    if (scoreValEl) {
        scoreValEl.textContent = score;
    }
}

// Función para reiniciar el progreso desde 0
function resetUserProgress() {
    if (confirm('¿Estás seguro de reiniciar todo tu puntaje y progreso a 0?')) {
        localStorage.setItem('cz_score', '0');
        localStorage.setItem('cz_max_unlocked_module', '1'); // Reinicia el desbloqueo al módulo 1
        localStorage.removeItem('cz_completed_module_4'); // Oculta nuevamente el botón de premios
        localStorage.removeItem('cz_completed_modules'); // Limpia el registro de módulos ya finalizados
        
        updateScoreDisplay(0);
        fetchModules(); // Recarga los módulos visualmente
        
        // Ocultar también el botón de premios en la barra superior si está visible
        const btnPremios = document.getElementById('btn-ver-premios');
        if (btnPremios) btnPremios.style.display = 'none';

        alert('¡Progreso reiniciado con éxito!');
    }
}

async function fetchModules() {
    // Obtenemos el nivel máximo desbloqueado desde localStorage (por defecto es 1)
    const maxUnlocked = parseInt(localStorage.getItem('cz_max_unlocked_module')) || 1;

    // Lista completa predeterminada de respaldo
    const defaultModules = [
        { 
            id: 1, 
            title: 'Módulo 1: Diseño Web y Móvil', 
            description: 'Maquetación avanzada, CSS Flexbox, Grid y principios de diseño responsive.', 
            is_active: true 
        },
        { 
            id: 2, 
            title: 'Módulo 2: Lógica y Backend', 
            description: 'Estructuras de control, funciones, manejo de APIs y servicios con Node.js.', 
            is_active: false 
        },
        { 
            id: 3, 
            title: 'Módulo 3: Bases de Datos', 
            description: 'Consultas DDL, DML, JOINS y restricciones avanzadas en SQL.', 
            is_active: false 
        },
        { 
            id: 4, 
            title: 'Módulo 4: Redes y Scrum', 
            description: 'Comandos de red, subredes IP, servidores Linux y metodologías ágiles.', 
            is_active: false 
        }
    ];

    try {
        const response = await fetch('/api/modules');
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            // Mapeamos respetando el estado real que viene de la base de datos de Supabase.
            // Opcionalmente podemos validar también que el id no supere el nivel máximo alcanzado si así lo deseas.
            const synchronizedModules = result.data.map(mod => {
                // Soportamos tanto si el campo se llama 'is_active' (booleano) como 'status' ('Activo'/'Inactivo')
                let activeStatus = false;
                
                if (typeof mod.is_active !== 'undefined') {
                    activeStatus = Boolean(mod.is_active);
                } else if (typeof mod.status !== 'undefined') {
                    activeStatus = (mod.status === true || mod.status === 'Activo' || mod.status === 'active');
                }

                return {
                    ...mod,
                    // El módulo estará activo solo si el backend lo permite y el usuario ya llegó a ese nivel
                    is_active: activeStatus && (mod.id <= maxUnlocked || activeStatus)
                };
            });
            renderModules(synchronizedModules);
        } else {
            renderModules(defaultModules);
        }
    } catch (err) {
        console.warn('API de módulos no disponible localmente, cargando esquema predeterminado:', err);
        renderModules(defaultModules);
    }
}

function renderModules(modules) {
    const container = document.getElementById('modules-container');
    if (!container) return;
    
    container.innerHTML = '';

    // Recuperamos el registro de módulos que ya fueron completados con éxito
    const completedModules = JSON.parse(localStorage.getItem('cz_completed_modules') || '{}');

    modules.forEach(mod => {
        const card = document.createElement('div');
        card.className = `module-card ${mod.is_active ? '' : 'disabled'}`;
        
        // Verificamos si este módulo ya fue superado anteriormente
        const isCompleted = completedModules[mod.id] === true;

        // Determinamos el texto y estilo del botón dinámicamente
        let buttonText = 'Bloqueado 🔒';
        if (mod.is_active) {
            buttonText = isCompleted ? 'Repasar Reto 🔄' : 'Iniciar Reto 🚀';
        }

        card.innerHTML = `
            <h3>${mod.title}</h3>
            <p>${mod.description}</p>
            <button onclick="startModule(${mod.id})" ${mod.is_active ? '' : 'disabled'}>
                ${buttonText}
            </button>
        `;
        container.appendChild(card);
    });
}

async function startModule(moduleId) {
    // Redirige al juego pasando el módulo seleccionado
    window.location.href = `game.html?module=${moduleId}`;
}