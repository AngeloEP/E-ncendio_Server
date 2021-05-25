// Rutas para las 4 imágenes y una palabra
const express = require('express')
const router = express.Router()
const hangmanController = require('../controllers/hangmanController')
const { check } = require('express-validator')
const auth = require('../middleware/auth')

// Guardar imagenes
// api/hangmans
router.post('/',
    auth,
    hangmanController.cargarImagenes,
    [
        check('associatedWord', 'Debes ingresar una palabra de asociación a las imágenes').not().isEmpty(),
    ],
    hangmanController.guardarImagenesPalabra
)

// Obtiene el total de 4 imágenes con sus palabras habilitadas (agregar de cierta liga)
router.get('/',
    auth,
    hangmanController.obtenerImagenesPalabra
)

// Obtiene los ahorcados subidos por usuario
router.get('/user',
    auth,
    hangmanController.obtenerAhorcadosPorUsuario
)

// Eliminar un ahorcado del usuario
router.delete('/user/:id',
    auth,
    hangmanController.eliminarImagenesPalabraPorUsuario
)

// Modificar ahorcado específico
router.put('/user/hangman/:id',
    auth,
    hangmanController.cargarONoImagenes,
    hangmanController.modificarAhorcadoPorUsuario
)

// Modificar disponibilidad del ahorcado
router.put('/user/hangman/isEnabled/:id',
    auth,
    hangmanController.habilitarOinhabilitarAhorcadoPorUsuario
)

// Eliminar un ahorcado desde un usuario administrador
router.delete('/user/hangman/:id',
    auth,
    hangmanController.eliminarAhorcadoPorUsuarioDesdeAdmin
)

// Modificar dificultad, palabra y puntos de un Ahorcado
router.put('/user/hangman/difficultyAndPoints/:id',
    auth,
    [
        check('associatedWord', 'Debes ingresar una palabra asociada a las imágenes').not().isEmpty(),
        check('difficulty', 'Debes ingresar una dificultad asociada al Ahorcado').not().isEmpty(),
        check('points', 'Debes ingresar una cantidad de puntos asociados al Ahorcado').isNumeric(),
    ],
    hangmanController.modificarAhorcadoDesdeAdmin
)

module.exports = router;