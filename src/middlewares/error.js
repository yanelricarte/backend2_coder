
export default (err, _req, res, _next) => {
  console.error(err);
  const code = 
  err.name === 'ValidationError' ? 422 :
  err.code === 11000 ? 409 : 500;

  res.status(code).json({ message: err.message || 'Error interno' });
  }