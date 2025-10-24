# Componentes y utilidades de RBAC

Este directorio agrupa los componentes de autorización que dependen del estado global de autenticación (`frontend/src/store/auth.js`). Usa estos helpers para garantizar una experiencia consistente en todo el panel.

## Componentes disponibles

### `ProtectedRoute`
- Envuelve rutas privadas en el router.
- Acepta `allowedRoles` (array de roles permitidos) y `fallback` (ruta o componente a renderizar si no hay acceso; por defecto `/forbidden`).
- Mientras la sesión se resuelve (`status === 'loading'`), muestra `RbacSkeleton`.
- Si el usuario no cumple los requisitos redirige al fallback y emite el toast unificado definido en `utils/notifications.js`.

### `Can`
- Renderiza condicionalmente sus `children` en función de permisos (`permission`) o roles (`roles`).
- Acepta `fallback` para mostrar contenido alternativo cuando la condición no se cumple.
- Usa las funciones de `utils/rbac.js` para normalizar y evitar duplicar lógica.

### `IfRole`
- Azúcar sintáctico sobre `Can` centrado únicamente en roles.
- Ideal para mostrar/ocultar secciones de navegación, botones o bloques de UI según el rol actual.

### `RoleBadge`
- Badge estilizado que muestra el rol principal del usuario con colores predefinidos.
- La etiqueta se resuelve mediante i18n (`roles.*`) para mantenerse sincronizada con el idioma de la interfaz.

## Flujo de datos

- El store `frontend/src/store/auth.js` expone `fetchMe()`, `setUser()` y `logout()`.
- `fetchMe()` se ejecuta **una sola vez** al montar el `AuthProvider` (`frontend/src/context/AuthContext.jsx`), que consume `/api/me/` a través de `services/api.js` y populariza usuario, roles y permisos.
- Los componentes de RBAC leen el estado mediante `useAuthStore` y no realizan peticiones adicionales.

## Buenas prácticas

- Usa los helpers de `utils/rbac.js` (`canEditPost`, `getAuthorRestrictionMessage`, etc.) para encapsular la lógica de permisos. Evita comprobar roles o permisos con strings sueltos en los componentes.
- Para mensajes y toasts reutiliza `utils/notifications.js` (`getRoleRequirementMessage`, `getPermissionRequirementMessage`, `showUnauthorizedToast`, ...). Así garantizas traducciones consistentes en ES/EN.
- Cuando bloquees acciones, combina los helpers anteriores con tooltips accesibles (`aria-describedby`) y evita que los botones deshabilitados sean focuseables (`tabIndex={-1}`).
- Mantén sincronizado el texto visible con las claves de i18n incluidas en `i18n/locales/*/common.json`.

