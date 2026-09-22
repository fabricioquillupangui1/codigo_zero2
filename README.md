# Código Zero 2

Proyecto web de aprendizaje basado en módulos, preguntas y retos de programación. El backend está desarrollado con Node.js y Express, y usa Supabase como base de datos.

## Tecnologías

- Node.js
- Express
- Supabase
- JavaScript vanilla para frontend

## Funcionalidades

- Landing page principal
- Sistema de login y autenticación
- Módulos de aprendizaje
- Preguntas y respuestas con feedback
- Panel administrativo para gestionar contenido
- Integración con Supabase para persistencia de datos

## Requisitos

- Node.js 18 o superior
- npm
- Cuenta de Supabase activa

## Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/fabricioquillupangui1/codigo_zero2.git
   cd codigo_zero2
   ```

2. Instala dependencias:
   ```bash
   npm install
   ```

3. Crea tu archivo `.env` a partir de `.env.example`:
   ```bash
   copy .env.example .env
   ```

4. Configura tus variables en `.env`:
   ```env
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_KEY=tu-clave-anonimo-o-service-role
   PORT=3000
   ```

5. Inicia la aplicación:
   ```bash
   npm start
   ```

La aplicación quedará disponible en:

```text
http://localhost:3000
```

## Estructura del proyecto

```text
codigo_zero2/
├── public/               # Frontend estático
├── src/
│   ├── config/           # Configuración de Supabase
│   ├── routes/           # Rutas de la API
│   └── server.js         # Servidor principal
├── .env.example          # Variables de entorno de ejemplo
├── .gitignore            # Archivos ignorados por Git
├── package.json          # Scripts y dependencias
├── README.md             # Documentación del proyecto
└── package-lock.json     # Lockfile de npm
```

## Scripts disponibles

```bash
npm start
```

Ejecuta el servidor principal de la aplicación.

## Nota

Este proyecto requiere un proyecto de Supabase con las tablas necesarias para módulos y preguntas. Ajusta la estructura de tu base de datos según el diseño de la aplicación.
