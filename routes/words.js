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
    ],
    wordController.guardarPalabra
)

// Obtiene las palabras subidas por usuario
router.get('/user',
    auth,
    wordController.obtenerPalabrasPorUsuario
)

// Eliminar una palabra del usuario
router.delete('/user/:id',
    auth,
    wordController.eliminarPalabraPorUsuario
)

// Actualizar palabra
router.put('/user/word/:id',
    auth,
    [
        check('name', 'El nombre de la Palabra es obligatorio').not().isEmpty(),
    ],
    wordController.modificarPalabraPorUsuario
)

router.put('/user/word/isEnabled/:id',
    auth,
    wordController.habilitarOinhabilitarPalabraPorUsuario
)

router.delete('/user/word/:id',
    auth,
    wordController.eliminarPalabraPorUsuarioDesdeAdmin
)

router.put('/user/word/difficultyAndPoints/:id',
    auth,
    [
        check('difficulty', 'Debes ingresar una dificultad asociada a la palabra').not().isEmpty(),
        check('points', 'Debes ingresar una cantidad de puntos asociados a la palabra').isNumeric(),
    ],
    wordController.modificarPalabraDesdeAdmin
)

module.exports = router;