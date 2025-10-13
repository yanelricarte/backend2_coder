# 🚀 API REST - Express + MongoDB (Atlas) + Mongoose

API base para el desarrollo backend con **Node.js**, **Express** y **MongoDB Atlas**.  
Implementa un CRUD completo sobre el recurso `users`.

---

## Tecnologías

- Node.js (v18+)
- Express.js
- Mongoose (ODM)
- MongoDB Atlas (base de datos en la nube)
- dotenv, cors, helmet, morgan

---

## ⚙️ Configuración del entorno

### 1️⃣ Instalación
```bash
npm init -y
npm install express mongoose dotenv cors helmet morgan
npm install -D nodemon
```


## Agregar .env a .gitignore.

```bash

Método	Ruta	Descripción
GET	/health	Verificar estado del servidor
GET	/api/users	Listar usuarios
GET	/api/users/:id	Obtener usuario por ID
POST	/api/users	Crear usuario
PUT	/api/users/:id	Reemplazar usuario
PATCH	/api/users/:id	Actualizar parcialmente
DELETE	/api/users/:id	Eliminar usuario
```


## Conceptos clave
REST: arquitectura basada en recursos y métodos HTTP.

Express: framework minimalista para definir rutas y middlewares.

MongoDB Atlas: base de datos NoSQL en la nube.

Mongoose: define esquemas y modelos con validaciones.

Middleware de errores: centraliza las respuestas de error.

Variables de entorno: protegen credenciales sensibles.

## Estructura sugerida

```bash

backend2-clase1/
│
├── server.js               # Conexión y arranque
├── .env                    # Configuración (no subir)
├── /src
│   ├── app.js              # Express app
│   ├── /routes             # Rutas (users.routes.js)
│   ├── /models             # Modelos (User.js)
│   └── /middlewares        # Manejo de errores
└── package.json
```

## Testing (Postman)
Importar la colección Backend2_Users_Collection.postman_collection.json.

Importar el environment Backend2_Local_Advanced.postman_environment.json.

Activar el environment y ejecutar:

POST /api/users (crea usuario y guarda {{userId}})

GET /api/users

PATCH /api/users/{{userId}}

DELETE /api/users/{{userId}}

## Seguridad
helmet() para cabeceras seguras.

cors() para habilitar orígenes controlados.

Variables secretas en .env.

En Atlas: usar 0.0.0.0/0 solo en desarrollo; restringir a IP fija en producción.