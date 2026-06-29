
---

# Stack Tecnológico — Módulo de Gestión Web Multirol (JetPass Admin Dashboard)

## 1. Rol del Módulo en la Arquitectura General

Antes de entrar en el stack, es necesario situar este componente dentro del ecosistema. El módulo de gestión web multirol es el **segundo punto de operación en el ciclo de vida de un plan de vuelo**. Una vez que el piloto crea y envía el plan desde la aplicación móvil, este dashboard es donde la autoridad del espacio aéreo y el operador del aeródromo de destino evalúan, aprueban o rechazan ese plan de forma concurrente.

Lo que eso implica técnicamente es importante: este módulo **no posee lógica de negocio propia**. No persiste datos, no evalúa reglas aeronáuticas, no genera notificaciones. Es una capa de presentación e interacción que consume el **Jetpass Backend Core** (FastAPI), delegando completamente la transaccionalidad, los permisos, las transiciones de estado y la persistencia a ese núcleo. El stack tecnológico elegido refleja exactamente esa naturaleza: un cliente web de alta calidad UX, reactivo, tipado y desacoplado de la infraestructura de datos.

---

## 2. Framework Base: Next.js 16 con App Router

### La elección

El proyecto corre sobre **Next.js 16.2.7** utilizando el **App Router**, el modelo de enrutamiento basado en el sistema de archivos introducido como estable en Next.js 13 y que para la versión 16 ya es el camino principal del framework.

### Por qué Next.js y no una SPA pura (Vite + React)

La primera pregunta válida es: si este módulo es esencialmente un dashboard que consume una API externa, ¿por qué no usar simplemente Vite con React Router o un bundler minimalista?

La respuesta tiene tres dimensiones:

**Estructura y convenciones de proyecto.** Next.js impone una estructura de carpetas (el directorio `app/`) que mapea directamente a las rutas de la aplicación. Esto elimina la necesidad de configurar un router manualmente y hace que cualquier desarrollador que ingrese al proyecto entienda la estructura sin necesidad de documentación adicional. En un proyecto académico/profesional con ciclo de vida extendido, este factor de mantenibilidad es relevante.

**Preparación para escalar hacia RSC.** Aunque en su estado actual el dashboard opera principalmente en modo cliente (`"use client"` prevalente), el haber elegido Next.js con App Router deja la puerta abierta a migrar componentes hacia **React Server Components** en el futuro. Si en algún momento se decide agregar una capa BFF (Backend For Frontend) dentro del mismo proyecto — por ejemplo, para pre-procesar datos del backend de FastAPI antes de enviarlos al cliente — esa arquitectura ya está soportada sin cambiar el framework. Esta es una decisión de apertura: no se paga el costo ahora, pero tampoco se cierra la posibilidad.

**Funcionalidades integradas sin configuración.** Next.js provee out-of-the-box: optimización de fuentes via `next/font`, manejo de variables de entorno con distinción `NEXT_PUBLIC_` vs privadas, generación de metadata por página, y un servidor de desarrollo con Fast Refresh. En Vite puro, cada uno de estos puntos requiere configuración o plugins adicionales.

### Por qué App Router y no Pages Router

El Pages Router es el sistema de enrutamiento heredado de Next.js. Si bien continúa siendo soportado, el App Router representa el modelo conceptual moderno del framework, alineado con React 19 y el paradigma de componentes de servidor. Optar por el App Router desde el inicio posiciona al proyecto en el camino de menores fricciones a futuro, especialmente ante actualizaciones del ecosistema.

Dentro del App Router, la estructura del dashboard expone tres niveles:

```
app/
├── page.tsx            # Redirect hub raíz
├── login/
│   └── page.tsx        # Pantalla de autenticación
└── dashboard/
    ├── layout.tsx      # Guard de autenticación + shell visual
    ├── page.tsx        # Tabla de planes pendientes
    └── [id]/
        └── page.tsx    # Vista de detalle de un plan
```

Esta arquitectura de layouts anidados es una de las fortalezas del App Router: el `dashboard/layout.tsx` actúa como guardia de autenticación y envuelve las rutas protegidas, mientras que el layout raíz gestiona los providers globales. Es un patrón limpio y sin repetición.

---

## 3. Lenguaje: TypeScript 5 en Modo Estricto

### La elección

Todo el código fuente está escrito en **TypeScript 5** con `strict: true` en `tsconfig.json`. Esto activa un conjunto de verificaciones adicionales: `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, entre otras.

### Justificación

En un sistema de gestión de planes de vuelo, la **corrección semántica de los datos** es crítica. Un plan de vuelo contiene decenas de campos: códigos ICAO de aeródromos, categorías de turbulencia de estela, identificadores de aeronave, coordenadas de ruta, niveles de crucero. Todos estos datos tienen formatos y restricciones específicos.

TypeScript permite modelar el contrato de la API con precisión. El archivo `src/types/api.ts` define toda la capa de tipos compartidos del módulo: enums para los estados del plan (`FlightPlanStatus`), para los actores de aprobación (`FlightPlanApprovalActor`), para las reglas de vuelo (`FlightRules`), e interfaces completas para cada entidad del dominio (`FlightPlanDetail`, `FlightPlanApproval`, `UserPublic`). Estos tipos se generan en concordancia con el `openapi.json` del backend, lo que establece un contrato tipado entre ambas capas.

El alias de path `@/*` → `./src/*` configurado en `tsconfig.json` es una convención que mejora la legibilidad de los imports al eliminar rutas relativas profundas (`../../lib/api/client` vs `@/lib/api/client`).

---

## 4. React 19 y el Modelo de Componentes

### La elección

El proyecto usa **React 19.2.4**, la versión más reciente del framework al momento del desarrollo.

### Qué aporta React 19 en este contexto

React 19 introduce mejoras al compilador (aunque el React Compiler como plugin separado no está activado en este proyecto), refinamientos en el sistema de transiciones, y alineación profunda con el modelo de React Server Components. Pero más relevante para este dashboard específico es la consolidación del hook `use()` y las mejoras en el rendimiento del reconciliador.

El patrón de arquitectura predominante en este módulo es el de **componentes de cliente puros**. Prácticamente cada archivo relevante comienza con la directiva `"use client"`. Esto es una decisión consciente que refleja la naturaleza del problema: el dashboard es interactivo en casi todos sus aspectos. Muestra spinners de carga mientras consulta la API, reacciona a clics del usuario para aprobar o rechazar planes, actualiza la caché de datos inmediatamente tras una mutación. Todo eso requiere estado en el cliente.

---

## 5. Estilos: Tailwind CSS v4 y el Paradigma Utility-First

### La elección

El sistema de estilos usa **Tailwind CSS v4** con la integración `@tailwindcss/postcss`. La diferencia fundamental respecto a versiones anteriores es que **no existe un archivo `tailwind.config.js`**. La configuración del tema, las variables CSS y las personalizaciones se definen directamente en `src/app/globals.css`, alineado con el nuevo modelo de Tailwind v4 que trata el CSS como la fuente de verdad.

### Por qué Tailwind y no CSS Modules o styled-components

**Velocidad de desarrollo con consistencia visual.** Tailwind permite construir interfaces complejas escribiendo clases directamente en el JSX sin necesidad de nombrar selectores o crear archivos CSS separados. En un proyecto donde el foco está en la funcionalidad del dominio aeronáutico, reducir la fricción del ciclo de diseño-implementación tiene valor concreto.

**Escalabilidad y mantenimiento.** Las clases utility-first son co-locadas con el markup, lo que elimina el problema de CSS muerto (estilos que nadie usa pero nadie se atreve a borrar). El build de producción de Tailwind es extremadamente pequeño porque solo incluye las clases efectivamente usadas.

**Integración nativa con el ecosistema shadcn.** La biblioteca de componentes elegida (shadcn/ui) está construida sobre Tailwind. Sus tokens de diseño, variantes y animaciones usan el sistema de variables CSS de Tailwind, por lo que la integración es directa.

---

## 6. Componentes UI: shadcn/ui con Base UI (`base-nova`)

### La elección

La capa de componentes reutilizables usa **shadcn/ui** con el preset `base-nova`, configurado en `components.json`. A diferencia del preset por defecto que usa Radix UI como primitivas headless, `base-nova` usa **`@base-ui/react` v1.5.0** — la biblioteca de componentes sin estilo mantenida directamente por el equipo de MUI.

El proyecto tiene 14 componentes UI instalados en `src/components/ui/`: `Avatar`, `Badge`, `Breadcrumb`, `Button`, `Card`, `Dialog`, `Dropdown`, `Input`, `Label`, `Separator`, `Skeleton`, `Sonner`, `Table`, `Textarea`.

### Por qué shadcn y no una librería de componentes como MUI o Ant Design

Esta decisión merece una justificación detallada porque tiene implicaciones arquitectónicas no triviales.

**shadcn/ui no es una librería de componentes en el sentido tradicional.** No es una dependencia que se instala como paquete NPM y se importa. Es un sistema donde los componentes se copian directamente al repositorio (`src/components/ui/`), lo que significa que **el desarrollador es dueño del código**. Puede modificar cualquier componente sin restricciones, sin esperar actualizaciones de un mantenedor externo, sin lidiar con conflictos entre versiones de la librería y las propias necesidades del proyecto.

**Impacto en el bundle.** Librerías como MUI o Ant Design tienen footprints de instalación significativos. Como se documenta en las guías de optimización de Vercel, MUI puede cargar más de 2.000 módulos en desarrollo. shadcn/ui, al ser código copiado y optimizado por Tailwind en build time, contribuye solo los bytes efectivamente usados.

**Por qué `base-nova` sobre el preset Radix.** `@base-ui/react` es la evolución de las primitivas headless del equipo de MUI. Ofrece mejor manejo de accesibilidad (WAI-ARIA), soporte mejorado para el modelo de composición de React 19, y primitivas más robustas para componentes como Dialog (usado en el flujo de rechazo de planes de vuelo) y DropdownMenu (menú de usuario en el sidebar).

---

## 7. Gestión de Estado: Arquitectura en Capas

El manejo del estado es uno de los aspectos más deliberados del diseño. Se adopta una arquitectura de dos capas claramente separadas.

### Capa 1 — Estado del servidor: TanStack Query v5

**TanStack Query (anteriormente React Query) v5.101.0** gestiona todo el estado asíncrono: las consultas a la API del backend y las mutaciones (aprobar/rechazar planes).

**¿Por qué TanStack Query y no `useEffect` + `useState` para fetching?**

El patrón naive de datos asíncronos en React consiste en un `useEffect` que llama a `fetch`, guarda el resultado en `useState`, y maneja manualmente los estados de loading y error. Este patrón tiene problemas conocidos en aplicaciones de producción: race conditions entre peticiones concurrentes, doble ejecución en modo estricto de React, ausencia de deduplicación, y ausencia de sincronización entre instancias del mismo dato en distintos componentes.

TanStack Query resuelve todo eso con una API declarativa. En el dashboard, se configura con `staleTime: 30 * 1000` (los datos son considerados frescos por 30 segundos) y `retry: 1` (un reintento ante error de red). Esto significa que si el usuario navega entre la lista de planes y el detalle de un plan específico, la segunda visita dentro de los 30 segundos no genera una petición redundante al backend.

El patrón de mutaciones es igualmente elegante: al aprobar o rechazar un plan, la mutación invalida las queries `["flight-plans"]` y `["flight-plan", id]`, forzando una re-fetching automática y garantizando que la UI refleje el estado actual del sistema.

### Capa 2 — Estado de autenticación: React Context

El estado de autenticación se gestiona con **React Context** a través del `AuthProvider` definido en `src/lib/auth/auth-context.tsx`. Esta capa expone el hook `useAuth()` que provee `user`, `isAuthenticated`, `isLoading`, `login` y `logout`.

**¿Por qué Context y no TanStack Query para auth?**

La autenticación no es "estado del servidor" en el mismo sentido que los planes de vuelo. El usuario autenticado es un estado global de sesión que necesita ser accesible en toda la aplicación, incluyendo en los providers de más alto nivel. TanStack Query vive dentro del `QueryClientProvider`; si la autenticación viviera también allí, habría un acoplamiento circular con la capa de queries que consumen el token de auth. La separación es arquitectónicamente limpia.

**¿Por qué no Zustand o Redux?**

Para el volumen de estado global de este módulo — esencialmente solo la sesión del usuario — la overhead de Zustand o Redux no se justifica. React Context con un `Provider` manual y un hook personalizado (`useAuth`) cubre el caso perfectamente sin dependencias adicionales.

---

## 8. Autenticación: JWT con Estrategia de Doble Token

### La estrategia

El sistema de autenticación implementa un flujo de **JWT con access token y refresh token** contra el backend FastAPI. La implementación es completamente custom, sin usar NextAuth, Clerk, Auth0 ni ninguna librería de terceros para auth.

El flujo es el siguiente:

1. El usuario ingresa sus credenciales en `/login`. El hook `useAuth().login()` llama a `POST /auth/login` en el backend.
2. El backend responde con `access_token` (JWT de corta duración) y `refresh_token` (JWT de larga duración).
3. El **access token se almacena en memoria** — en la variable de módulo `authToken` dentro de `src/lib/api/client.ts`. No se persiste en localStorage ni en cookies.
4. El **refresh token se almacena en `sessionStorage`** bajo la clave `jp_refresh_token`.
5. Cada petición API incluye el access token en el header `Authorization: Bearer`.
6. Al montar la aplicación (en el `useEffect` inicial del `AuthProvider`), si existe un refresh token en sessionStorage, se ejecuta `POST /auth/refresh` para recuperar un access token fresco, restaurando la sesión sin necesidad de un nuevo login.
7. Si cualquier petición retorna un `401 Unauthorized`, el callback `onUnauthorized` ejecuta el logout automático.

### Justificación del diseño de almacenamiento

**Access token en memoria (variable de módulo):** Protege contra ataques XSS. Un script malicioso inyectado en la página no puede acceder a variables de módulo de JavaScript; sí puede acceder a `localStorage`. Esto es una decisión de seguridad deliberada.

**Refresh token en sessionStorage:** Es un compromiso entre seguridad y usabilidad. `sessionStorage` no persiste entre pestañas del navegador (a diferencia de `localStorage`), lo que significa que abrir una nueva pestaña requiere un re-login. Sin embargo, dentro de la misma sesión de navegador, un recargo de página (F5) recupera la sesión sin pedir credenciales nuevamente, gracias al flujo de refresh al montar el `AuthProvider`.

**Sin middleware de Next.js para protección de rutas:** La protección de rutas se implementa a nivel de `dashboard/layout.tsx` mediante un `useEffect` que redirige a `/login` si el usuario no está autenticado. Esta decisión evita añadir complejidad en el edge mediante middleware y es completamente adecuada para el caso de uso actual. La única desventaja teórica es que hay un momento breve entre el render inicial y la redirección; el `isLoading` del `AuthProvider` gestiona este intervalo mostrando un estado de carga.

---

## 9. Capa de Comunicación con el Backend: Cliente HTTP Centralizado

### Arquitectura del cliente

Todo el tráfico hacia el backend pasa por `src/lib/api/client.ts`, que expone la función `apiRequest<T>()`. Este cliente:

- Lee la URL base desde `process.env.NEXT_PUBLIC_API_URL` (con fallback a `http://localhost:8000`).
- Agrega el header `Content-Type: application/json`.
- Agrega el header `Authorization: Bearer` si hay un access token activo.
- Maneja errores HTTP con una clase custom `ApiError` que captura el status HTTP y los errores de validación en formato FastAPI (`body.detail`).
- Maneja el status 204 (No Content) devolviendo `undefined` sin intentar parsear JSON.
- Dispara el callback de logout ante respuestas 401.

Sobre este cliente se construyen dos módulos de servicios:
- `src/lib/api/auth.ts`: endpoints de sesión.
- `src/lib/api/flight-plans.ts`: endpoints de planes de vuelo.

### Contrato con el backend: OpenAPI

El archivo `openapi.json` en la raíz del proyecto es el documento de especificación OpenAPI 3.1 generado por el backend FastAPI. Su presencia en el repositorio sirve como **contrato explícito** entre el frontend y el backend. Los tipos TypeScript en `src/types/api.ts` se mantienen alineados manualmente con esta especificación.

Esta aproximación — tipos escritos a mano en lugar de generación automática de código desde el spec — es una decisión de pragmatismo. La generación automática (con herramientas como `openapi-typescript` u `orval`) introduce complejidad en el toolchain. Para un proyecto de esta escala, el mantenimiento manual del contrato de tipos es completamente manejable.

### Sin API Routes propias (No BFF)

El dashboard **no tiene un directorio `src/app/api/`**. Todas las peticiones van directo al backend externo. No existe una capa BFF (Backend For Frontend) intermediaria.

Esta decisión implica que el `NEXT_PUBLIC_API_URL` del backend está expuesto en el cliente (es una variable pública por definición). Esto es aceptable dado que el acceso real a los datos está protegido por autenticación JWT en el backend; la URL de la API en sí no es información sensible en este contexto.

---

## 10. Validación de Formularios: React Hook Form + Zod

### La elección

El formulario de login usa **React Hook Form v7** con el resolver de **Zod v4** para validación de esquema.

### Justificación

React Hook Form es la opción estándar de la industria para formularios en React. Su ventaja respecto a alternativas como Formik es el modelo de **componentes no controlados** (uncontrolled): en lugar de almacenar el valor de cada campo en el estado de React (lo que genera un re-render por cada tecla presionada), React Hook Form usa refs del DOM para leer los valores solo cuando son necesarios. El resultado es formularios significativamente más performantes.

Zod aporta la **validación de tipos en runtime**. La integración con TypeScript es nativa: cuando se define un schema Zod, se infiere automáticamente el tipo TypeScript, eliminando duplicación. En el formulario de login:

```typescript
// El esquema es la fuente de verdad para el tipo
const schema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
})
type FormData = z.infer<typeof schema>  // { email: string; password: string }
```

Esta combinación RHF + Zod es hoy el estándar en proyectos Next.js modernos.

---

## 11. Notificaciones Toast: Sonner

### La elección

El sistema de notificaciones usa **Sonner v2.0.7**, configurado con `richColors` y `position: "top-right"`.

### Justificación

Sonner es una librería de toasts desarrollada por Emil Kowalski, miembro del equipo de Vercel. Su API es minimalista (`toast.success()`, `toast.error()`, `toast.loading()`), su tamaño de bundle es pequeño, y su integración con el ecosistema shadcn es directa (hay un componente `Sonner` en el registro oficial de shadcn).

En el contexto del dashboard, los toasts son el mecanismo de feedback para las acciones críticas de aprobación/rechazo. Cuando un usuario aprueba un plan de vuelo, la mutación de TanStack Query dispara `toast.success("Plan de vuelo aprobado")`. En caso de error de red o validación, `toast.error()` da visibilidad inmediata al problema sin interrumpir el flujo de trabajo.

---

## 12. Formateo de Fechas y Localización: date-fns

### La elección

La librería **date-fns v4.4.0** maneja todo el formateo de fechas del dominio aeronáutico.

### Justificación en el contexto aeronáutico

Los planes de vuelo tienen múltiples timestamps con semántica específica: `departure_eobt_utc` (Estimated Off-Block Time en UTC), `created_at`, `decided_at`. La aviación opera en UTC, pero la UI debe presentar estas fechas en el locale del usuario (español argentino, `es`).

date-fns ofrece **localización modular**: en lugar de cargar soporte para todos los idiomas del mundo (como haría una librería monolítica como Moment.js), se importa explícitamente solo el locale `es`. Esto impacta directamente en el tamaño del bundle de producción.

El módulo `src/lib/utils/format.ts` centraliza todas las funciones de formateo del dominio, usando date-fns con el locale español configurado.

---

## 13. Iconografía: Lucide React

### La elección

Los iconos del sistema vienen de **Lucide React v1.17.0**.

### Justificación

Lucide es la biblioteca de iconos de referencia del ecosistema shadcn. Ofrece más de 1.500 iconos consistentes en estilo, todos como componentes React individuales. El punto crítico es que Next.js 13.5+ incluye la directiva `optimizePackageImports` que transforma los imports de `lucide-react` en imports directos a nivel de módulo, eliminando el costo de cargar el barrel file completo (que podría sumar 1.500+ módulos). Esto hace que la elección de Lucide sea técnicamente segura desde el punto de vista del bundle size.

---

## 14. Gestión del Proyecto y Tooling

### ESLint

La configuración en `eslint.config.mjs` extiende `eslint-config-next` con los conjuntos `core-web-vitals` y `typescript`. Esto activa reglas específicas de Next.js (como detectar imágenes sin optimizar o el uso correcto de `<Link>`), además de las reglas estándar de TypeScript.

### Prettier

**Prettier v3.8.3** está instalado como devDependency para formateo de código. No hay un archivo `prettier.config.js` commiteado, lo que significa que opera con configuración por defecto: 80 caracteres de ancho de línea, comillas dobles, punto y coma al final.

### Variables de entorno

El único punto de configuración de entorno es `NEXT_PUBLIC_API_URL`. El prefijo `NEXT_PUBLIC_` es la convención de Next.js para variables que deben ser accesibles en el cliente (browser). Variables sin ese prefijo son server-only. Esta distinción es relevante para la seguridad: si se agregaran en el futuro secrets como claves de API o configuración de base de datos, deben vivir **sin** el prefijo `NEXT_PUBLIC_`.

---

## 15. Control de Acceso por Roles: Arquitectura Actual y Proyección

### Estado actual

El módulo es conceptualmente "multirol" — soporta tanto la autoridad del espacio aéreo como el operador del aeródromo de destino — pero la diferenciación de vistas actualmente se delega al backend. El tipo `UserPublic` expone un campo `role: string`, y el tipo `FlightPlanApprovalActor` modela los actores posibles del flujo de aprobación: `"pilot"`, `"authority"`, `"destination_aerodrome_operator"`.

La lógica de qué aprobaciones puede tomar cada rol reside en el backend: cuando un usuario de rol `authority` llama a `POST /flight-plans/:id/approve`, el backend valida que ese usuario tenga el criterio correcto para actuar. El frontend no reimplemeta esa lógica; confía en el contrato de la API.

### Proyección de diferenciación de vistas

La arquitectura de Next.js App Router permite extensiones naturales de esta lógica: layouts distintos por rol, rutas protegidas a nivel de segmento, y componentes condicionados por `user.role`. El hook `useAuth()` ya expone `user.role`, por lo que la diferenciación de UI por rol puede implementarse directamente en los componentes de presentación sin cambios estructurales.

---

## 16. Síntesis: Por Qué Este Stack como Conjunto

Cada decisión tecnológica no fue tomada en aislamiento. El conjunto forma un sistema coherente:

| Problema del dominio | Decisión técnica | Justificación |
|---|---|---|
| UI interactiva con feedback inmediato | React 19 + componentes de cliente | El dominio requiere reactividad en cada acción |
| Estructura de proyecto mantenible | Next.js 16 App Router | Convenciones sobre configuración |
| Contrato tipado con el backend | TypeScript strict + tipos manuales desde OpenAPI | Prevención de errores semánticos en datos aeronáuticos |
| Gestión de estado asíncrono sin boilerplate | TanStack Query v5 | Deduplicación, caché, invalidación automática |
| Autenticación segura sin over-engineering | JWT custom + Context | Protección XSS para el access token, sesión recuperable |
| Componentes UI de alta calidad sin lock-in | shadcn/ui (base-nova) | Ownership del código, bundle optimizado |
| Feedback de acciones críticas | Sonner | API minimalista, integración nativa con el stack |
| Fechas del dominio aeronáutico | date-fns con locale es | Bundle modular, semántica UTC correcta |
| Validación de formularios performante | RHF + Zod | Render mínimo, inferencia de tipos nativa |

El resultado es un módulo frontend que actúa como un cliente delgado, altamente interactivo y tipado del backend, sin asumir responsabilidades que no le corresponden, y construido sobre un stack que el ecosistema moderno de React/Next.js consolida como estándar de facto.