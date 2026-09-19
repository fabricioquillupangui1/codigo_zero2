import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Configuración de Supabase con tus credenciales reales del proyecto
const SUPABASE_URL = 'https://adrbtyxwptmqxjiasfdb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkcmJ0eXh3cHRtcXhqaWFzZmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NjQ3NzUsImV4cCI6MjEwNTM0MDc3NX0.f3aZO-jd72iw5KZ8xp6iLxR8GbyioWjTr4VI-GN-3f4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Función auxiliar para encriptar la contraseña a SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const avatarGrid = document.querySelector('.avatar-grid');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const togglePasswordBtns = document.querySelectorAll('.toggle-password');
  const alertBox = document.getElementById('auth-alert');

  // Estado del Avatar Seleccionado
  let selectedAvatar = 'gatito.dev';

  // 1. Selección de Avatar (.closest)
  if (avatarGrid) {
    avatarGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.avatar-select-card');
      if (!card) return;

      document.querySelectorAll('.avatar-select-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      selectedAvatar = card.dataset.avatar;
      console.log('⚡ Avatar seleccionado:', selectedAvatar);
    });
  }

  // 2. Cambio de Pestañas (Login / Registro)
  if (tabBtns.length > 0) {
    tabBtns.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const isLogin = btn.dataset.tab === 'login' || index === 0;

        if (isLogin) {
          loginForm?.classList.remove('hidden');
          registerForm?.classList.add('hidden');
        } else {
          loginForm?.classList.add('hidden');
          registerForm?.classList.remove('hidden');
        }
        hideAlert();
      });
    });
  }

  // 3. Mostrar / Ocultar Contraseña
  togglePasswordBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const button = e.currentTarget || e.target.closest('.toggle-password');
      if (!button) return;

      const targetId = button.getAttribute('data-target');
      let input = targetId ? document.getElementById(targetId) : null;

      if (!input) {
        const wrapper = button.closest('.password-wrapper');
        input = wrapper?.querySelector('input');
      }

      if (input) {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        button.textContent = isPassword ? 'ocultar' : '👁️';
      }
    });
  });

  // 4. Registro Directo a Supabase
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      const nickname = document.getElementById('reg-nickname').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const passwordPlain = document.getElementById('reg-password').value;

      try {
        const passwordHashed = await hashPassword(passwordPlain);

        // Verificar si el correo ya existe
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (existingUser) {
          showAlert('Este correo electrónico ya está registrado.');
          return;
        }

        const newUser = {
          nickname: nickname,
          email: email,
          password: passwordHashed,
          avatar: selectedAvatar,
          role: 'student',
          dls_score: 0,
          unlocked_level: 1
        };

        const { data, error } = await supabase
          .from('users')
          .insert([newUser])
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }

        console.log('✅ Jugador registrado con éxito:', data);
        alert('¡Jugador registrado exitosamente! Ahora inicia sesión.');

        registerForm.reset();
        registerForm.classList.add('hidden');
        loginForm?.classList.remove('hidden');

        document.getElementById('tab-login')?.classList.add('active');
        document.getElementById('tab-register')?.classList.remove('active');

      } catch (err) {
        console.error('Error al registrar:', err);
        showAlert(err.message || 'Error al completar el registro.');
      }
    });
  }

  // 5. Inicio de Sesión Directo a Supabase
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      const email = document.getElementById('login-email').value.trim();
      const passwordPlain = document.getElementById('login-password').value;

      try {
        const passwordHashed = await hashPassword(passwordPlain);

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .eq('password', passwordHashed)
          .single();

        if (error || !data) {
          throw new Error('Credenciales incorrectas o usuario no encontrado.');
        }

        console.log('✅ Sesión iniciada:', data);

        localStorage.setItem('cz_user', JSON.stringify(data));
        
        if (data.role === 'admin') {
          window.location.replace('admin.html');
        } else {
          window.location.replace('levels.html');
        }

      } catch (err) {
        console.error('Error al iniciar sesión:', err);
        showAlert(err.message || 'Credenciales no válidas.');
      }
    });
  }

  function showAlert(msg) {
    if (alertBox) {
      alertBox.textContent = msg;
      alertBox.style.display = 'block';
    } else {
      alert(msg);
    }
  }

  function hideAlert() {
    if (alertBox) {
      alertBox.style.display = 'none';
      alertBox.textContent = '';
    }
  }
});