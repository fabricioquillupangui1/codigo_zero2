import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

// 1. Obtener todos los usuarios del sistema
router.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('id, nickname, email, role, dls_score, unlocked_level, created_at');
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Crear una nueva pregunta con sus opciones
router.post('/questions', async (req, res) => {
  const { module_id, question, code_snippet, explanation, points, difficulty, options } = req.body;
  
  try {
    // Insertar pregunta
    const { data: qData, error: qError } = await supabase
      .from('questions')
      .insert([{ module_id, question, code_snippet, explanation, points, difficulty }])
      .select()
      .single();

    if (qError) throw qError;

    // Insertar sus opciones asociadas
    if (options && options.length > 0) {
      const optionsFormatted = options.map((opt, idx) => ({
        question_id: qData.id,
        option_text: opt.text,
        is_correct: opt.is_correct,
        order_index: idx + 1
      }));

      const { error: optError } = await supabase.from('question_options').insert(optionsFormatted);
      if (optError) throw optError;
    }

    res.json({ success: true, message: 'Pregunta creada correctamente', questionId: qData.id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Modificar estado de un módulo (Activo / Inactivo)
router.patch('/modules/:id/status', async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  try {
    const { data, error } = await supabase
      .from('modules')
      .update({ is_active })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json({ success: true, message: 'Estado del módulo actualizado', data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;