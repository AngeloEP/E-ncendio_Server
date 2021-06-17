// Rutas para autenticar usuarios
const express = require('express')
const router = express.Router()
const { check } = require('express-validator')
const authController = require('../controllers/authController')
const auth = require('../middleware/auth')

// Iniciar Sesión
// api/auth
router.post('/',
    authController.autenticarUsuario
)

// Comprobar correo existente
router.post('/send-code',
    authController.enviarCodigo
)

// Cambiar contraseña
router.post('/reset-password',
    authController.cambiarContraseña
)

// Obtiene el usuario autenticado
router.get('/',
    auth,
    authController.usuarioAutenticado
)

// cerrar sesión y actualizar su hora de salida
router.get('/logout',
    auth,
    authController.cerrarSesion
)



module.exports = router;