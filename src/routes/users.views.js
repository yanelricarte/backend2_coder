import { Router } from 'express';
const r = Router();

// Home: deriva según tenga user o no
r.get('/', (req, res) => {
  if (req.user) return res.redirect('/current');
  return res.redirect('/login');
});

// Form login (si ya está logueado, a /current)
r.get('/login', (req, res) => {
  if (req.user) return res.redirect('/current');
  res.render('login.handlebars');            // tu form que hace POST a /api/sessions/login-web
});

// Current: muestra datos del user
r.get('/current', (req, res) => {
  if (!req.user) return res.redirect('/login?from=current&login=required');
  res.render('current.handlebars', { user: req.user });
});

export default r;
