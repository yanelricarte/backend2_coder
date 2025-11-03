#  Curso Backend 2 
## 🚀 API REST – Clase 1: Express + MongoDB

> **Objetivo de la clase**: arrancar un servidor Express, conectarlo a MongoDB con Mongoose y construir un CRUD mínimo de `users`. También practicamos requests con Postman.

---

## 📚 Contenidos

* ¿Qué es una **API REST** y cómo se organiza (endpoints, verbos HTTP)
* **Express**: router, middlewares, archivos estáticos
* **MongoDB + Mongoose**: modelos, esquemas, validaciones
* **Postman** para probar endpoints

---

## ✅ Requisitos previos

* Node.js 18+ y npm
* Cuenta de **MongoDB Atlas** *o* MongoDB local instalado
* Postman (o curl)

> **Sugerencia Atlas**: crea un *Cluster Free* y copia tu *Connection String* (`mongodb+srv://...`).

---

## 🗂️ Estructura sugerida del proyecto

```
api-rest-clase-1/
├─ .env
├─ package.json
├─ src/
│  ├─ app.js
│  ├─ config/
│  │  └─ db.js
│  ├─ models/
│  │  └─ user.model.js
│  ├─ routes/
│  │  └─ users.router.js
│  └─ middlewares/
│     └─ error.handler.js
└─ README.md
```

---

## 🧰 Instalación y puesta en marcha

```bash
# 1) iniciar proyecto
npm init -y

# 2) dependencias
npm i express mongoose morgan cors dotenv
npm i -D nodemon

# 3) scripts en package.json
#   Agrega:
#   "scripts": {
#     "dev": "nodemon src/app.js",
#     "start": "node server.js"
#   }
```

Crea un archivo **.env** en la raíz:

```
PORT=3000
MONGODB_URI="mongodb://127.0.0.1:27017/class-zero"  # o tu string de Atlas
```

> En Atlas, recuerda permitir tu IP y crear un usuario con permisos.

---

## Conexión a la base de datos (`src/config/db.js`)

```js
import mongoose from "mongoose";

export async function connectMongo(uri) {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri, { dbName: "class-zero" });
    console.log("[mongo] conectado");
  } catch (err) {
    console.error("[mongo] error de conexión:", err.message);
    process.exit(1);
  }
}
```

---

## Modelo `User` (`src/models/user.model.js`)

```js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age:  { type: Number, required: true, min: 0 },
    email:{ type: String, required: true, unique: true, lowercase: true, trim: true }
  },
  { timestamps: true }
);

export const UserModel = mongoose.model("User", userSchema);
```

---

## Router de usuarios (`src/routes/users.router.js`)

```js
import { Router } from "express";
import { UserModel } from "../models/user.model.js";

export const usersRouter = Router();

// GET /api/users
usersRouter.get("/", async (req, res, next) => {
  try {
    const users = await UserModel.find().lean();
    res.json(users);
  } catch (err) { next(err); }
});

// GET /api/users/:id
usersRouter.get("/:id", async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) { next(err); }
});

// POST /api/users
usersRouter.post("/", async (req, res, next) => {
  try {
    const created = await UserModel.create(req.body);
    res.status(201).json(created);
  } catch (err) { next(err); }
});

// PUT /api/users/:id (reemplazo)
usersRouter.put("/:id", async (req, res, next) => {
  try {
    const updated = await UserModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json(updated);
  } catch (err) { next(err); }
});

// DELETE /api/users/:id
usersRouter.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await UserModel.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ error: "User not found" });
    res.status(204).send();
  } catch (err) { next(err); }
});
```

---

## Middleware de errores (`src/middlewares/error.handler.js`)

```js
export function errorHandler(err, req, res, next) {
  console.error("[error]", err);
  // errores de Mongoose (duplicado, validación, etc.)
  if (err?.code === 11000) return res.status(409).json({ error: "email duplicado" });
  if (err?.name === "ValidationError") return res.status(400).json({ error: err.message });
  res.status(500).json({ error: "internal_error" });
}
```

---

## App principal (`src/app.js`)

```js
import "dotenv/config";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import { connectMongo } from "./config/db.js";
import { usersRouter } from "./routes/users.router.js";
import { errorHandler } from "./middlewares/error.handler.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

// middlewares base
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// health
app.get("/health", (req, res) => res.json({ ok: true }));

// router principal
app.use("/api/users", usersRouter);

// manejo de errores (AL FINAL)
app.use(errorHandler);

// start
await connectMongo(process.env.MONGODB_URI);
app.listen(PORT, () => console.log(`▶ server on http://localhost:${PORT}`));
```

---

## 🔌 Probar con Postman (o curl)

**Crear**

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace","age":36,"email":"ada@lovelace.dev"}'
```

**Listar**

```bash
curl http://localhost:3000/api/users
```

**Detalle por id**

```bash
curl http://localhost:3000/api/users/<_id>
```

**Actualizar**

```bash
curl -X PUT http://localhost:3000/api/users/<_id> \
  -H "Content-Type: application/json" \
  -d '{"age":37}'
```

**Eliminar**

```bash
curl -X DELETE http://localhost:3000/api/users/<_id>
```

> **Tip**: arma una **colección Postman** con estas requests y variables de entorno (`baseUrl`).

---

## Actividad en clase (Hands-on)

1. Conectar el servidor a Mongo (local o Atlas).
2. Implementar CRUD completo para `User` con validaciones.
3. Probar cada endpoint desde Postman.

---


## Conceptos clave (resumen)

* **API REST**: contrato entre frontend y backend (endpoints, payloads, status).
* **Express**: router y middlewares en orden de ejecución.
* **MongoDB/Mongoose**: ODM para definir esquemas y validar datos.
* **Postman**: cliente para probar métodos no-GET y enviar JSON.

---

## Troubleshooting

* `ECONNREFUSED mongodb`: revisa `MONGODB_URI` y si el cluster/local está arriba.
* `EADDRINUSE :3000`: cambia `PORT` o cierra procesos previos.
* `11000 duplicate key`: el `email` ya existe; usa otro email o elimina el doc.
* CORS en front: habilita `cors()` (ya incluido) y revisa origen.

---

## Recursos sugeridos

* Documentación Express (Routing, Middlewares)
* Documentación Mongoose (Schemas, Models)
* Postman Learning Center

> Esta clase sienta la base para **Clase 2** (Sessions, Cookies & Storage) y **Clase 3** (Autenticación/Autorización con Passport y JWT).
