// Rutas para las imágenes
const express = require('express')
const router = express.Router()
const imageController = require('../controllers/imageController')
const { check } = require('express-validator')

// Guardar imagen
// api/images
router.post('./',
    [
        check('filename', 'El nombre de la imagen es obligatorio').not().isEmpty(),
    ],
    imageController.guardarImagen
)

module.exports = router;