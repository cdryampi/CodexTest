# React Tailwind Blog

Proyecto de blog clásico construido con **React**, **Vite**, **Tailwind CSS**, **Flowbite** y **React Router DOM**. Incluye una configuración de CI/CD con **GitHub Actions** para desplegar automáticamente en **GitHub Pages**.

## Características principales

- Frontend moderno creado con Vite y React 18.
- Estilos utilitarios con Tailwind CSS y componentes accesibles de Flowbite React.
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

## Solución de problemas

- **Errores 403 al instalar dependencias**: verifica que tu entorno tenga acceso al registro de npm (https://registry.npmjs.org). Si trabajas detrás de un proxy, configura las variables `npm_config_proxy` y `npm_config_https_proxy` o consulta con tu equipo de infraestructura.
- **El comando `npm run dev` no encuentra `vite`**: asegúrate de ejecutar `npm install` o `npm ci` antes de iniciar el servidor de desarrollo para que se descarguen las dependencias necesarias.

## Personalización

- Actualiza los archivos en `src/data/` para modificar posts y comentarios.
- Ajusta los componentes en `src/pages/` y `src/components/` para adaptar el contenido o estilo.
- Si cambias el nombre del repositorio, actualiza la propiedad `base` en `vite.config.js` y el basename del `BrowserRouter` en `src/main.jsx`.

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Siéntete libre de adaptarlo a tus necesidades.
