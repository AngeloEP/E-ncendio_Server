// Rutas para los Tips
const express = require('express')
const router = express.Router()
const tipController = require('../controllers/tipController')
const { check } = require('express-validator')
const auth = require('../middleware/auth')

// Obtiene los Tips (agregar de cierta liga)
// api/tips
router.get('/',
    auth,
    tipController.obtenerTips
)

// Guardar Tip
router.post('/',
    auth,
    tipController.cargarImagenTip,
    [
        check('text', 'El contenido del Tip es obligatorio').not().isEmpty(),
    ],
    tipController.guardarTip  // AQUI b
)

// Obtiene los Tips subidos por usuario
router.get('/user',
    auth,
    tipController.obtenerTipsPorUsuario // AQUI b
)

// Eliminar un Tip del usuario
router.delete('/user/:id',
    auth,
    tipController.eliminarTipPorUsuario // AQUI b
)

// Actualizar Tip
router.put('/user/tip/:id',
    auth,
    tipController.cargarImagenTip,
    [
        check('text', 'El contenido del Tip es obligatorio').not().isEmpty(),
    ],
    tipController.modificarTipPorUsuario // AQUI b
)

// Habilitar o no un Tip
router.put('/user/tip/isEnabled/:id',
    auth,
    tipController.habilitarOinhabilitarTipPorUsuario // AQUI b
)

// Eliminar un Tip
router.delete('/user/tip/:id',
    auth,
    tipController.eliminarTipPorUsuarioDesdeAdmin // AQUI b
)

// Modificar puntos de un Tip
router.put('/user/tip/points/:id',
    auth,
    [
        check('points', 'Debes ingresar una cantidad de puntos asociados al Tip').isNumeric(),
    ],
    tipController.modificarTipDesdeAdmin // AQUI b
)

module.exports = router;