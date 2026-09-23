import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Configuración de Supabase con tus credenciales reales
const SUPABASE_URL = 'https://adrbtyxwptmqxjiasfdb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkcmJ0eXh3cHRtcXhqaWFzZmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NjQ3NzUsImV4cCI6MjEwNTM0MDc3NX0.f3aZO-jd72iw5KZ8xp6iLxR8GbyioWjTr4VI-GN-3f4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variable global para almacenar las preguntas y aplicar filtros de manera fluida
let allQuestions = [];

document.addEventListener('DOMContentLoaded', async () => {
  console.log("Panel Admin inicializado.");

  // 1. Control de pestañas dinámico para todas las secciones
  const tabBtns = document.querySelectorAll('.tab-admin-btn');
  const panels = document.querySelectorAll('.admin-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }

      // Cargar datos según la pestaña seleccionada
      if (targetId === 'panel-modules') loadModules();
      if (targetId === 'panel-questions') loadQuestions();
      if (targetId === 'panel-options') loadOptions();
      if (targetId === 'panel-history') loadGameHistory();
      if (targetId === 'panel-answers') loadGameAnswers();
    });
  });

  // 1.1 Configurar eventos del Modal de Preguntas y Opciones
  setupQuestionModal();

  // 1.2 Inicializar eventos de filtrado y opciones dinámicas del select de módulos
  setupQuestionFilters();
  await loadModuleFilterOptions();

  // 2. Cargar datos iniciales de usuarios
  await loadUsers();
});

// ==========================================
// GESTIÓN DE USUARIOS
// ==========================================
async function loadUsers() {
  const tableBody = document.getElementById('users-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #00ffcc;">Cargando usuarios...</td></tr>`;

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    if (!users || users.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8;">No hay usuarios registrados.</td></tr>`;
      return;
    }

    tableBody.innerHTML = '';
    users.forEach(user => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user.nickname || 'Sin Nickname'}</td>
        <td>${user.email}</td>
        <td><span class="badge-${user.role}">${user.role}</span></td>
        <td>${user.avatar || 'N/A'}</td>
        <td>${user.dls_score || 0}</td>
        <td>Nivel ${user.unlocked_level || 1}</td>
        <td>
          <button class="btn-action btn-edit" title="Editar usuario" data-id="${user.id}">✏️</button>
          <button class="btn-action btn-delete" title="Eliminar usuario" data-id="${user.id}">🗑️</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    attachUserActions();

  } catch (err) {
    console.error("Error al cargar usuarios:", err);
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #ff4d4d;">Error al conectar con la base de datos.</td></tr>`;
  }
}

function attachUserActions() {
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const userId = e.currentTarget.getAttribute('data-id');
      if (confirm('¿Estás seguro de eliminar este usuario del sistema?')) {
        const { error } = await supabase.from('users').delete().eq('id', userId);
        if (error) alert('Error al eliminar: ' + error.message);
        else { alert('Usuario eliminado correctamente.'); loadUsers(); }
      }
    });
  });

document.querySelectorAll('.btn-edit-q').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const qId = e.currentTarget.getAttribute('data-id');
    const row = e.currentTarget.closest('tr');
    
    const currentText = row.children[2].innerText;
    const currentPoints = row.children[3].innerText;
    const currentDiff = row.children[4].innerText;
    // Ehecha upe estado oĩva la tabla-pe (Aktiva / Inactiva)
    const currentStatusText = row.children[5].innerText.trim();
    const currentIsActive = currentStatusText === 'Activa';

    const newModuleId = prompt("Editar ID Módulo:", row.children[1].innerText);
    if (newModuleId === null) return;
    const newText = prompt("Editar Pregunta:", currentText);
    if (newText === null) return;
    const newPoints = prompt("Editar Puntos:", currentPoints);
    if (newPoints === null) return;
    const newDiff = prompt("Editar Dificultad (facil, media, dificil):", currentDiff);
    if (newDiff === null) return;
    
    // Jerure upe estado pyahu lápiz rupive
    const newStatusInput = prompt("¿Está activa la pregunta? (si/no):", currentIsActive ? "si" : "no");
    if (newStatusInput === null) return;
    const newIsActive = newStatusInput.trim().toLowerCase() === 'si';

    const newCode = prompt("Editar Código de Ejemplo (Opcional):", "");
    if (newCode === null) return;
    const newExplanation = prompt("Editar Explicación de la respuesta (Opcional):", "");
    if (newExplanation === null) return;

    const { error } = await supabase.from('questions').update({
      module_id: parseInt(newModuleId),
      question: newText.trim(),
      points: parseInt(newPoints) || 10,
      difficulty: newDiff.trim(),
      is_active: newIsActive, // <--- Ko'ápe oñembopyahu upe estado
      code_snippet: newCode.trim() ? newCode.trim() : null,
      explanation: newExplanation.trim() ? newExplanation.trim() : null
    }).eq('id', qId);

    if (error) alert('Error: ' + error.message);
    else { 
      alert('¡Pregunta actualizada con éxito!'); 
      loadQuestions(); 
    }
  });
});

// ==========================================
// GESTIÓN DE MÓDULOS (Sin required_score)
// ==========================================
async function loadModules() {
  const modulesTableBody = document.getElementById('modules-table-body');
  if (!modulesTableBody) return;

  const panelModules = document.getElementById('panel-modules');
  const panelHeader = panelModules.querySelector('.panel-header');
  
  if (!document.getElementById('btn-create-module')) {
    const createBtnContainer = document.createElement('div');
    createBtnContainer.style.marginBottom = '15px';
    createBtnContainer.innerHTML = `<button id="btn-create-module" class="cyber-btn" style="padding: 8px 15px; font-size: 0.9rem;">+ Nuevo Módulo</button>`;
    panelHeader.after(createBtnContainer);
    document.getElementById('btn-create-module').addEventListener('click', createModule);
  }

  modulesTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #00ffcc;">Cargando módulos...</td></tr>`;

  try {
    const { data: modules, error } = await supabase.from('modules').select('*').order('id', { ascending: true });
    if (error) throw error;

    if (!modules || modules.length === 0) {
      modulesTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8;">No hay módulos registrados.</td></tr>`;
      return;
    }

    modulesTableBody.innerHTML = '';
    modules.forEach(mod => {
      const tr = document.createElement('tr');
      const isActive = mod.is_active === true || mod.is_active === 'true';
      tr.innerHTML = `
        <td>${mod.id}</td>
        <td>${mod.slug || ''}</td>
        <td>${mod.title || ''}</td>
        <td>${mod.description || 'Sin descripción'}</td>
        <td><span style="color: ${isActive ? '#00ffcc' : '#ff4d4d'}; font-weight: bold;">${isActive ? 'Activo' : 'Inactivo'}</span></td>
        <td>
          <button class="btn-action btn-edit-module" title="Editar módulo" data-id="${mod.id}">✏️</button>
          <button class="btn-action btn-delete-module" title="Eliminar módulo" data-id="${mod.id}">🗑️</button>
        </td>
      `;
      modulesTableBody.appendChild(tr);
    });

    attachModuleActions();
  } catch (err) {
    console.error("Error al cargar módulos:", err);
    modulesTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ff4d4d;">Error al conectar con Supabase.</td></tr>`;
  }
}

async function createModule() {
  const idInput = prompt("Ingrese el ID numérico para el módulo:");
  if (!idInput) return;
  const modId = parseInt(idInput);
  if (isNaN(modId)) { alert("ID inválido."); return; }

  const slug = prompt("Ingrese el Slug del módulo:");
  if (!slug) return;
  const title = prompt("Ingrese el Título del módulo:");
  if (!title) return;
  const description = prompt("Ingrese la Descripción:") || "";
  
  const { error } = await supabase.from('modules').insert([{ 
    id: modId, 
    slug: slug.trim(), 
    title: title.trim(), 
    description: description.trim(), 
    is_active: true 
  }]);

  if (error) alert('Error: ' + error.message);
  else { 
    alert('¡Módulo creado con éxito!'); 
    loadModules(); 
    loadModuleFilterOptions(); 
  }
}

function attachModuleActions() {
  document.querySelectorAll('.btn-delete-module').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const modId = e.currentTarget.getAttribute('data-id');
      if (confirm('¿Eliminar módulo?')) {
        const { error } = await supabase.from('modules').delete().eq('id', modId);
        if (error) alert('Error: ' + error.message);
        else { 
          alert('Módulo eliminado.'); 
          loadModules(); 
          loadModuleFilterOptions(); 
        }
      }
    });
  });

  document.querySelectorAll('.btn-edit-module').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const modId = e.currentTarget.getAttribute('data-id');
      const row = e.currentTarget.closest('tr');
      const newSlug = prompt("Editar Slug:", row.children[1].innerText);
      if (newSlug === null) return;
      const newTitle = prompt("Editar Título:", row.children[2].innerText);
      if (newTitle === null) return;
      const newDesc = prompt("Editar Descripción:", row.children[3].innerText);
      if (newDesc === null) return;
      const newActive = prompt("¿Está activo? (si/no):", "si").toLowerCase() === 'si';

      const { error } = await supabase.from('modules').update({
        slug: newSlug.trim(), 
        title: newTitle.trim(), 
        description: newDesc.trim(), 
        is_active: newActive
      }).eq('id', modId);

      if (error) alert('Error: ' + error.message);
      else { 
        alert('¡Actualizado con éxito!'); 
        loadModules(); 
        loadModuleFilterOptions(); 
      }
    });
  });
}

// ==========================================
// GESTIÓN DE PREGUNTAS, FILTROS Y MODAL INTEGRADO
// ==========================================
async function loadQuestions() {
  const qTableBody = document.getElementById('questions-table-body');
  if (!qTableBody) return;

  qTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #00ffcc;">Cargando preguntas...</td></tr>`;

  try {
    const { data: questions, error } = await supabase.from('questions').select('*').order('id', { ascending: true });
    if (error) throw error;

    if (!questions || questions.length === 0) {
      qTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8;">No hay preguntas registradas.</td></tr>`;
      allQuestions = [];
      return;
    }

    allQuestions = questions;
    applyFilters();

  } catch (err) {
    console.error("Error al cargar preguntas:", err);
    qTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #ff4d4d;">Error al cargar preguntas.</td></tr>`;
  }
}

function renderQuestionsTable(questionsList) {
  const qTableBody = document.getElementById('questions-table-body');
  if (!qTableBody) return;

  if (!questionsList || questionsList.length === 0) {
    qTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8;">No se encontraron preguntas con los filtros seleccionados.</td></tr>`;
    return;
  }

  qTableBody.innerHTML = '';
  questionsList.forEach(q => {
    const tr = document.createElement('tr');
    const isActive = q.is_active === true || q.is_active === 'true';
    tr.innerHTML = `
      <td>${q.id}</td>
      <td>${q.module_id}</td>
      <td>${q.question || ''}</td>
      <td>${q.points || 10}</td>
      <td>${q.difficulty || 'medium'}</td>
      <td><span style="color: ${isActive ? '#00ffcc' : '#ff4d4d'}; font-weight: bold;">${isActive ? 'Activa' : 'Inactiva'}</span></td>
      <td>
        <button class="cyber-btn btn-toggle-options" data-id="${q.id}" style="padding: 4px 8px; font-size: 0.75rem; margin-right: 4px;">👁️ Ver Respuestas</button>
        <button class="btn-action btn-edit-q" title="Editar" data-id="${q.id}">✏️</button>
        <button class="btn-action btn-delete-q" title="Eliminar" data-id="${q.id}">🗑️</button>
      </td>
    `;
    qTableBody.appendChild(tr);
  });

  attachQuestionActions();
}

function setupQuestionFilters() {
    const searchInput = document.getElementById('search-input');
    const filterModule = document.getElementById('filter-module');
    const filterDifficulty = document.getElementById('filter-difficulty');
    const filterStatus = document.getElementById('filter-status');

    if (!searchInput || !filterModule || !filterDifficulty || !filterStatus) return;

    searchInput.addEventListener('input', applyFilters);
    filterModule.addEventListener('change', applyFilters);
    filterDifficulty.addEventListener('change', applyFilters);
    filterStatus.addEventListener('change', applyFilters);
}

function applyFilters() {
    const searchInput = document.getElementById('search-input');
    const filterModule = document.getElementById('filter-module');
    const filterDifficulty = document.getElementById('filter-difficulty');
    const filterStatus = document.getElementById('filter-status');

    const searchText = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedModule = filterModule ? filterModule.value : '';
    const selectedDifficulty = filterDifficulty ? filterDifficulty.value : '';
    const selectedStatus = filterStatus ? filterStatus.value : '';

    const filtered = allQuestions.filter(q => {
        const questionText = q.question ? q.question.toLowerCase() : '';
        const matchesSearch = questionText.includes(searchText);

        const matchesModule = selectedModule === "" || String(q.module_id) === selectedModule;
        const matchesDifficulty = selectedDifficulty === "" || q.difficulty === selectedDifficulty;

        let matchesStatus = true;
        if (selectedStatus !== "") {
            const isActive = q.is_active === true || q.is_active === 'true';
            matchesStatus = (selectedStatus === 'activo' && isActive) || (selectedStatus === 'inactivo' && !isActive);
        }

        return matchesSearch && matchesModule && matchesDifficulty && matchesStatus;
    });

    renderQuestionsTable(filtered);
}

async function loadModuleFilterOptions() {
    const selectModule = document.getElementById('filter-module');
    if (!selectModule) return;

    try {
        const { data: modules, error } = await supabase.from('modules').select('id, title').order('id', { ascending: true });
        if (error) throw error;

        let optionsHtml = '<option value="">Todos los Módulos</option>';
        if (modules) {
            modules.forEach(mod => {
                optionsHtml += `<option value="${mod.id}">Módulo ${mod.id}: ${mod.title}</option>`;
            });
        }
        selectModule.innerHTML = optionsHtml;
    } catch (err) {
        console.warn('No se pudieron cargar los módulos para el filtro.', err);
    }
}

function setupQuestionModal() {
  const btnOpenModal = document.getElementById('btn-create-question');
  const modal = document.getElementById('modal-question');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const form = document.getElementById('form-create-question');
  const selectDiff = document.getElementById('q-modal-diff');
  const inputPoints = document.getElementById('q-modal-points');

  if (!modal) return;

  if (selectDiff && inputPoints) {
    selectDiff.addEventListener('change', () => {
      const diff = selectDiff.value;
      if (diff === 'easy' || diff === 'facil') inputPoints.value = 60;
      else if (diff === 'medium' || diff === 'media') inputPoints.value = 100;
      else if (diff === 'hard' || diff === 'dificil') inputPoints.value = 150;
    });
  }

  if (btnOpenModal) {
    btnOpenModal.addEventListener('click', () => {
      modal.style.display = 'flex';
      if (selectDiff && inputPoints) {
        selectDiff.value = 'media';
        inputPoints.value = 100;
      }
    });
  }

  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', () => {
      modal.style.display = 'none';
      form.reset();
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      form.reset();
    }
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const moduleId = parseInt(document.getElementById('q-modal-module').value);
      const questionText = document.getElementById('q-modal-text').value.trim();
      const points = parseInt(inputPoints.value) || 100;
      const difficulty = selectDiff.value;

      const codeSnippetInput = document.getElementById('q-modal-code');
      const explanationInput = document.getElementById('q-modal-explanation');
      const codeSnippet = codeSnippetInput ? codeSnippetInput.value.trim() : null;
      const explanation = explanationInput ? explanationInput.value.trim() : null;

      const optionInputs = document.querySelectorAll('.q-option-input');
      const correctRadio = document.querySelector('input[name="correct_option"]:checked');
      const correctIndex = correctRadio ? parseInt(correctRadio.value) : 0;

      if (!questionText || isNaN(moduleId)) {
        alert("Por favor completa los campos obligatorios.");
        return;
      }

      try {
        const { data: newQ, error: qError } = await supabase
          .from('questions')
          .insert([{
            module_id: moduleId,
            question: questionText,
            points: points,
            difficulty: difficulty,
            code_snippet: codeSnippet || null,
            explanation: explanation || null,
            is_active: true
          }])
          .select()
          .single();

        if (qError) throw qError;

        const createdQuestionId = newQ.id;

        const optionsData = [];
        optionInputs.forEach((input, index) => {
          const text = input.value.trim();
          if (text) {
            optionsData.push({
              question_id: createdQuestionId,
              option_text: text,
              is_correct: index === correctIndex,
              order_index: index + 1
            });
          }
        });

        if (optionsData.length > 0) {
          const { error: optError } = await supabase
            .from('question_options')
            .insert(optionsData);

          if (optError) throw optError;
        }

        alert('¡Pregunta, código, explicación y opciones guardadas con éxito!');
        modal.style.display = 'none';
        form.reset();
        loadQuestions();

      } catch (err) {
        console.error("Error al registrar pregunta y opciones:", err);
        alert('Error al guardar: ' + err.message);
      }
    });
  }
}

function attachQuestionActions() {
  document.querySelectorAll('.btn-toggle-options').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const qId = e.currentTarget.getAttribute('data-id');
      const row = e.currentTarget.closest('tr');
      
      let nextRow = row.nextElementSibling;
      if (nextRow && nextRow.classList.contains('options-dropdown-row')) {
        nextRow.remove();
        return;
      }

      const { data: options, error } = await supabase
        .from('question_options')
        .select('*')
        .eq('question_id', qId)
        .order('order_index', { ascending: true });

      if (error) {
        alert('Error al cargar las respuestas: ' + error.message);
        return;
      }

      const dropdownRow = document.createElement('tr');
      dropdownRow.classList.add('options-dropdown-row');
      
      let optionsHtml = `
        <td colspan="7" style="background: rgba(15, 23, 42, 0.95); padding: 15px; border-left: 3px solid #a855f7;">
          <div style="font-weight: bold; margin-bottom: 10px; color: #a855f7; font-size: 0.95rem;">Respuestas de la Pregunta #${qId}:</div>
          <table style="width: 100%; border-collapse: collapse; background: rgba(0,0,0,0.3);">
            <thead>
              <tr style="font-size: 0.8rem; color: #94a3b8; border-bottom: 1px solid #334155;">
                <th style="padding: 6px; text-align: left;">ID Opción</th>
                <th style="padding: 6px; text-align: left;">Texto de Opción</th>
                <th style="padding: 6px; text-align: left;">¿Es Correcta?</th>
                <th style="padding: 6px; text-align: left;">Orden</th>
                <th style="padding: 6px; text-align: left;">Acción</th>
              </tr>
            </thead>
            <tbody>
      `;

      if (!options || options.length === 0) {
        optionsHtml += `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 10px;">No hay opciones registradas para esta pregunta.</td></tr>`;
      } else {
        options.forEach(opt => {
          const isCorrect = opt.is_correct === true || opt.is_correct === 'true';
          optionsHtml += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 6px;">${opt.id}</td>
              <td style="padding: 6px; color: #f8fafc;">${opt.option_text || ''}</td>
              <td style="padding: 6px; color: ${isCorrect ? '#00ffcc' : '#ff4d4d'}; font-weight: bold;">${isCorrect ? 'Correcta' : 'Incorrecta'}</td>
              <td style="padding: 6px;">${opt.order_index || 0}</td>
              <td style="padding: 6px;">
                <button class="btn-action btn-edit-inline-option" data-id="${opt.id}" data-text="${encodeURIComponent(opt.option_text || '')}" title="Editar texto de opción">✏️ Editar</button>
              </td>
            </tr>
          `;
        });
      }

      optionsHtml += `
            </tbody>
          </table>
        </td>
      `;

      dropdownRow.innerHTML = optionsHtml;
      row.after(dropdownRow);

      dropdownRow.querySelectorAll('.btn-edit-inline-option').forEach(editBtn => {
        editBtn.addEventListener('click', async (ev) => {
          const optId = ev.currentTarget.getAttribute('data-id');
          const currentText = decodeURIComponent(ev.currentTarget.getAttribute('data-text'));
          const rowOpt = ev.currentTarget.closest('tr');

          const newText = prompt("Editar texto de la respuesta:", currentText);
          if (newText === null) return;

          const newIsCorrect = confirm("¿Esta respuesta es la CORRECTA?\n\nAceptar = Sí\nCancelar = No");

          try {
            if (newIsCorrect) {
              const { error: resetError } = await supabase
                .from('question_options')
                .update({ is_correct: false })
                .eq('question_id', qId);
              
              if (resetError) throw resetError;
            }

            const { error: updateError } = await supabase
              .from('question_options')
              .update({ 
                option_text: newText.trim(),
                is_correct: newIsCorrect 
              })
              .eq('id', optId);

            if (updateError) throw updateError;

            dropdownRow.remove();
            btn.click(); 
          } catch (err) {
            console.error("Error al actualizar la opción:", err);
            alert('Error al actualizar: ' + err.message);
          }
        });
      });
    });
  });

  document.querySelectorAll('.btn-delete-q').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const qId = e.currentTarget.getAttribute('data-id');
      if (confirm('¿Estás seguro de eliminar esta pregunta? Se eliminarán también sus opciones asociadas.')) {
        const { error } = await supabase.from('questions').delete().eq('id', qId);
        if (error) alert('Error: ' + error.message);
        else { alert('Pregunta eliminada.'); loadQuestions(); }
      }
    });
  });

  document.querySelectorAll('.btn-edit-q').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const qId = e.currentTarget.getAttribute('data-id');
      const row = e.currentTarget.closest('tr');
      
      const newModuleId = prompt("Editar ID Módulo:", row.children[1].innerText);
      if (newModuleId === null) return;
      const newText = prompt("Editar Pregunta:", row.children[2].innerText);
      if (newText === null) return;
      const newPoints = prompt("Editar Puntos:", row.children[3].innerText);
      if (newPoints === null) return;
      const newDiff = prompt("Editar Dificultad (facil, media, dificil):", row.children[4].innerText);
      if (newDiff === null) return;

      const newCode = prompt("Editar Código de Ejemplo (Opcional):", "");
      if (newCode === null) return;
      const newExplanation = prompt("Editar Explicación de la respuesta (Opcional):", "");
      if (newExplanation === null) return;

      const { error } = await supabase.from('questions').update({
        module_id: parseInt(newModuleId),
        question: newText.trim(),
        points: parseInt(newPoints) || 10,
        difficulty: newDiff.trim(),
        code_snippet: newCode.trim() ? newCode.trim() : null,
        explanation: newExplanation.trim() ? newExplanation.trim() : null
      }).eq('id', qId);

      if (error) alert('Error: ' + error.message);
      else { alert('¡Pregunta actualizada con éxito!'); loadQuestions(); }
    });
  });
}

// ==========================================
// HISTORIAL DE PARTIDAS
// ==========================================
async function loadGameHistory() {
  const historyBody = document.getElementById('history-table-body');
  if (!historyBody) return;

  historyBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #00ffcc;">Cargando historial de partidas...</td></tr>`;

  try {
    // 1. Hacemos la consulta trayendo la relación con la tabla users y orden ascendente
    const { data: history, error } = await supabase
      .from('game_history')
      .select(`
        *,
        users (
          nickname,
          email
        )
      `)
      .order('id', { ascending: true });

    if (error) throw error;

    if (!history || history.length === 0) {
      historyBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #94a3b8;">No hay partidas registradas todavía.</td></tr>`;
      return;
    }

    historyBody.innerHTML = '';
    history.forEach(item => {
      const tr = document.createElement('tr');
      const passed = item.passed === true || item.passed === 'true';
      
      // 2. Extraemos el nickname del objeto relacionado (si no tiene, muestra un respaldo)
      const userNickname = item.users?.nickname || 'Sin Nickname';

      tr.innerHTML = `
        <td>${item.id}</td>
        <td style="font-weight: bold; color: #a855f7;">${userNickname}</td>
        <td>${item.module_id}</td>
        <td>${item.score_obtained || 0}</td>
        <td>${item.max_streak || 0}</td>
        <td><span style="color: ${passed ? '#00ffcc' : '#ff4d4d'}; font-weight: bold;">${passed ? 'Aprobado' : 'Reprobado'}</span></td>
        <td>${item.duration_sec || 0}s</td>
        <td>${item.played_at ? new Date(item.played_at).toLocaleString() : 'N/A'}</td>
      `;
      historyBody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error al cargar historial:", err);
    historyBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #ff4d4d;">Error al conectar con Supabase.</td></tr>`;
  }
}

// ==========================================
// RESPUESTAS DETALLE
// ==========================================
async function loadGameAnswers() {
  const answersBody = document.getElementById('answers-table-body');
  if (!answersBody) return;

  answersBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #00ffcc;">Cargando respuestas detalladas...</td></tr>`;

  try {
    const { data: answers, error } = await supabase.from('game_answers').select('*').order('id', { ascending: true });
    if (error) throw error;

    if (!answers || answers.length === 0) {
      answersBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8;">No hay registros de respuestas todavía.</td></tr>`;
      return;
    }

    answersBody.innerHTML = '';
    answers.forEach(ans => {
      const tr = document.createElement('tr');
      const isCorrect = ans.is_correct === true || ans.is_correct === 'true';
      tr.innerHTML = `
        <td>${ans.id}</td>
        <td>${ans.history_id}</td>
        <td>${ans.question_id}</td>
        <td>${ans.option_id}</td>
        <td><span style="color: ${isCorrect ? '#00ffcc' : '#ff4d4d'}; font-weight: bold;">${isCorrect ? 'Sí' : 'No'}</span></td>
        <td>${ans.points_earned || 0}</td>
        <td>${ans.time_left || 0}s</td>
      `;
      answersBody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error al cargar respuestas:", err);
    answersBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #ff4d4d;">Error al conectar con Supabase.</td></tr>`;
  }
}
