<!-- =========================================================
 CURSO BACKEND 2 · UNIDAD 1
 CLASE 3 — AUTENTICACIÓN CON PASSPORT (LOCAL) + ROLES
========================================================= -->

#  Curso Backend 2 
## Clase 3 · Autenticación con Passport (Local) + Autorización por Roles

**Proyecto base:** `backend2_coder`  
**Propósito de la clase:** reemplazar el login “a mano” por **Passport Local** manteniendo el **contrato de sesión** y reforzando **autorización por roles**. (Cierre opcional: OAuth con GitHub).

> **Recordatorio clave:** Autenticación (¿quién sos?) ≠ Autorización (¿qué podés hacer?).  
> La cookie `connect.sid` **no** guarda datos del usuario, guarda un **ID de sesión** firmado.  
> Los datos viven en el **store** del servidor y en la **DB**.

---

## 🗺️ Mapa de la clase

1) **Sessiones y cookies**: sesiones, cookie `connect.sid`, `/login` → `/me` → `/logout`, diferencia `/sessions/me` vs `/users/me`, y `/users` solo admin.  
2) **Passport Local**: qué cambia, dónde se integra, cómo luce el flujo y qué logs ver.  
3) **Autorización por roles**: 401 vs 403, middlewares `isAuthenticated` + `authorize('admin')`.  
4) **Pruebas en vivo**: Postman + Navegador (DevTools).  
5) **Cierre opcional**: OAuth con GitHub (misma sesión, mismos roles).  
6) **Actividad práctica**.

---

## 1) Sessiones y cookies

### Conceptos
- **Sesión**: el server guarda estado en un *store*; el cliente guarda una cookie `connect.sid` con el **ID**.  
- **/api/sessions/me**: devuelve lo que hay en la **sesión** (no consulta DB).  
- **/api/users/me**: consulta la **DB** usando el **id** de la sesión (fuente de verdad).  
- **/api/users**: requiere **sesión** + **rol admin** (401 si no hay sesión, 403 si el rol no alcanza).

### Demo
- **Login** → aparece `connect.sid` (Postman: pestaña *Cookies*; Navegador: DevTools → Application → Cookies).  
- **/sessions/me** → 200 con `{ user:{...} }` (sale del store de sesión).  
- **/users/me** → 200 con documento real (sale de DB).  
- **/users** → 200 si admin, 403 si user.  
- **Logout** → borra cookie y destruye sesión; reintentar `/users` → 401.

> **Mensaje didáctico**: la cookie solo es *llave*. La info real vive en el **store** y/o **DB**.

---

## 2) Passport Local (qué cambia y por qué)

### 🎯 Objetivo
Sacar la lógica de verificación de credenciales fuera de la ruta `/login` y delegarla en **Passport** mediante la **LocalStrategy**.  
**Ganancia:** menos código “a mano”, estrategia estandarizada, fácil de extender (GitHub/Google/JWT), mismo contrato de sesión.

### Piezas que se tocan
- `config/passport.js`: **LocalStrategy** + `serializeUser` / `deserializeUser` (con logs para la clase).  
- `app.js`: `passport.initialize()` + `passport.session()` **después** de `createSessionMW()`.  
- `routes/sessions.routes.js`: `/login` ahora llama a `passport.authenticate('local')`, **regenera** la sesión, hace `req.login(user)` y **deja** `req.session.user = { id, email, name, role }`.

### 🔎 Qué deben entender mirando los **logs**
Durante un **login** correcto, en la consola se ven (orden aproximado):
[PASS] intento … // la estrategia recibe email/password
[PASS] ok … // credenciales válidas
[PASS] serialize … // Passport guarda el id en la sesión interna
[LOGIN] session_regenerated // cambiamos el ID (anti session fixation)
[LOGIN] req.user listo … // Passport fija req.user
[LOGIN] session.user seteado { id, email, name, role } // tu contrato



> **Punto clave:** el resto del sistema (rutas protegidas y roles) **no cambia**: todo sigue leyendo `req.session.user`.

---

## 3) Autorización por roles: 401 vs 403

- **401 (Unauthorized)**: no hay sesión → *no estás autenticado*.  
- **403 (Forbidden)**: hay sesión, pero el rol **no alcanza** → *no estás autorizado*.  

Middlewares (ya presentes en el proyecto):

- `isAuthenticated` → exige `req.session.user`.  
- `authorize('admin')` → exige `req.session.user.role === 'admin'`.

**Ejemplos concretos:**
- `/api/users/me` → solo `isAuthenticated`.  
- `/api/users` → `isAuthenticated` + `authorize('admin')`.

---

## 4) Pruebas (paso a paso)

### 🧪 Postman
1. **Login**
POST /api/sessions/login
{ "email": "<mail>", "password": "<pwd>" }

markdown
Copiar código
Ver **cookie** `connect.sid` y logs `[PASS]`/`[LOGIN]`.

2. **Sesión**  
GET /api/sessions/me

markdown
Copiar código
Esperado: `200 { user: { id, email, name, role } }`.

3. **Perfil de DB**  
GET /api/users/me

markdown
Copiar código
Esperado: `200` con documento real (ver `.select(...)` en respuesta).

4. **Solo admin**
GET /api/users

markdown
Copiar código
- `403` si `role: 'user'`  
- `200` si `role: 'admin'` (podés cambiar el rol en DB y reloguear para demostrarlo).

5. **Logout**
POST /api/sessions/logout

markdown
Copiar código
Esperado: `200`, cookie limpiada; reintentar `/api/users` → `401`.

### 🌐 Navegador (DevTools)
- En el `fetch` de login, usar **`credentials: 'include'`**.  
- Ver **Network** → `Set-Cookie: connect.sid=...`.  
- Ver **Application → Cookies**: aparece `connect.sid`.  
- `fetch('/api/sessions/me', { credentials: 'include' })` devuelve el usuario de sesión.

---

## 5) Cierre opcional: OAuth con GitHub (visión general)

**Para qué sirve:** menos fricción (sin nueva password), delegás la **autenticación** en GitHub; tu app mantiene la **autorización** (roles) y la **misma sesión**.

**Qué se agrega (resumen):**
- Registrar una *GitHub OAuth App* (callback: `http://localhost:3000/api/sessions/auth/github/callback`).  
- `.env` con `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`.  
- Estrategia en `config/passport.js`: mapear `profile` → usuario **local** (crear si no existe, `role:'user'`).  
- Rutas:
- `GET /api/sessions/auth/github` → iniciar flow.
- `GET /api/sessions/auth/github/callback` → setear `req.session.user` y redirigir a `/api/sessions/me`.

**Demostración breve:**  
Entrar por GitHub → ver `/sessions/me` OK → `/users` da **403** hasta que el rol sea `admin`.  
**Mensaje final:** cambiamos *cómo* autenticamos, pero **no** *cómo* autorizamos.



---

## 6) Glosario rápido

- **LocalStrategy**: estrategia de Passport que usa email+password de tu DB.  
- **serializeUser / deserializeUser**: cómo Passport guarda y recupera el usuario asociado a la sesión.  
- **connect.sid**: cookie con el **ID** de sesión **(no los datos)**.  
- **401**: no autenticado; **403**: autenticado sin permiso; **200**: acceso concedido.

---

## 7) Referencias internas del repo

- `src/config/passport.js` → estrategia Local + logs.  
- `src/app.js` → orden de middlewares (sesión → passport → rutas).  
- `src/routes/sessions.routes.js` → login (Passport), `/me`, `logout`.  
- `src/routes/users.routes.js` → `isAuthenticated`, `authorize('admin')`, `/me` y listado admin.

> El código fuente está en estos archivos. En este documento solo se citan fragmentos y el **por qué** de cada pieza para evitar duplicación y mantener coherencia.

---

### ✅ Resultado esperado al terminar la clase

- Login con **Passport Local** funcionando.  
- Rutas protegidas con **401/403** claras y demostrables.  
- Mismo contrato `req.session.user` para todo el proyecto.  
- (Opcional) GitHub OAuth integrado sin romper nada.

> Próxima clase: **JWT** (autenticación sin estado) y relación con sesiones.

---