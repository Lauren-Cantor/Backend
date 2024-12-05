const express = require('express');
const router = express.Router();
const { createToken } = require('./auth');
const { client } = require('./db'); // Importa la conexión
const bcrypt = require('bcrypt');


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
    const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Compara la contraseña directamente sin bcrypt
    if (password !== user.password) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    const token = createToken(user); // Suponiendo que tienes esta función para crear el token
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error(err);  // Muestra el error real para depuración
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
});


// Obtener todos los usuarios (solo admin)
router.get('/users', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

// Obtener todos los productos
router.get('/productos', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener productos' });
  }
});

// Obtener un producto por su ID
router.get('/productos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await client.query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener producto' });
  }
});


// Crear producto (solo admin)
router.post('/productos', async (req, res) => {
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
router.put('/productos/:id', async (req, res) => {
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
router.delete('/productos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await client.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
});

// Registrar movimiento
router.post('/movimientos', async (req, res) => {
  const { movement_type, product_id, quantity } = req.body;
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
router.get('/movimientos', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM movements');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener movimientos' });
  }
});

// Obtener movimientos de un usuario específico
router.get('/movimientos/:id', async (req, res) => {
  const iduser = req.user.id;
  try {
    const result = await client.query('SELECT * FROM movements WHERE user_id = $1', [iduser]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener movimientos' });
  }
});

// Obtener todos los materiales
router.get('/materials', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM materials');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener materiales' });
  }
});

// Crear un nuevo material (solo admin)
router.post('/materials', async (req, res) => {
  const { material_name } = req.body;
  try {
    const result = await client.query(
      'INSERT INTO materials (material_name) VALUES ($1) RETURNING *',
      [material_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error al crear material' });
  }
});

// Actualizar un material existente (solo admin)
router.put('/materials/:id', async (req, res) => {
  const { id } = req.params;
  const { material_name } = req.body;
  try {
    const result = await client.query(
      'UPDATE materials SET material_name = $1 WHERE id = $2 RETURNING *',
      [material_name, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Material no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar material' });
  }
});

module.exports = router;
