# AGENTE DE GENERACIÓN – BLOG REACT + TAILWIND + FLOWBITE + GITHUB PAGES

Tu tarea es crear un nuevo repositorio desde cero con una aplicación web de un blog clásico, construido únicamente con frontend en React, usando JavaScript y npm. Debe incluir Tailwind CSS, Flowbite, React Router y CI/CD configurado con GitHub Actions para desplegar automáticamente en GitHub Pages al hacer push en la rama main.

Desarrolla el proyecto completo con todos sus archivos, carpetas y configuraciones necesarias. No omitas nada. El resultado debe estar listo para clonar, ejecutar y desplegar.

---

## INSTRUCCIONES DE DESARROLLO

1. Crea una aplicación React moderna usando Vite y JavaScript.
2. Configura Tailwind CSS completamente integrado.
3. Instala y configura Flowbite y Flowbite React para los componentes UI.
4. Usa npm como gestor de paquetes.
5. Implementa React Router DOM versión 6 para la navegación.

---

## ESTRUCTURA Y FUNCIONALIDAD

- La página principal debe listar todas las entradas del blog.
- Cada entrada debe tener un título, resumen y enlace a su post individual.
- Cada post debe mostrar su contenido completo y comentarios asociados.
- Los comentarios y posts deben estar en archivos JSON locales en la carpeta src/data.
- Implementa un componente Navbar con Flowbite React, responsivo y simple.
- El diseño debe ser limpio, moderno y responsivo.
- No hay backend ni base de datos, todo es estático.

---

## REQUISITOS DE CONFIGURACIÓN

### Tailwind
- Añade rutas de contenido incluyendo node_modules/flowbite/**/*.js.
- Incluye el plugin de Flowbite en la configuración.
- Habilita estilos base, componentes y utilidades.

### Vite
- Configura el plugin de React.
- Define la propiedad base para GitHub Pages, usando el nombre del repositorio.
- Asegúrate que BrowserRouter use basename con import.meta.env.BASE_URL.

### GitHub Actions
- Crea un workflow en .github/workflows/deploy.yml que:
  1. Se ejecute en cada push a main.
  2. Instale dependencias con npm ci.
  3. Compile el proyecto con npm run build.
  4. Despliegue el contenido de dist/ a la rama gh-pages usando JamesIves/github-pages-deploy-action@v4.
  5. Use el token GITHUB_TOKEN y permisos contents: write.

---

## ESTRUCTURA DEL REPOSITORIO

- package.json con scripts: dev, build y preview.
- vite.config.js configurado con base y plugin React.
- tailwind.config.js y postcss.config.js correctamente configurados.
- index.html con un div#root y enlace al script principal.
- src/ con:
  - index.css con Tailwind y Flowbite importados.
  - main.jsx que monta App.
  - App.jsx con configuración de rutas.
  - components/NavBar.jsx con Flowbite.
  - pages/Home.jsx para listado de posts.
  - pages/Post.jsx para detalle y comentarios.
  - data/posts.json y data/comments.json con contenido de ejemplo.
- .gitignore estándar.
- .github/workflows/deploy.yml configurado.
- README.md explicando stack, ejecución local, build y despliegue automático.

---

## REGLAS DE DESARROLLO

- Todo en JavaScript, sin TypeScript.
- Código limpio, comentado y modular.
- Interfaz en español.
- Todo debe funcionar con:
  - npm install
  - npm run dev
  - npm run build
- El despliegue debe ocurrir automáticamente al hacer push en main.
- Usa clases de Tailwind y componentes de Flowbite React para toda la UI.
- README.md debe incluir pasos de instalación, ejecución, build y deploy.

---

## RESULTADO ESPERADO

Un proyecto funcional y completo que al clonarse e instalarse pueda ejecutarse localmente y desplegarse automáticamente en GitHub Pages.

La salida final debe incluir todo el código fuente del proyecto completo, con todos los archivos necesarios, en formato Markdown con nombres de archivo indicados y contenido completo.

---

**Idioma del proyecto:** Español  
**Gestor de paquetes:** npm  
**Framework:** React + Vite  
**Estilos:** Tailwind CSS + Flowbite  
**CI/CD:** GitHub Actions → GitHub Pages  
**Repositorio:** react-tailwind-blog
