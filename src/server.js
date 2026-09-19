import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './config/supabase.js';

import adminRoutes from './routes/admin.routes.js';
import gameRoutes from './routes/game.routes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Registrar rutas modularizadas
app.use('/api/admin', adminRoutes);
app.use('/api/game', gameRoutes);

// Rutas base de módulos existentes
app.get('/api/modules', async (req, res) => {
  try {
    const { data, error } = await supabase.from('modules').select('*').order('order_index');
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/modules/:id/questions', async (req, res) => {
  const moduleId = req.params.id;
  try {
    const { data, error } = await supabase
      .from('questions')
      .select(`id, question, code_snippet, explanation, points, difficulty, question_options (id, option_text, is_correct)`)
      .eq('module_id', moduleId);

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 CÓDIGO ZERO backend activo en el puerto ${PORT}`);
});