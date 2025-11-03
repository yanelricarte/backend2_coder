
#  Curso Backend 2 

## 🗂️ Estructura del proyecto (Clase 2)

```
backend2-clase2/
│
├── server.js                   # Conexión a Mongo + arranque HTTP
├── .env                        # Variables (no subir al repo)
├── /src
│   ├── app.js                  # Express app (middlewares + rutas)
│   ├── /config
│   │   └── session.js          # Fábrica de sesión (connect-mongo)
│   ├── /routes
│   │   └── sessions.routes.js  # /api/sessions/register + /login
│   ├── /models
│   │   └── User.js             # Modelo (hash pre-save + comparePassword)
│   └── /middlewares
│       └── error.js            # Manejo centralizado de errores
└── package.json
```

---

## Conceptos clave (Clase 2)

* **Sesiones HTTP**: se guarda un **ID de sesión** en una cookie firmada (`connect.sid`). Los **datos reales** (`req.session.user`) viven en el **store del servidor** (Mongo/Redis), **no** en la cookie.
* **Store persistente (connect-mongo)**: mantiene las sesiones en MongoDB y limpia las expiradas por TTL.
* **Cookie segura**:

  * `httpOnly: true` (no accesible por JS del navegador)
  * `sameSite: 'lax'` (protección básica CSRF)
  * `secure: true` en producción bajo HTTPS (+ `app.set('trust proxy', 1)`)
* **Hash de contraseñas**: `bcryptjs`, con rondas configurables.
* **Datos mínimos en sesión**: solo `{ id, name, email (y role si aplica) }`.

---

## Endpoints (Clase 2)

| Método | Ruta                     | Descripción                               |
| -----: | ------------------------ | ----------------------------------------- |
|    GET | `/health`                | Ping del server (sin `/api`)              |
|   POST | `/api/sessions/register` | Registrar usuario y abrir sesión          |
|   POST | `/api/sessions/login`    | Login (valida credenciales y abre sesión) |

> **No** incluimos `/logout`, `/me` ni rutas protegidas en esta clase (se suman después).

---

## Cómo probar en Postman

### 0) Variable `baseUrl`

* Definí **una sola** `baseUrl` con valor: `http://localhost:3000`
* Guardá la colección. Asegurate que ninguna Environment pise `baseUrl`.

### 1) Health

```
GET {{baseUrl}}/health
```

Respuesta:

```json
{ "ok": true }
```

### 2) Register (Cosme Fulanito)

```
POST {{baseUrl}}/api/sessions/register
Content-Type: application/json
```

Body (raw → JSON):

```json
{
  "name": "Cosme Fulanito",
  "email": "cosme@fulano.com",
  "age": 28,
  "password": "123456"
}
```

Esperado: **201 Created**

```json
{ "ok": true, "id": "<mongoId>" }
```

Postman debe mostrar `Set-Cookie: connect.sid=...` en la respuesta (pestaña **Cookies**).

### 3) Login (Cosme Fulanito)

```
POST {{baseUrl}}/api/sessions/login
Content-Type: application/json
```

Body:

```json
{
  "email": "cosme@fulano.com",
  "password": "123456"
}
```

Esperado: **200 OK**

```json
{ "ok": true }
```

En **Cookies** debe figurar la cookie `connect.sid` activa.

> **Credenciales didácticas de admin (atajo de clase):**
> `email`: `admincoder@coder.com` – `password`: `adminCod3r123`
> (Solo para práctica. No usar en producción.)

### Errores comunes

* **404** “Ruta no encontrada”: URL mal armada (p. ej. `/sessions/register` en lugar de `/api/sessions/register`) o `{{baseUrl}}` con `/api` duplicado.
* **400** “Faltan campos”: body incompleto o sin `Content-Type: application/json`.
* **409** “Email ya registrado”: reusaste el mismo email en `/register`.
* **401** “Credenciales inválidas”: email no existe o password incorrecto en `/login`.
* **Fallo connect-mongo**: `MONGO_URL`/`SESSION_SECRET` faltan o `.env` no se cargó.

---

## cURL (opcional)

```bash
# Health
curl -i http://localhost:3000/health

# Register (guarda cookie)
curl -i -c cookies.txt -X POST http://localhost:3000/api/sessions/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Cosme Fulanito","email":"cosme@fulano.com","age":28,"password":"123456"}'

# Login (reutiliza cookie)
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/sessions/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cosme@fulano.com","password":"123456"}'
```

---

## 🔐 Seguridad (resumen)

* `helmet()` para cabeceras seguras.
* `cors({ origin: true, credentials: true })` para habilitar cookies entre front/back; en producción usar un origin explícito.
* Variables sensibles en `.env`.
* En Atlas: `0.0.0.0/0` **solo** en desarrollo; restringir IPs en producción.
* Jamás guardar contraseñas en texto plano; usar **bcryptjs**.

---

## Diferencias vs Clase 1

* Agregamos **autenticación por sesiones** (cookie firmada + store en Mongo).
* Endpoints nuevos: **`POST /api/sessions/register`** y **`POST /api/sessions/login`**.
* Modelo `User` ahora **hashea contraseñas** en `pre('save')` y expone `comparePassword`.
* Orden de middlewares ajustado para **cookies y sesiones**.
