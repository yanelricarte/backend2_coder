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

2️⃣ Archivo .env
env
Copiar código
MONGO_URI="mongodb+srv://USUARIO:PASSWORD@cluster0.xxxxxx.mongodb.net/backend2?retryWrites=true&w=majority"
PORT=3000

⚠️ Agregar .env a .gitignore.


Método	Ruta	Descripción
GET	/health	Verificar estado del servidor
GET	/api/users	Listar usuarios
GET	/api/users/:id	Obtener usuario por ID
POST	/api/users	Crear usuario
PUT	/api/users/:id	Reemplazar usuario
PATCH	/api/users/:id	Actualizar parcialmente
DELETE	/api/users/:id	Eliminar usuario

🧱 Ejemplo de documento User
json
Copiar código
{
  "_id": "ObjectId",
  "name": "Ada",
  "age": 28,
  "email": "ada@lovelace.dev",
  "createdAt": "2025-10-13T00:00:00Z",
  "updatedAt": "2025-10-13T00:00:00Z"
}
📦 Ejemplos de uso (cURL)
Crear usuario

bash
Copiar código
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada","age":28,"email":"ada@lovelace.dev"}'
Listar usuarios

bash
Copiar código
curl http://localhost:3000/api/users
Actualizar usuario

bash
Copiar código
curl -X PATCH http://localhost:3000/api/users/<id> \
  -H "Content-Type: application/json" \
  -d '{"age":30}'
Eliminar usuario

bash
Copiar código
curl -X DELETE http://localhost:3000/api/users/<id>
⚠️ Códigos de estado
Código	Significado
200	OK
201	Created
204	No Content
400	Bad Request
404	Not Found
409	Conflict (duplicado)
422	Unprocessable Entity
500	Internal Server Error

🧠 Conceptos clave
REST: arquitectura basada en recursos y métodos HTTP.

Express: framework minimalista para definir rutas y middlewares.

MongoDB Atlas: base de datos NoSQL en la nube.

Mongoose: define esquemas y modelos con validaciones.

Middleware de errores: centraliza las respuestas de error.

Variables de entorno: protegen credenciales sensibles.

🧰 Estructura sugerida
bash
Copiar código
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
🧪 Testing (Postman)
Importar la colección Backend2_Users_Collection.postman_collection.json.

Importar el environment Backend2_Local_Advanced.postman_environment.json.

Activar el environment y ejecutar:

POST /api/users (crea usuario y guarda {{userId}})

GET /api/users

PATCH /api/users/{{userId}}

DELETE /api/users/{{userId}}

🔐 Seguridad
helmet() para cabeceras seguras.

cors() para habilitar orígenes controlados.

Variables secretas en .env.

En Atlas: usar 0.0.0.0/0 solo en desarrollo; restringir a IP fija en producción.

📄 Licencia
MIT

yaml
Copiar código

---

¿Querés que te lo genere también con **secciones de pruebas con Postman** o con **una tabla resumen de respuestas JSON esperadas** (para documentarlo en clase)?