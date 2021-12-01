// Rutas para las asociaciones de las selecciones únicas
const express = require('express')
const router = express.Router()
const tagUniqueSelectionAssociationController = require('../controllers/tagUniqueSelectionAssociationController')
const { check } = require('express-validator')
const auth = require('../middleware/auth')

// Guardar asociación
// api/tag-uniqueSelections
router.post('/:uniqueSelection/image/:imageSelected',
    auth,
    tagUniqueSelectionAssociationController.crearAsociacionDeSeleccionUnica
)

// Obtener asociaciones por usuario
router.get('/user/:id',
    auth,
    tagUniqueSelectionAssociationController.obtenerAsociacionesPorUsuario
)

// Eliminar(resetear) todas las selecciones únicas etiquetadas por usuario
router.delete('/user/:id',
    auth,
    tagUniqueSelectionAssociationController.eliminarAsociacionesPorUsuario
)

module.exports = router;