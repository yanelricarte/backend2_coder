# Clase 4 — Integración avanzada con JWT y Passport

> **Meta:** migramos de autenticación con **sesiones (stateful)** a **JWT (stateless)** usando **cookies HttpOnly firmadas**, estrategias **Passport Local + JwtStrategy**, y **Handlebars** para visualizar el flujo (login → current → logout).
> Este README resume **qué implementamos**, **cómo está organizado el proyecto** y **cómo probar todo**.

> En clase **implementamos por completo el archivo `passport.js`**, con **LocalStrategy** y **JwtStrategy** funcionales.
> También configuramos el modelo `User`, el middleware `requireAuth`, y las rutas `/register`, `/login`, `/logout` con **JWT emitido en cookie HttpOnly firmada**.
> No llegamos aún a **aplicar la JwtStrategy en el resto de las rutas** ni a integrar **motores de plantillas (Handlebars)**, pero dejamos toda la estructura y dependencias **listas para continuar en la próxima clase**.

---

## Objetivos de la clase

* Integrar lo visto (Express, Mongo, rutas y middlewares) en un ejemplo funcional.
* Aplicar **JWT desde cookie HttpOnly firmada** (emisión, transporte, validación).
* Comprender **Passport**: `LocalStrategy` (credenciales) y `JwtStrategy` (token).
* Reforzar **stateful vs stateless**, **XSS/CSRF**, **401 vs 403**, y **roles**.
* Dejar preparada la estructura para incorporar **Handlebars** (próxima clase).

---

## Requisitos

* Node.js 18+
* MongoDB Atlas (o local)
* Postman

Instalar dependencias:

```bash
npm i
# Dependencias clave de la clase
npm i express mongoose passport passport-local passport-jwt jsonwebtoken cookie-parser helmet cors morgan express-handlebars bcrypt
# (si tu entorno no compila módulos nativos, podés usar bcryptjs en lugar de bcrypt)
```

## Archivo .env (ejemplo mínimo)

```
MONGO_URI=<tu cadena de conexión>
MONGO_DB=integrative_practice
PORT=3000
NODE_ENV=development

JWT_SECRET=super_secreto_unico
JWT_EXPIRES=15m
COOKIE_SECRET=otra_clave_para_firmar
COOKIE_NAME=currentUser
```

# Si tenés front en otro origen:

# CORS_ORIGIN=[http://localhost:5173](http://localhost:5173)

---

## Estructura del proyecto

```
/public
  /css
    app.css                # Estilos globales

/src
  /config
    passport.js            # Local + JwtStrategy implementadas, initPassport listo
  /middlewares
    auth.js                # requireAuth (ya creado, sin aplicar en rutas aún)
    roles.js               # allowRoles('admin', ...) pendiente
    auth-cookie.js         # (estructura preparada para SSR)
    error.js               # Handler centralizado de errores
  /models
    User.js                # Modelo con hash en pre('save') + comparePassword
  /routes
    sessions.routes.js     # register, login, logout (operativas)
    protected.routes.js    # estructura creada, pendiente de aplicar requireAuth
    views.routes.js        # pendiente (para SSR con Handlebars)
  /views
    login.handlebars       # pendiente
    current.handlebars     # pendiente

  app.js                   # App Express (helmet, cors, cookies firmadas, rutas)
server.js                  # Bootstrap: conexión Mongo y arranque HTTP
.env                       # Variables de entorno
```

---

## Qué implementamos en esta clase (resumen)

* Archivo completo de configuración **Passport** con:

  * `LocalStrategy`: validación de email + password (hash bcrypt).
  * `JwtStrategy`: validación de token desde **Bearer** o **cookie firmada**.
* Middleware `requireAuth` creado para proteger rutas (sin aplicar aún).
* Autenticación **stateless** con **JWT** en cookie `HttpOnly` firmada.
* Rutas operativas: `/register`, `/login`, `/logout`.
* Estructura base para `protected.routes.js` y vistas con **Handlebars** (pendientes).

---

## Conceptos clave

* **Stateful vs Stateless**

  * *Stateful (sesiones)*: el server guarda el estado por usuario.
  * *Stateless (JWT)*: el estado viaja en el token; el servidor sólo verifica firma/exp.

* **401 vs 403**

  * 401: no autenticado (token ausente / inválido / vencido).
  * 403: autenticado pero sin permiso (rol no autorizado).

* **XSS/CSRF**

  * `HttpOnly` protege contra robo de token por XSS.
  * `SameSite` ayuda a mitigar CSRF (la mayoría de flujos).

---

## Piezas principales (mapa rápido a archivos)

### 1) Modelo de usuario con hash

`/src/models/User.js`

* Hash en pre('save') con bcrypt.
* Método `comparePassword(plain)` para login.

### 2) Passport — estrategias

`/src/config/passport.js`

* `LocalStrategy`: valida credenciales y devuelve `{ id, email, role }`.
* `JwtStrategy`: extrae token de Authorization y/o cookie firmada, rellena `req.user`.
* `initPassport(app)` inicializa `passport` en la app.

### 3) Rutas de sesión

`/src/routes/sessions.routes.js`

* **POST /api/sessions/register** → crea user (hash en modelo).
* **POST /api/sessions/login** → firma JWT y lo envía en cookie firmada.
* **POST /api/sessions/logout** → borra la cookie.
* *(Pendiente para próxima clase)*: `current`, `private`, `admin-ping`, SSR con Handlebars.

---

## Correr el proyecto

```bash
npm run dev
# o
node server.js
```

Verificar:
`GET http://localhost:3000/health → { "ok": true }`

---

## Guía de pruebas con Postman

> **Dónde ver las cookies**
>
> * En **Postman**, activá la pestaña **Cookies** (a la derecha del campo de URL) o en el panel inferior “Cookies”.
> * Si hacés login correctamente, verás la cookie **`currentUser`** (firmada y marcada como `HttpOnly`).
> * En navegador: pestaña **Application → Cookies** del panel de desarrolladores.

---

### 1) Register

**POST** `/api/sessions/register`
Body (JSON):

```json
{
  "first_name": "Cósme",
  "last_name": "Fulanito",
  "age": 35,
  "email": "cosme.fulanito@test.com",
  "password": "secreto123"
}
```

**Respuesta esperada:**
`201 { "ok": true, "id": "..." }`

---

### 2) Login

**POST** `/api/sessions/login`
Body (JSON):

```json
{
  "email": "cosme.fulanito@test.com",
  "password": "secreto123"
}
```

**Respuesta esperada:**
`200 { "ok": true }`
Y en Postman, aparece una **cookie firmada `currentUser`** (HttpOnly, firmada con `COOKIE_SECRET`).

---

### 3) Logout

**POST** `/api/sessions/logout`
**Respuesta esperada:**
`200 { "ok": true, "message": "Token eliminado" }`
(La cookie `currentUser` desaparece del listado de cookies en Postman.)

---

> **JWT Strategy** ya funcional, pero **aún no aplicada** a endpoints protegidos (por eso las rutas `/current` o `/private` todavía no se probaron).

---

| Tema          | Clase 3 (Sesiones)                         | Clase 4 (JWT)                                 |
| ------------- | ------------------------------------------ | --------------------------------------------- |
| Estado        | **Stateful** (server guarda sesión)        | **Stateless** (token firmado)                 |
| Transporte    | Cookie legible por server                  | **Cookie HttpOnly firmada**                   |
| Passport      | `LocalStrategy`                            | `LocalStrategy` + `JwtStrategy`               |
| Seguridad     | Store dependiente                          | **HttpOnly/SameSite/Secure** + expiración JWT |
| Autorización  | Básica                                     | **Roles (pendiente)**                         |
| Escalabilidad | Requiere compartir sesión entre instancias | **Ideal para horizontal**                     |
| Logout        | Destruye sesión                            | **Borra cookie (client-side)**                |
| 401 vs 403    | Menos explícito                            | 401 sin token / 403 sin permiso               |

---

## Cierre (qué cambia respecto a clases previas)

* Se implementó completamente **`passport.js`** (Local + JWT).
* Se migró a autenticación **stateless** con **cookies firmadas**.
* Se dejó la **estructura lista** para roles, vistas SSR y rutas protegidas.
* Próxima clase: aplicar `requireAuth`, `allowRoles`, y flujo con Handlebars.

---

## Notas finales

* En producción: `secure: true` + `SameSite: 'none'` (HTTPS).
* Si el front está en otro dominio: configurar `CORS_ORIGIN` y `credentials: true`.
* Si tu entorno no compila `bcrypt`, usar `bcryptjs` y ajustar métodos hash/compare.

---
