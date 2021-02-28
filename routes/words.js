// Rutas para las Palabras
const express = require('express')
const router = express.Router()
const wordController = require('../controllers/wordController')
const { check } = require('express-validator')
const auth = require('../middleware/auth')


// Obtiene las Palabras (agregar de cierta liga)
// api/words
router.get('/',
    auth,
    wordController.obtenerPalabras
)

// Guardar Palabra
router.post('/',
    auth,
    [
        check('name', 'El nombre de la Palabra es obligatorio').not().isEmpty(),
        check('difficulty', 'Debes ingresar una dificultad asociada a la Palabra').not().isEmpty(),
        check('points', 'Debes ingresar una cantidad de puntos asociados a la Palabra').isNumeric(),
    ],
    wordController.guardarPalabra
)

module.exports = router;