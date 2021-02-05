// Rutas para las imágenes
const express = require('express')
const upload = require('../libs/storage')
const router = express.Router()
const imageController = require('../controllers/imageController')
const { check } = require('express-validator')
const auth = require('../middleware/auth')

// Guardar imagen
// api/images
router.post('/',
    auth,
    upload.single('image'),
    [
        check('filename', 'El nombre de la imagen es obligatorio').not().isEmpty(),
        check('difficulty', 'Debes ingresar una dificultad asociada a la imagen').not().isEmpty(),
        check('points', 'Debes ingresar una cantidad de puntos asociados a la imagen').not().isEmpty(),
    ],
    imageController.guardarImagen
)

module.exports = router;