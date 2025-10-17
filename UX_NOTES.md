# Notas de UX/UI

Este documento resume los criterios utilizados para mejorar la experiencia visual del proyecto.

## Tema oscuro adaptable
- Se creó el hook `useTheme` (`src/hooks/useTheme.js`) para centralizar la lógica de detección, almacenamiento y alternancia del tema.
- La preferencia se guarda en `localStorage` bajo la clave `blog-theme-preference` y se refleja en el elemento `<html>` mediante la clase `dark`.
- Se añadió soporte `darkMode: 'class'` en `tailwind.config.js` para que todas las utilidades puedan responder al cambio de tema.

## Integración de Heroicons
- Se añadió la dependencia `@heroicons/react` para incorporar iconografía consistente con Tailwind.
- Los íconos se utilizan en la navegación principal, tarjetas de posts, metadatos (autor, fecha, comentarios) y el footer para guiar la lectura.

## Tarjetas con imágenes y animaciones
- Cada entrada de `src/data/posts.json` ahora incluye una imagen de referencia (`imagen`) y un texto alternativo (`imagenAlt`).
- Las tarjetas (`Home.jsx`) emplean `imgSrc` de Flowbite `Card` para mantener accesibilidad y responsividad.
- Se añadieron transiciones y efectos `hover` suaves (`hover:-translate-y-1`, `hover:shadow-2xl`, `duration-300`) para mejorar la sensación de fluidez.

## Navegación y footer enriquecidos
- El `NavBar` incorpora un botón visible para alternar el tema y enlaces con íconos descriptivos.
- Se actualizó el footer (`src/components/Footer.jsx`) con enlaces sociales, íconos y textos de soporte para cerrar la experiencia.

## Accesibilidad
- Se emplean etiquetas `aria-label`, `aria-pressed` y texto oculto (`sr-only`) en el botón de modo oscuro y en los enlaces del footer.
- Las imágenes incluyen atributos `alt` descriptivos y se cargan en modo `lazy` para optimizar el rendimiento.

Estas mejoras apuntan a un interfaz más moderna, accesible y alineada con las buenas prácticas de Tailwind + Flowbite.
