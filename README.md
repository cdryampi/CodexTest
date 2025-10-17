# React Tailwind Blog

Proyecto de blog clásico construido con **React**, **Vite**, **Tailwind CSS**, **Flowbite** y **React Router DOM**. Incluye una configuración de CI/CD con **GitHub Actions** para desplegar automáticamente en **GitHub Pages**.

## Características principales

- Frontend moderno creado con Vite y React 18.
- Estilos utilitarios con Tailwind CSS y componentes accesibles de Flowbite React.
- Modo oscuro/claro con persistencia en `localStorage` y compatibilidad con Flowbite.
- Heroicons integrados en la navegación, tarjetas y comentarios para reforzar la jerarquía visual.
- Tarjetas de posts enriquecidas con imágenes responsivas y efectos de interacción.
- Navegación dinámica mediante React Router DOM v6.
- Datos estáticos almacenados en archivos JSON para posts y comentarios.
- Flujo de despliegue automatizado hacia GitHub Pages desde la rama `main`.

## Requisitos previos

- [Node.js](https://nodejs.org/) versión 18 o superior.
- npm (se instala con Node.js).

## Instalación

```bash
npm install
```

## Ejecutar en modo desarrollo

```bash
npm run dev
```

El comando anterior inicia Vite en modo desarrollo. Abre la URL indicada en la terminal (por defecto `http://localhost:5173/`).

## Generar build de producción

```bash
npm run build
```

Para revisar el build localmente puedes ejecutar:

```bash
npm run preview
```

## Despliegue automático con GitHub Actions

1. Asegúrate de que el repositorio en GitHub se llame **react-tailwind-blog**.
2. Habilita GitHub Pages en la rama `gh-pages` desde la configuración del repositorio.
3. Cada vez que hagas push a `main`, el workflow `deploy.yml`:
   - Instalará dependencias con `npm ci`.
   - Compilará el proyecto con `npm run build`.
   - Publicará el contenido de `dist/` en la rama `gh-pages` mediante [JamesIves/github-pages-deploy-action@v4](https://github.com/JamesIves/github-pages-deploy-action).

## Personalización

- Actualiza los archivos en `src/data/` para modificar posts y comentarios.
- Ajusta los componentes en `src/pages/` y `src/components/` para adaptar el contenido o estilo.
- Si cambias el nombre del repositorio, actualiza la propiedad `base` en `vite.config.js` y el basename del `BrowserRouter` en `src/main.jsx`.

## Experiencia de usuario

- El botón de modo oscuro se encuentra en la barra de navegación y sincroniza la preferencia con el almacenamiento local.
- Los íconos provienen de [@heroicons/react](https://github.com/tailwindlabs/heroicons) y se utilizan para comunicar acciones y metadatos de forma visual.
- Cada tarjeta de post utiliza imágenes en formato SVG descargadas de Wikimedia Commons, almacenadas localmente y optimizadas para la web.

## Búsqueda, filtros y paginación

- El listado de posts admite búsqueda instantánea con [Fuse.js](https://fusejs.io/) sobre el título, resumen, contenido y etiquetas.
- Puedes combinar la búsqueda con un filtro multiselección por etiquetas; los cambios se reflejan en la URL (`?q=`, `&tags=` y `&page=`) y se recuerdan automáticamente en `localStorage` (`blog:list:state`).
- Los atajos `/` (enfocar) y `Esc` (limpiar y desenfocar) permiten interactuar con el buscador sin usar el mouse.
- La paginación muestra 6 entradas por página e incluye navegación anterior/siguiente con mantenimiento del estado entre recargas.

### Pruebas manuales recomendadas

1. Buscar por palabras específicas del contenido y validar que los resultados se actualizan al escribir.
2. Seleccionar varias etiquetas, comprobar que solo se muestran los posts relacionados y que la URL incluye `tags=`.
3. Recargar la página y verificar que se conserva la última búsqueda, filtros y página activa.
4. Cambiar de página y usar los botones Atrás/Adelante del navegador para confirmar que el estado se sincroniza correctamente.
5. Forzar una búsqueda sin resultados para visualizar el estado vacío y restablecer filtros desde el botón disponible.

## Imágenes y licencias

- Las ilustraciones de los posts se descargan de [Wikimedia Commons](https://commons.wikimedia.org/) y se almacenan localmente en `public/images/<slug>/` para evitar el hotlinking.
- Cada carpeta de imágenes incluye un archivo `CREDITS.md` con el autor, el título original, la URL de referencia y la licencia de uso correspondiente.
- Las imágenes licenciadas como **CC BY-SA 4.0** (Tailwind CSS Logo) requieren mantener la atribución indicada en `CREDITS.md` y compartirse bajo los mismos términos.
- Las imágenes con licencia **CC0 1.0** (Minimal traffic light icon symbol) pueden reutilizarse sin restricciones, pero se conserva la referencia para mantener el contexto.
- El logotipo de React se distribuye como texto en **dominio público**; ten en cuenta que sigue siendo una marca registrada de Facebook/Meta y se debe respetar el uso de la marca.
- En `src/data/posts.json` se añadió metadata de accesibilidad y procedencia (`image`, `imageAlt`, `imageSource`, `author`, `license`, `licenseUrl`) para que la interfaz y cualquier consumidor adicional de los datos disponga de la información necesaria.

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Siéntete libre de adaptarlo a tus necesidades.
