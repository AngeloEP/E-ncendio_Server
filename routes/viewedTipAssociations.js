// Rutas para las asociaciones de tips a usuarios
const express = require('express')
const router = express.Router()
const viewedTipAssociationController = require('../controllers/viewedTipAssociationController')
const { check } = require('express-validator')
const auth = require('../middleware/auth')


// Guardar asociación
// api/view-tips
router.post('/:tip',
    auth,
    viewedTipAssociationController.crearAsociacionDeTip
)

// Obtener asociaciones por usuario
router.get('/user/:id',
    auth,
    viewedTipAssociationController.obtenerAsociacionesPorUsuario
)

// Eliminar(resetear) todas los Tips vistos por usuario
router.delete('/user/:id',
    auth,
    viewedTipAssociationController.eliminarAsociacionesPorUsuario
)

module.exports = router;