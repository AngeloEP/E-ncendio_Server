// Rutas para las 4 imágenes y una palabra
const express = require('express')
const router = express.Router()
const uniqueSelectionController = require('../controllers/uniqueSelectionController')
const { check } = require('express-validator')
const auth = require('../middleware/auth')

// Guardar contenido de selección única
// api/uniqueSelections
router.post('/',
    auth,
    uniqueSelectionController.cargarImagenes,
    [
        check('keyWord', 'Debes ingresar una palabra clave para este contenido').not().isEmpty(),
    ],
    uniqueSelectionController.guardarSeleccionUnica
)

// Obtiene las selecciones únicas en la BD (agregar de cierta liga)
router.get('/',
    auth,
    uniqueSelectionController.obtenerSeleccionesUnicas
)

// Obtiene las selecciones únicas subidas por usuario
router.get('/user',
    auth,
    uniqueSelectionController.obtenerSeleccionesUnicasPorUsuario
)

// Eliminar una selección única del usuario
router.delete('/user/:id',
    auth,
    uniqueSelectionController.eliminarSeleccionUnicaPorUsuario
)

// Modificar selección única específica
router.put('/user/uniqueSelection/:id',
    auth,
    uniqueSelectionController.cargarONoImagenes,
    uniqueSelectionController.modificarSeleccionUnicaPorUsuario
)

// Modificar disponibilidad de la selección única
router.put('/user/uniqueSelection/isEnabled/:id',
    auth,
    uniqueSelectionController.habilitarOinhabilitarSeleccionUnicaPorUsuario
)

// Eliminar una selección única desde un usuario administrador
router.delete('/user/uniqueSelection/:id',
    auth,
    uniqueSelectionController.eliminarSeleccionUnicaPorUsuarioDesdeAdmin
)

// Modificar dificultad, palabra y puntos de una selección única
router.put('/user/uniqueSelection/difficultyAndPoints/:id',
    auth,
    [
        check('keyWord', 'Debes ingresar una palabra clave para este contenido').not().isEmpty(),
        check('difficulty', 'Debes ingresar una dificultad asociada al contenido').not().isEmpty(),
        check('points', 'Debes ingresar una cantidad de puntos asociados al contenido').isNumeric(),
    ],
    uniqueSelectionController.modificarSeleccionUnicaDesdeAdmin
)

module.exports = router;