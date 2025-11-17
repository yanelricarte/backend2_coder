# Clase 5 - Ruteo avanzado en Express y políticas de acceso

**Curso:** Diseño y Arquitectura Backend  
**Rama del proyecto:** `feat/clase-5-ruteo-avanzado`

En la Clase 5 hemos visto como armar un router base personalizado, un sistema de políticas y dos routers nuevos (`ProtectedRouter` y `PetsRouter`), integrados con el login por JWT y cookies desarrollado en la clase anterior.

---

## 1. Objetivo de la clase

**Objetivo general**

Incorporar ruteo avanzado al servidor Express mediante un router custom, con políticas de acceso y respuestas estandarizadas, manteniendo la integración con JWT, cookies y vistas (`/login`, `/current`).

**Objetivos específicos**

- Crear un **router base** que:
  - Exponga un método `getRouter()` para ser usado en `app.js`.
  - Agregue métodos de respuesta:
    - `res.sendSuccess(payload, status?)`
    - `res.sendError(message, status?)`
  - Centralice el `try/catch` de los controladores mediante `applyCallbacks`.
- Implementar un sistema de **políticas declarativas**:
  - `PUBLIC`
  - `AUTHENTICATED`
  - `ADMIN`
- Crear rutas protegidas:
  - `/private/ping` (requiere autenticación).
  - `/private/admin-ping` (requiere rol de administrador).
- Crear un router de ejemplo (`PetsRouter`) para una API simple (`/api/pets`).

---

## 2. Estructura base del proyecto (Clase 5)

```txt
src/
 ├── app.js
 ├── config/
 │    ├── config.js
 │    └── passport.js
 ├── middlewares/
 │    ├── auth-cookie.js
 │    ├── error.js
 │    └── policies.js
 ├── routes/
 │    ├── Router.js              # Router base custom
 │    ├── protected.routes.js    # Rutas protegidas por políticas
 │    ├── pets.router.js         # API de ejemplo /api/pets
 │    ├── sessions.routes.js     # Registro / login / current / logout
 │    └── views.routes.js        # Vistas /login y /current
 ├── views/
 │    ├── layouts/
 │    │     └── main.handlebars
 │    ├── login.handlebars
 │    └── current.handlebars
 └── public/
```


## 3. Router base (src/routes/Router.js)

El router base encapsula el Router de Express y agrega:

### Método getRouter()

Permite montar el router en app.js:

```
import ProtectedRouter from './routes/protected.routes.js';
import PetsRouter from './routes/pets.router.js';

app.use('/private', new ProtectedRouter().getRouter());
app.use('/api/pets', new PetsRouter().getRouter());
```

### Respuestas estandarizadas

Se agregan a res:
```

res.sendSuccess(payload, status = 200);
// Envía { status: 'success', payload }

res.sendError(message = 'Bad request', status = 400);
// Envía { status: 'error', message }
```


### Manejo centralizado de errores

Los callbacks se envuelven mediante applyCallbacks, de forma que los errores se capturen en un solo lugar sin repetir try/catch en cada ruta.

### Mini-DSL para métodos HTTP

El router define métodos con la siguiente firma:
```
get(path, policies, ...handlers)
post(path, policies, ...handlers)
put(path, policies, ...handlers)
delete(path, policies, ...handlers)
```

## La idea es que cada ruta reciba:

Un conjunto de políticas (un middleware o arreglo de middlewares).

Una o más funciones handler que se envuelven con applyCallbacks.

Ejemplo de uso desde un router hijo:

```

this.get(
  '/ping',
  handlePolicies([POL.AUTHENTICATED]),
  (req, res) => {
    return res.sendSuccess({ message: 'pong', user: req.user });
  }
);
```
 
## 4. Sistema de políticas (src/middlewares/policies.js)

Se definió un pequeño enum de políticas:

```
export const POL = {
  PUBLIC: 'PUBLIC',
  AUTHENTICATED: 'AUTHENTICATED',
  ADMIN: 'ADMIN'
};
```


Y un middleware principal:
```
handlePolicies(policiesArray)
```
### Comportamiento real

- Comportamiento real
    - Si la única política es PUBLIC, la ruta continúa sin exigir credenciales.

- Para el resto de los casos:
    - Se espera que req.user exista (construido por attachUserFromCookie, que lee el JWT desde la cookie).
    - Si req.user no existe:
    - Se responde con 401 (no autenticado).
    - Si existe usuario pero su rol no está en las políticas permitidas:
        - Se responde con 403 (acceso denegado).
    - Si el rol es válido:
        - Se continúa con el handler de la ruta.

### Ejemplo de uso:
```
this.get('/admin-ping', handlePolicies([POL.ADMIN]), handler);
```
## 5. Rutas protegidas (src/routes/protected.routes.js)

El router ProtectedRouter hereda del router base y define dos rutas:

### 5.1. `GET /private/ping` — requiere usuario autenticado

```
import Router from './Router.js';
import { POL, handlePolicies } from '../middlewares/policies.js';

export default class ProtectedRouter extends Router {
  init() {
    this.get(
      '/ping',
      handlePolicies([POL.AUTHENTICATED]),
      (req, res) => {
        return res.sendSuccess({
          message: 'pong (private)',
          user: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role
          }
        });
      }
    );

    // ...
  }
}
```

### 5.2. `GET /private/admin-ping` — requiere rol ADMIN

```
this.get(
  '/admin-ping',
  handlePolicies([POL.ADMIN]),
  (_req, res) => {
    return res.sendSuccess({ message: 'pong (admin)' });
  }
);

```

### 5.3. Montaje en app.js
```

import ProtectedRouter from './routes/protected.routes.js';

app.use('/private', new ProtectedRouter().getRouter());
```

## 6. API de ejemplo: PetsRouter (src/routes/pets.router.js)

PetsRouter sirve como ejemplo de ruteo avanzado sobre el router base.
La persistencia es en memoria (un arreglo en el propio archivo).

### 6.1. Endpoint `POST /api/pets`

Crea una nueva mascota:

```
this.post(
  '/',
  handlePolicies([POL.PUBLIC]),  // Pública en esta versión
  (req, res) => {
    const { name, specie } = req.body;

    if (!name || !specie) {
      return res.sendError('name y specie son obligatorios', 400);
    }

    const pet = { id: pets.length + 1, name, specie };
    pets.push(pet);

    return res.sendSuccess(pet, 201);
  }
);
```

### 6.2. Endpoint `GET /api/pets/:pet`

Obtiene una mascota por nombre:

```

this.get(
  '/:pet',
  handlePolicies([POL.PUBLIC]),
  (req, res) => {
    const name = req.params.pet;
    const pet = pets.find(p => p.name === name);

    if (!pet) {
      return res.sendError(`Mascota ${name} no encontrada`, 404);
    }

    return res.sendSuccess(pet);
  }
);
```

### 6.3. Montaje en app.js

```
import PetsRouter from './routes/pets.router.js';

app.use('/api/pets', new PetsRouter().getRouter());
```

## 7. Integración con la autenticación existente (Clase 4)

La Clase 5 no modificó la lógica de autenticación base, sino que la reutiliza:

`attachUserFromCookie` sigue siendo el middleware que:

- Lee el JWT desde la cookie firmada.
- Valida la firma.

Construye req.user con datos no sensibles del usuario.

Las vistas:

- /login para iniciar sesión.
- /current para ver los datos del usuario autenticado.


Las rutas de sesión `(/api/sessions)` mantienen:
```
POST /api/sessions/register

POST /api/sessions/login

POST /api/sessions/logout

GET /api/sessions/current
```

El sistema de políticas se apoya precisamente en que req.user esté definido por estos componentes.

## 8. Pruebas recomendadas (Postman / navegador)

### Flujo de login

```
POST /api/sessions/login

Body con email y password.
```

Verificar que se setea la cookie con el JWT.

### Ruta privada autenticada

#### `GET /private/ping`

- Requiere que la cookie JWT esté presente.
- Debería devolver:

```
status: 'success'

payload.message: 'pong (private)'

payload.user con id, email, role.

Ruta privada solo admin

```
#### `GET /private/admin-ping`

- Si el usuario no es admin:

    - 403 y mensaje de acceso denegado.
    - Si el usuario es admin:
    - status: 'success' y message: 'pong (admin)'.

### Mascotas
```
POST /api/pets

Body JSON: { "name": "firulais", "specie": "dog" }

GET /api/pets/firulais
```

Debe devolver la mascota creada.

## 9. Scripts de ejecución

El proyecto mantiene los mismos scripts que en la unidad anterior:

```
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js"
  }
}
```
## 10. Cierre de la clase

La Clase 5 consolidó:

- Un modelo de ruteo avanzado, con un router base reutilizable.
- Un sistema de políticas centralizado, aplicado de forma declarativa en cada ruta.
- Nuevas rutas protegidas `(/private/ping`, `/private/admin-ping)` que ejercitan la combinación entre:
    - JWT en cookie.
    - Middleware de autenticación `(attachUserFromCookie)`.
    - Middleware de autorización `(handlePolicies)`.

- Un router de ejemplo `(PetsRouter)` que demuestra cómo extender la API utilizando el router base y las mismas políticas.