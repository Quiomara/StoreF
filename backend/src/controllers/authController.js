const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sendResetEmail = require('../config/mailer');
require('dotenv').config(); // Asegúrate de cargar las variables de entorno

/**
 * Controlador para manejar el inicio de sesión del usuario.
 * @param {Object} req - Objeto de solicitud.
 * @param {Object} res - Objeto de respuesta.
 */
const login = (req, res) => {
  const { correo, contrasena } = req.body;

  // Verificar que el correo y la contraseña se proporcionaron
  if (!correo || !contrasena) {
    return res.status(400).send({ error: 'Correo y contraseña son necesarios.' });
  }

  // Consultar la base de datos para verificar si el usuario existe
  const query = `SELECT * FROM Usuarios WHERE usr_correo = ?`;
  db.query(query, [correo], (err, results) => {
    if (err) {
      return res.status(500).send({ error: 'Error en el servidor.' });
    }

    // Verificar si el usuario no está registrado
    if (results.length === 0) {
      return res.status(404).send({ error: 'Usuario no registrado. Por favor contacta con un administrador.' });
    }

    const user = results[0];

    // Verificar la contraseña
    const validPassword = bcrypt.compareSync(contrasena, user.usr_contrasena);

    if (!validPassword) {
      return res.status(400).send({ error: 'Usuario o contraseña incorrectos.' });
    }

    // Generar token JWT
    const token = jwt.sign({ usr_cedula: user.usr_cedula, tip_usr_id: user.tip_usr_id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Obtener el tipo de usuario
    const userTypeQuery = `SELECT tip_usr_nombre FROM TipoUsuarios WHERE tip_usr_id = ?`;
    db.query(userTypeQuery, [user.tip_usr_id], (err, typeResults) => {
      if (err) {
        return res.status(500).send({ error: 'Error en el servidor.' });
      }

      if (typeResults.length === 0) {
        return res.status(400).send({ error: 'Tipo de usuario no encontrado.' });
      }

      const userType = typeResults[0].tip_usr_nombre;
      res.send({ token, userType, cedula: user.usr_cedula }); // Incluir la cédula en la respuesta
    });
  });
};

/**
 * Controlador para manejar la recuperación de contraseñas.
 * @param {Object} req - Objeto de solicitud.
 * @param {Object} res - Objeto de respuesta.
 */
const forgotPassword = (req, res) => {
  const { correo } = req.body;

  const query = `SELECT * FROM Usuarios WHERE usr_correo = ?`;
  db.query(query, [correo], (err, results) => {
    if (err) {
      return res.status(500).send({ error: 'Error en el servidor.' });
    }

    if (results.length === 0) {
      return res.status(404).send({ error: 'Usuario no registrado. Por favor contacta con un administrador.' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hora

    const updateQuery = `UPDATE Usuarios SET reset_token = ?, reset_token_expiry = ? WHERE usr_correo = ?`;
    db.query(updateQuery, [resetToken, resetTokenExpiry, correo], (err, results) => {
      if (err) {
        return res.status(500).send({ error: 'Error en el servidor.' });
      }

      // Envía el correo con el token
      sendResetEmail(correo, resetToken);
      res.send({ message: `Ve a tu correo ${correo} y haz clic en el enlace de restablecimiento de contraseña que se te ha enviado.` });
    });
  });
};

/**
 * Controlador para manejar el restablecimiento de contraseñas.
 * @param {Object} req - Objeto de solicitud.
 * @param {Object} res - Objeto de respuesta.
 */
const resetPassword = (req, res) => {
  const { token, newPassword } = req.body;

  // Verificar que el token y la nueva contraseña se proporcionaron
  if (!token || !newPassword) {
    return res.status(400).send({ message: 'Token y nueva contraseña son necesarios.' });
  }

  // Consultar la base de datos para verificar si el token es válido y no ha expirado
  const query = `SELECT * FROM Usuarios WHERE reset_token = ? AND reset_token_expiry > ?`;
  db.query(query, [token, Date.now()], (err, results) => {
    if (err) {
      return res.status(500).send({ error: 'Error en el servidor.' });
    }

    if (results.length === 0) {
      return res.status(400).send({ message: 'Token inválido o ha expirado.' });
    }

    const user = results[0];

    // Actualizar la contraseña en la base de datos
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    const updateQuery = `UPDATE Usuarios SET usr_contrasena = ?, reset_token = NULL, reset_token_expiry = NULL WHERE usr_cedula = ?`;
    db.query(updateQuery, [hashedPassword, user.usr_cedula], (err, results) => {
      if (err) {
        return res.status(500).send({ error: 'Error en el servidor.' });
      }

      res.send({ message: 'Contraseña restablecida con éxito' });
    });
  });
};

module.exports = { login, forgotPassword, resetPassword };






