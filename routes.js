const express = require('express');
const router = express.Router();
const { createToken, verifyToken } = require('./auth');
const { client } = require('./db'); // Importa la conexión

// Registro de usuario 
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const result = await client.query(
      'INSERT INTO users (username, password, role, created_at) VALUES ($1, $2, $3, CURRENT_DATE) RETURNING *',
      [username, password, role || 'employee']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
});

// Login de usuario
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await client.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );
    const user = result.rows[0];
    if (user) {
      const token = createToken(user);
      return res.json({ token });
    } else {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
});

// Obtener todos los usuarios (solo admin)
router.get('/users', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'No autorizado' });
  }
  try {
    const result = await client.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

// Obtener todos los productos
router.get('/productos', verifyToken, async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener productos' });
  }
});

// Crear producto (solo admin)
router.post('/productos', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'No autorizado' });
  }
  const { product_code, description, material_id, initial_price, final_price, weight, supplier } = req.body;
  try {
    const result = await client.query(
      `INSERT INTO products 
       (product_code, description, material_id, initial_price, final_price, weight, supplier, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE) RETURNING *`,
      [product_code, description, material_id, initial_price, final_price, weight, supplier]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error al crear producto' });
  }
});

// Actualizar producto (solo admin)
router.put('/productos/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'No autorizado' });
  }
  const { id } = req.params;
  const { description, material_id, initial_price, final_price, weight, supplier } = req.body;
  try {
    const result = await client.query(
      `UPDATE products SET description = $1, material_id = $2, initial_price = $3, final_price = $4, weight = $5, supplier = $6, updated_at = CURRENT_DATE WHERE id = $7 RETURNING *`,
      [description, material_id, initial_price, final_price, weight, supplier, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
});

// Eliminar producto (solo admin)
router.delete('/productos/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'No autorizado' });
  }
  const { id } = req.params;
  try {
    await client.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
});

// Registrar movimiento
router.post('/movimientos', verifyToken, async (req, res) => {
  const { movement_type, product_id, quantity } = req.body;
  if ((movement_type === 'add' || movement_type === 'edit') && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Solo el admin puede agregar o editar productos' });
  }
  if (movement_type === 'withdraw' && req.user.role !== 'employee') {
    return res.status(403).json({ message: 'Solo los empleados pueden retirar productos' });
  }
  try {
    const result = await client.query(
      `INSERT INTO movements (user_id, product_id, movement_type, quantity, movement_date) 
       VALUES ($1, $2, $3, $4, CURRENT_DATE) RETURNING *`,
      [req.user.id, product_id, movement_type, quantity]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error al registrar movimiento' });
  }
});

// Obtener todos los movimientos (solo admin)
router.get('/movimientos', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'No autorizado' });
  }
  try {
    const result = await client.query('SELECT * FROM movements');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener movimientos' });
  }
});

// Obtener movimientos de un usuario específico
router.get('/movimientos/:id', verifyToken, async (req, res) => {
  const iduser = req.user.id;
  try {
    const result = await client.query('SELECT * FROM movements WHERE user_id = $1', [iduser]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener movimientos' });
  }
});

module.exports = router;
