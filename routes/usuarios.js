// Rutas para crear usuarios
const express = require('express')
const router = express.Router()
const usuarioController = require('../controllers/usuarioController')
const profileController = require('../controllers/profileController')
const { check } = require('express-validator')

// Crea un usuario
// api/usuarios
router.post('/',
    [
        check('firstname', 'El Nombre es obligatorio').not().isEmpty(),
        check('lastname', 'El Apellido es obligatorio').not().isEmpty(),
        check('gender', 'El Género es obligatorio').not().isEmpty(),
        check('age', 'Su edad es obligatoria y debe ser un número').isNumeric(),
        check('email', 'Agrega un email válido').isEmail(),
        check('password', 'El password debe ser mínimo de 6 caracteres').isLength({ min: 6 }),
        check('isExpert', 'Debe ser de tipo booleano').isBoolean(),
    ],
    usuarioController.crearUsuario,
    profileController.crearPerfil
)

module.exports = router;