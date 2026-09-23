let allQuestions = [];
let questions = []; // Solo 4 aleatorias base
let currentIndex = 0;
let score = 0;
let consecutiveCorrect = 0; 
let incorrectCount = 0;         
let userAnswers = [];
let timer = null;
let timeLeft = 20;          
let moduleId = 1;
let isExtraQuestion = false;

const dummyUserId = "11111111-1111-1111-1111-111111111111"; 

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    moduleId = parseInt(urlParams.get('module') || 1); // Aseguramos que sea entero para comparar bien
    
    // 1. Mostrar primero el modal de advertencia
    showWarningModal(moduleId);
});

// Modal de Advertencia ("¿Estás seguro?")
function showWarningModal(modId) {
    const modMessages = {
        1: '"¿Seguro que dominas la maquetación o solo dependes del "Copy-Paste"? Muestra si realmente sabes diseñar."',
        2: '"¿Criptografía y lógica pura o vas a adivinar las funciones? Demuestra tu nivel en backend."',
        3: '"¿Las bases de datos se manejan con lógica o con fe? Pon a prueba tus consultas SQL."',
        4: '"¿Redes y Scrum al límite o colapsa el servidor? Demuestra tu agilidad técnica."',
        5: '"¿Preparado para el examen de titulación? Demuestra tus conocimientos integrales al máximo nivel."'
    };

    const msg = modMessages[modId] || '"Este módulo evaluará tus conocimientos al límite. Una vez dentro, no hay marcha atrás."';

    let modalOverlay = document.getElementById('warning-modal-overlay');
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'warning-modal-overlay';
        modalOverlay.className = 'modal-overlay';
        modalOverlay.innerHTML = `
            <div class="warning-modal-card">
                <div class="warning-icon">⚠️</div>
                <h2>¿ESTÁS SEGURO?</h2>
                <p id="warning-modal-text"></p>
                <p class="warning-subtext">Este módulo evaluará tus conocimientos al límite. Una vez dentro, no hay marcha atrás.</p>
                <div class="warning-buttons">
                    <button id="btn-acobarse" class="btn-acobardar">ACOBARDARSE</button>
                    <button id="btn-aceptar" class="btn-aceptar-reto">ACEPTAR EL RETO ➔</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);
    }

    document.getElementById('warning-modal-text').innerText = msg;
    
    document.getElementById('btn-acobarse').onclick = () => {
        window.location.href = 'levels.html';
    };

    document.getElementById('btn-aceptar').onclick = () => {
        modalOverlay.remove();
        // 2. Al aceptar, mostramos inmediatamente la ventana con las REGLAS DEL CIBER-RETO
        showRulesModal(modId);
    };
}

// Ventana con las REGLAS DEL CIBER-RETO antes de empezar el juego
function showRulesModal(modId) {
    let rulesOverlay = document.createElement('div');
    rulesOverlay.id = 'rules-modal-overlay';
    rulesOverlay.className = 'modal-overlay';

    // Texto de reglas adaptado si es el módulo 5 o los demás (sin romper nada)
    let rulesListHtml = '';
    if (modId === 5) {
        rulesListHtml = `
            <p>🎓 <strong>Examen de Titulación:</strong></p>
            <ul>
                <li>Banco completo de preguntas de Redes, Bases de Datos, Programación y Soporte.</li>
                <li>Fácil: <strong>60 pts</strong> | Media: <strong>100 pts</strong> | Difícil: <strong>150 pts</strong></li>
            </ul>
            <p>🔴 <strong>Pregunta Incorrecta / Tiempo Agotado:</strong> <strong>0 pts</strong></p>
            <p>🎯 <strong>Meta:</strong> Completa todo el banco de preguntas de titulación con éxito.</p>
        `;
    } else {
        rulesListHtml = `
            <p>🟢 <strong>Pregunta Correcta:</strong></p>
            <ul>
                <li>Fácil: <strong>60 pts</strong> | Media: <strong>100 pts</strong> | Difícil: <strong>150 pts</strong></li>
            </ul>
            <p>🔴 <strong>Pregunta Incorrecta / Tiempo Agotado:</strong> <strong>0 pts</strong></p>
            <p>🎯 <strong>Meta y Repesca:</strong> Necesitas mínimo <strong>250 pts</strong>. Si al acabar las 4 preguntas base tienes entre <strong>120 y 240 pts</strong>, recibes 1 pregunta extra.</p>
        `;
    }

    rulesOverlay.innerHTML = `
        <div class="warning-modal-card rules-card">
            <div class="warning-icon">📜</div>
            <h2>REGLAS DEL CIBER-RETO</h2>
            <div class="rules-list-box">
                ${rulesListHtml}
            </div>
            <button id="btn-comenzar-ya" class="btn-aceptar-reto" style="width: 100%; margin-top: 15px;">¡ENTENDIDO, A JUGAR! 🚀</button>
        </div>
    `;
    document.body.appendChild(rulesOverlay);

    document.getElementById('btn-comenzar-ya').onclick = () => {
        rulesOverlay.remove();
        fetchQuestions(modId);
    };
}

async function fetchQuestions(modId) {
    try {
        const response = await fetch(`/api/modules/${modId}/questions`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            allQuestions = result.data;
            
            // ÚNICO CAMBIO CLAVE AÑADIDO: Si es módulo 5 carga todas las preguntas, si es otro carga 4 aleatorias
            if (modId === 5) {
                questions = allQuestions; 
            } else {
                questions = getRandomElements(allQuestions, 4); 
            }

            loadQuestion();
        } else {
            document.getElementById('question-text').innerText = 'No hay preguntas disponibles para este módulo todavía.';
        }
    } catch (err) {
        console.error('Error al obtener preguntas:', err);
        allQuestions = getMockQuestions(modId);
        questions = (modId === 5) ? allQuestions : getRandomElements(allQuestions, 4);
        loadQuestion();
    }
}

function getRandomElements(arr, count) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function loadQuestion() {
    clearInterval(timer);

    if (currentIndex >= questions.length) {
        evaluateGameCompletion();
        return;
    }

    const q = questions[currentIndex];
    document.getElementById('question-counter').innerText = `NIVEL ${moduleId} - RETO ${currentIndex + 1} DE ${questions.length}`;
    document.getElementById('question-difficulty').innerText = (q.difficulty || 'Fácil').toUpperCase();
    document.getElementById('question-text').innerText = q.question;

    const codeBox = document.getElementById('code-snippet-box');
    if (q.code_snippet) {
        codeBox.classList.remove('hidden');
        document.getElementById('code-snippet-text').innerText = q.code_snippet;
    } else {
        codeBox.classList.add('hidden');
    }

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    q.question_options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt.option_text;
        btn.onclick = () => selectOption(opt.id, btn);
        optionsContainer.appendChild(btn);
    });

    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) nextBtn.classList.add('hidden');
    
    removeFeedbackBox();
    startTimer();
}

function startTimer() {
    timeLeft = 20; // Conservado tal cual
    const timeEl = document.getElementById('time-left');
    if (timeEl) timeEl.innerText = timeLeft;
    
    timer = setInterval(() => {
        timeLeft--;
        if (timeEl) timeEl.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            lockOptionsDueToTimeout();
        }
    }, 1000);
}

function selectOption(optionId, btnElement) {
    clearInterval(timer);
    const q = questions[currentIndex];
    
    const allButtons = document.querySelectorAll('.option-btn');
    allButtons.forEach(b => b.disabled = true);

    let selectedOpt = q.question_options.find(o => o.id === optionId);
    let isCorrect = selectedOpt ? selectedOpt.is_correct : false;

    let pointsEarned = 0;
    
    // Normalizamos el texto de la dificultad para evitar errores de mayúsculas o tildes
    const diff = (q.difficulty || 'facil').toLowerCase().trim();

    if (isCorrect) {
        consecutiveCorrect++;
        incorrectCount = 0; 

        // Asignación de puntaje base estricta según la dificultad real de la pregunta
        if (diff.includes('dificil') || diff.includes('hard') || diff === 'difícil') {
            pointsEarned = 150;
        } else if (diff.includes('media') || diff.includes('medium')) {
            pointsEarned = 100; // Media: 100 puntos
        } else {
            pointsEarned = 60;  // Fácil: 60 puntos
        }
    } else {
        consecutiveCorrect = 0;
        incorrectCount++;
        pointsEarned = 0; // Si falla, suma 0 puntos (sin penalización)
    }

    score += pointsEarned; 
    document.getElementById('current-score').innerText = score;

    userAnswers.push({
        questionId: q.id,
        optionId: optionId,
        isCorrect: isCorrect,
        pointsEarned: pointsEarned,
        timeLeft: timeLeft
    });

    q.question_options.forEach((opt, idx) => {
        if (opt.id === optionId) {
            btnElement.classList.add(opt.is_correct ? 'correct' : 'incorrect');
        }
        if (opt.is_correct) {
            allButtons[idx].classList.add('correct');
        }
    });

    showFeedback(q.explanation || (isCorrect ? '¡Excelente respuesta!' : 'Respuesta incorrecta. Revisa el concepto.'));

    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) nextBtn.classList.remove('hidden');
}

function lockOptionsDueToTimeout() {
    const allButtons = document.querySelectorAll('.option-btn');
    allButtons.forEach(b => b.disabled = true);
    
    incorrectCount++;
    // Tiempo agotado suma 0 puntos, sin restar nada

    userAnswers.push({
        questionId: questions[currentIndex].id,
        optionId: null,
        isCorrect: false,
        pointsEarned: 0,
        timeLeft: 0
    });

    showFeedback('⏱️ ¡Tiempo agotado! No se han sumado puntos en esta pregunta.');
    
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) nextBtn.classList.remove('hidden');
}

function showFeedback(text) {
    removeFeedbackBox();
    const quizBox = document.getElementById('quiz-box');
    const feedbackDiv = document.createElement('div');
    feedbackDiv.id = 'feedback-box';
    feedbackDiv.className = 'feedback-card';
    feedbackDiv.innerHTML = `<h4>💡 Retroalimentación:</h4><p>${text}</p>`;
    quizBox.appendChild(feedbackDiv);
}

function removeFeedbackBox() {
    const existing = document.getElementById('feedback-box');
    if (existing) existing.remove();
}

function nextQuestion() {
    currentIndex++;
    
    // Validamos si ya respondimos todas las preguntas del bloque actual
    if (currentIndex >= questions.length) {
        evaluateGameCompletion();
    } else {
        loadQuestion();
    }
}

function evaluateGameCompletion() {
    // REGLA DE REPESCA / PREGUNTA EXTRA: Solo aplica si NO es el módulo 5 y está entre 120 y 240 pts
    if (moduleId !== 5 && score >= 120 && score <= 240 && !isExtraQuestion && allQuestions.length > 4) {
        isExtraQuestion = true;
        alert('⚡ ¡Estás en la zona de repesca (' + score + ' pts)! Tienes 1 pregunta extra para alcanzar la meta de 250 puntos.');
        const remaining = allQuestions.filter(q => !questions.some(nq => nq.id === q.id));
        if (remaining.length > 0) {
            questions.push(remaining[0]);
            loadQuestion();
            return;
        }
    }

    // Si ya no hay repesca o es el módulo 5, finaliza y muestra el resumen
    finishGame();
}

async function finishGame() {
    await saveGameResultsToBackend();
    document.getElementById('quiz-box').classList.add('hidden');
    document.getElementById('result-box').classList.remove('hidden');

    const passed = score >= 250; // Meta de aprobación >= 250 puntos

    // Recuperamos el registro de módulos completados previamente
    let completedModules = JSON.parse(localStorage.getItem('cz_completed_modules') || '{}');
    const alreadyCompletedBefore = completedModules[moduleId] === true;

    if (passed) {
        // Si APRUEBA: Desbloquea el siguiente módulo si aplica (hasta el 5)
        const currentMax = parseInt(localStorage.getItem('cz_max_unlocked_module')) || 1;
        const nextMod = parseInt(moduleId) + 1;
        if (nextMod > currentMax && nextMod <= 5) {
            localStorage.setItem('cz_max_unlocked_module', nextMod);
        }

        // CONTROL ANTI-TRAMPAS: Solo sumamos puntos y registramos el módulo si NO lo había completado antes
        if (!alreadyCompletedBefore) {
            let totalScore = parseInt(localStorage.getItem('cz_score')) || 0;
            totalScore += Math.max(0, score);
            localStorage.setItem('cz_score', totalScore);

            // Marcamos este módulo como oficialmente completado por primera vez
            completedModules[moduleId] = true;
            localStorage.setItem('cz_completed_modules', JSON.stringify(completedModules));

            console.log('¡Módulo superado por primera vez! Puntos sumados al acumulado general.');
        } else {
            console.log('Módulo en modo repaso. No se suman puntos extra al acumulado general.');
        }

        // Si aprobó el Módulo 4, marcamos oficialmente que completó todo el juego para activar los premios
        if (parseInt(moduleId) === 4) {
            localStorage.setItem('cz_completed_module_4', 'true');
        }
    } else {
        // Si REPRUEBA: No sumamos los puntos al acumulado general
        console.log('No se sumaron los puntos al acumulado general por no alcanzar la meta de aprobación.');
    }

    const correctCount = userAnswers.filter(a => a.isCorrect).length;
    
    // Mensaje dinámico dependiendo de si era la primera vez o solo repaso
    let statusMessage = '';
    if (passed) {
        if (alreadyCompletedBefore) {
            statusMessage = '🔄 ¡Módulo repasado con éxito! (Ya habías obtenido los puntos de este nivel anteriormente).';
        } else {
            statusMessage = '🚀 ¡Se ha acumulado tu puntaje y desbloqueado el siguiente nivel!';
        }
    } else {
        statusMessage = '💡 ¡Inténtalo de nuevo para superar la meta!';
    }

    document.getElementById('result-summary').innerHTML = `
        Has obtenido <strong>${score} puntos</strong> en este reto.<br>
        Respuestas correctas: ${correctCount} de ${questions.length}.<br>
        Estado: <strong>${passed ? '🎉 ¡APROBADO! Reto superado con éxito' : '❌ No alcanzaste los 250 puntos necesarios'}</strong><br>
        ${statusMessage}
    `;
    
    const resultBox = document.getElementById('result-box');
    let actionBtn = resultBox.querySelector('button');
    if (actionBtn) {
        actionBtn.innerText = passed ? 'Continuar a Módulos 🚀' : 'Reintentar Reto 🔄';
        
        // Si aprobó y es el Módulo 4, al hacer clic mostramos la ventana de premio en lugar de redirigir de golpe
        if (passed && parseInt(moduleId) === 4) {
            actionBtn.onclick = () => {
                showFinalRewardModal();
            };
        } else {
            actionBtn.onclick = () => window.location.href = 'levels.html';
        }
    }
}

// Función auxiliar para mostrar la ventana de felicitaciones y premios del Módulo 4
function showFinalRewardModal() {
    let rewardOverlay = document.createElement('div');
    rewardOverlay.id = 'reward-modal-overlay';
    rewardOverlay.className = 'modal-overlay';
    rewardOverlay.innerHTML = `
        <div class="warning-modal-card rules-card" style="text-align: center; border: 2px solid #00ffcc; box-shadow: 0 0 25px rgba(0,255,204,0.3); background: #0f172a; padding: 25px; border-radius: 12px; max-width: 450px; margin: auto; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 9999;">
            <div class="warning-icon" style="font-size: 50px; margin-bottom: 10px;">🏆🎁</div>
            <h2 style="color: #00ffcc; margin-bottom: 10px;">¡FELICIDADES, MÓDULO 4 SUPERADO!</h2>
            <p style="margin-bottom: 15px; color: #cbd5e1; font-size: 14px;">Has completado con éxito toda la ruta de aprendizaje de <strong>Código Zero</strong>. Como reconocimiento a tu esfuerzo, te ganaste estos libros exclusivos:</p>
            
            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; text-align: left;">
                <a href="https://drive.google.com/file/d/170hM4j54pKG94rAAbysEYt13jnICtpzm/view?usp=sharing" target="_blank" style="background: rgba(0,255,204,0.1); padding: 12px; border-radius: 8px; color: #00ffcc; text-decoration: none; border: 1px solid rgba(0,255,204,0.3); display: flex; align-items: center; gap: 10px; font-size: 14px;">
                    📖 <span><strong>Primeros pasos con Ubuntu</strong> (Guía de inicio)</span>
                </a>
                <a href="https://drive.google.com/file/d/13aRWs-TC6gMyevTFZkD8Ih7uoN83JObW/view?usp=sharing" target="_blank" style="background: rgba(0,255,204,0.1); padding: 12px; border-radius: 8px; color: #00ffcc; text-decoration: none; border: 1px solid rgba(0,255,204,0.3); display: flex; align-items: center; gap: 10px; font-size: 14px;">
                    🐍 <span><strong>El tutorial de Python</strong> (Referencia oficial)</span>
                </a>
            </div>

            <button id="btn-cerrar-premio" class="btn-aceptar-reto" style="width: 100%; background: linear-gradient(135deg, #00ffcc, #007acc); color: #0f172a; font-weight: bold; padding: 12px; border: none; border-radius: 8px; cursor: pointer;">¡GRACIAS, VOLVER A MÓDULOS! 🚀</button>
        </div>
    `;
    document.body.appendChild(rewardOverlay);

    document.getElementById('btn-cerrar-premio').onclick = () => {
        rewardOverlay.remove();
        window.location.href = 'levels.html';
    };
}

function getMockQuestions(modId) {
    return [
        {
            id: 1,
            difficulty: 'facil',
            question: '¿Qué propiedad CSS centra los elementos en el eje principal en Flexbox?',
            code_snippet: '.container {\n  display: flex;\n  /* ??? */\n}',
            explanation: 'justify-content alinea los elementos a lo largo del eje principal del contenedor flex.',
            question_options: [
                { id: 101, option_text: 'margin: auto 0;', is_correct: false },
                { id: 102, option_text: 'justify-content: center;', is_correct: true },
                { id: 103, option_text: 'text-align: center;', is_correct: false },
                { id: 104, option_text: 'float: center;', is_correct: false }
            ]
        },
        {
            id: 2,
            difficulty: 'medio',
            question: '¿Cuál es la etiqueta HTML semántica correcta para la sección principal de contenido?',
            code_snippet: null,
            explanation: 'La etiqueta <main> especifica el contenido principal y dominante del cuerpo de un documento.',
            question_options: [
                { id: 201, option_text: '<section>', is_correct: false },
                { id: 202, option_text: '<main>', is_correct: true },
                { id: 203, option_text: '<div>', is_correct: false },
                { id: 204, option_text: '<article>', is_correct: false }
            ]
        },
        {
            id: 3,
            difficulty: 'facil',
            question: '¿Qué unidad de medida en CSS es relativa al tamaño de fuente del elemento raíz (html)?',
            code_snippet: null,
            explanation: 'La unidad rem se adapta de forma proporcional en relación directa con el tamaño configurado en la raíz.',
            question_options: [
                { id: 301, option_text: 'em', is_correct: false },
                { id: 302, option_text: 'rem', is_correct: true },
                { id: 303, option_text: 'px', is_correct: false },
                { id: 304, option_text: '%', is_correct: false }
            ]
        },
        {
            id: 4,
            difficulty: 'dificil',
            question: '¿Qué propiedad de CSS Grid define el tamaño de las filas de manera implícita?',
            code_snippet: null,
            explanation: 'grid-auto-rows permite especificar el tamaño predeterminado de las pistas de filas generadas implícitamente.',
            question_options: [
                { id: 401, option_text: 'grid-template-rows', is_correct: false },
                { id: 402, option_text: 'grid-auto-rows', is_correct: true },
                { id: 403, option_text: 'row-gap', is_correct: false },
                { id: 404, option_text: 'grid-row', is_correct: false }
            ]
        }
    ];
}

async function saveGameResultsToBackend() {
    try {
        let userData = JSON.parse(localStorage.getItem('cz_user'));
        
        // Si no hay usuario autenticado en localStorage, asignamos un respaldo temporal con ID 1
        if (!userData || !userData.id) {
            console.warn("⚠️ No se encontró un usuario autenticado en localStorage. Usando usuario de respaldo por defecto (ID: 1).");
            userData = { 
                id: 1, 
                nickname: 'Fabricio', 
                dls_score: 0 
            };
            // Opcional: guardarlo de una vez para futuras interacciones
            localStorage.setItem('cz_user', JSON.stringify(userData));
        }

        // Mapeamos solo lo necesario para que el backend evalúe según la dificultad
        const formattedAnswers = userAnswers.map(ans => ({
            questionId: ans.questionId,
            optionId: ans.optionId,
            timeLeft: ans.timeLeft || 0
        }));

        // Hacemos la petición POST al backend
        const response = await fetch('/api/game/submit-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userData.id,
                moduleId: parseInt(moduleId),
                answers: formattedAnswers,
                durationSec: 60
            })
        });

        const result = await response.json();
        if (result.success) {
            console.log('¡Partida sincronizada perfectamente!', result);

            if (userData.dls_score !== undefined) {
                userData.dls_score += result.scoreObtained;
                localStorage.setItem('cz_user', JSON.stringify(userData));
            }
        } else {
            console.error('Error al guardar en el backend:', result.message);
        }

    } catch (err) {
        console.error('Error de red al intentar conectar con el backend:', err);
    }
}
// Asegúrate de que el DOM esté listo o ponlo al final del archivo
document.getElementById('next-btn').addEventListener('click', () => {
    nextQuestion();
});
