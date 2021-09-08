// Rutas para las asociaciones de Palabras a categorías
const express = require('express')
const router = express.Router()
const tagWordAssociationController = require('../controllers/tagWordAssociationController')
const { check } = require('express-validator')
const auth = require('../middleware/auth')


// Guardar asociación
// api/tag-words
router.post('/:word/category/:category',
    auth,
    tagWordAssociationController.crearAsociacionDePalabra
)

// Obtener asociaciones por usuario
router.get('/user/:id',
    auth,
    tagWordAssociationController.obtenerAsociacionesPorUsuario
)

// Eliminar(resetear) todas las palabras etiquetadas por usuario
router.delete('/user/:id',
    auth,
    tagWordAssociationController.eliminarAsociacionesPorUsuario
)

// Obtener distribución de palabras etiquetadas
router.get('/distribution',
    auth,
    tagWordAssociationController.obtenerDistribucionPalabrasEtiquetadas
)

// Obtener palabras de cierta etiqueta
router.get('/category/:category',
    tagWordAssociationController.palabrasEtiquetadasPorCategoria
)

module.exports = router;