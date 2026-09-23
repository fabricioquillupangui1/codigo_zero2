import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

// Enviar y evaluar una partida completa jugada
router.post('/submit-game', async (req, res) => {
  // Recibimos los datos del frontend
  const { userId, moduleId, answers, durationSec } = req.body; 
  // answers es un array de objetos: [{ questionId, optionId, timeLeft }]

  try {
    let correctCount = 0;
    let totalCalculatedScore = 0;
    const evaluatedAnswers = [];

    // Validamos que lleguen datos básicos
    if (!userId || !moduleId || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Datos incompletos en la solicitud.' });
    }

    // 1. Validar cada respuesta contra la base de datos y asignar puntos por dificultad (facil: 60, media: 100, dificil: 150)
    for (const ans of answers) {
      if (!ans.optionId || !ans.questionId) continue;

      const { data: optionData, error: optError } = await supabase
        .from('question_options')
        .select('is_correct')
        .eq('id', ans.optionId)
        .single();

      if (optError) continue;

      const isCorrect = optionData ? optionData.is_correct : false;
      let earned = 0;

      if (isCorrect) {
        correctCount++;

        // Consultamos la pregunta para obtener su dificultad
        const { data: questionData, error: qError } = await supabase
          .from('questions')
          .select('difficulty, points')
          .eq('id', ans.questionId)
          .single();

        if (!qError && questionData) {
          const diff = (questionData.difficulty || '').toLowerCase().trim();
          
          if (diff === 'facil' || diff === 'easy') {
            earned = 60;
          } else if (diff === 'media' || diff === 'medium') {
            earned = 100;
          } else if (diff === 'dificil' || diff === 'hard') {
            earned = 150;
          } else {
            earned = questionData.points || 100; // Respaldo por defecto
          }
        } else {
          earned = 100; // Respaldo si no encuentra la pregunta
        }
      } else {
        earned = 0; // Si falla, suma 0
      }

      totalCalculatedScore += earned;

      evaluatedAnswers.push({
        question_id: ans.questionId,
        option_id: ans.optionId,
        is_correct: isCorrect,
        points_earned: earned,
        time_left: ans.timeLeft || 0
      });
    }

    const finalScoreToSave = totalCalculatedScore;
    
    // Criterio de aprobación (ej: 250 puntos)
    const passed = finalScoreToSave >= 250; 

    // 2. Guardar en la tabla transaccional game_history
    const { data: historyData, error: historyError } = await supabase
      .from('game_history')
      .insert([{
        user_id: userId,
        module_id: moduleId,
        score_obtained: finalScoreToSave,
        passed: passed,
        duration_sec: durationSec || 60
      }])
      .select()
      .single();

    if (historyError) {
      console.error('Error al insertar en game_history:', historyError.message);
      throw historyError;
    }

    // 3. Guardar el detalle de respuestas en game_answers
    const historyId = historyData.id;
    const answersToInsert = evaluatedAnswers.map(item => ({
      history_id: historyId,
      ...item
    }));

    if (answersToInsert.length > 0) {
      const { error: answersError } = await supabase
        .from('game_answers')
        .insert(answersToInsert);

      if (answersError) {
        console.error('Error al insertar en game_answers:', answersError.message);
        throw answersError;
      }
    }

    // 4. Actualizar el puntaje total DLS y nivel desbloqueado del usuario
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('dls_score, unlocked_level')
      .eq('id', userId)
      .single();

    if (currentUser && !userError) {
      const newTotalScore = (currentUser.dls_score || 0) + finalScoreToSave;
      const nextLevel = passed && moduleId >= currentUser.unlocked_level ? currentUser.unlocked_level + 1 : currentUser.unlocked_level;

      await supabase
        .from('users')
        .update({ dls_score: newTotalScore, unlocked_level: nextLevel })
        .eq('id', userId);
    }

    return res.json({
      success: true,
      scoreObtained: finalScoreToSave,
      passed,
      correctCount,
      totalQuestions: evaluatedAnswers.length
    });

  } catch (err) {
    console.error('Excepción general en /submit-game:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
