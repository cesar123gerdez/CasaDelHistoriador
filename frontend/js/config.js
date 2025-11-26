// Archivo de configuración para el frontend
// Define la URL base de la API (backend). Por defecto vacío -> mismo origen.
// Al desplegar, cambia esta constante por la URL pública de tu backend, p.e:
// const API_BASE = 'https://mi-backend.onrender.com';
const API_BASE = '';

// Nota: Este archivo se carga antes de `app.js` en `index.html` para que
// `API_BASE` esté disponible globalmente. Si lo subes a Cloudflare Pages
// o Netlify puedes ajustar esta variable desde el entorno si lo deseas.
