const express = require('express')
const router = express.Router()
const profileController = require('../controllers/profileController')
const { check } = require('express-validator')
const auth = require('../middleware/auth')

// Obtiene todos los perfiles
router.get('/',
    auth,
    profileController.obtenerTodosLosPerfiles
)

router.put('/:id',
    auth,
    profileController.actualizarPuntuacionYLigaPerfil
)

module.exports = router;