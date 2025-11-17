
import Router from './router.js';
import { POL, handlePolicies } from '../middlewares/policies.js';

// 🗂️ “DB” en memoria solo para demo
const DB = [{ name: 'Milo', specie: 'dog', adopted: false }];

/** Normaliza nombres para comparación y claves */
const normalizeName = (s = '') =>
  String(s).normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

export default class PetsRouter extends Router {
  init() {
    // GET /api/pets (PUBLIC)
    this.get('/', [handlePolicies([POL.PUBLIC])], (_req, res) => {
      return res.sendSuccess(DB);
    });

    // GET /api/pets/:pet (PUBLIC) – letras (incluye acentos), espacio, guión y apóstrofo
    this.get(
      "/:pet([A-Za-zÁÉÍÓÚáéíóúÜüÑñ \\-']+)",
      [handlePolicies([POL.PUBLIC])],
      (req, res) => {
        const q = normalizeName(decodeURIComponent(req.params.pet));
        const pet = DB.find(p => normalizeName(p.name) === q);
        if (!pet) return res.sendError('Mascota no encontrada', 404);
        return res.sendSuccess(pet);
      }
    );

    // PUT /api/pets/:petName (AUTHENTICATED) – marca adopted=true
    this.put(
      '/:petName',
      [handlePolicies([POL.AUTHENTICATED])],
      (req, res) => {
        const q = normalizeName(decodeURIComponent(req.params.petName));
        const pet = DB.find(p => normalizeName(p.name) === q);
        if (!pet) return res.sendError('Mascota no encontrada', 404);
        pet.adopted = true;
        return res.sendSuccess(pet, 200);
      }
    );

    // POST /api/pets (ADMIN) – alta con validación mínima
    this.post(
      '/',
      [handlePolicies([POL.ADMIN])],
      (req, res) => {
        const { name, specie } = req.body || {};
        if (!name || !specie) return res.sendError('Datos inválidos: name y specie son requeridos', 400);

        const key = normalizeName(name);
        const exists = DB.some(p => normalizeName(p.name) === key);
        if (exists) return res.sendError('Mascota ya existe', 409);

        const pet = { name: name.trim(), specie: String(specie).trim(), adopted: false };
        DB.push(pet);
        return res.sendSuccess(pet, 201);
      }
    );
  }
}
