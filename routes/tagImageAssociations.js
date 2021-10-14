// Rutas para las asociaciones de imágenes a categorías
const express = require('express')
const router = express.Router()
const tagImageAssociationController = require('../controllers/tagImageAssociationController')
const { check } = require('express-validator')
const auth = require('../middleware/auth')


// Guardar asociación
// api/tag-images
router.post('/:image/category/:category',
    auth,
    tagImageAssociationController.crearAsociacionDeImagen
)

// Obtener asociaciones por usuario
router.get('/user/:id',
    auth,
    tagImageAssociationController.obtenerAsociacionesPorUsuario
)

// Eliminar(resetear) todas las imagenes etiquetadas por usuario
router.delete('/user/:id',
    auth,
    tagImageAssociationController.eliminarAsociacionesPorUsuario
)

// Obtener distribución de imágenes etiquetadas
router.post('/distribution',
    auth,
    tagImageAssociationController.obtenerDistribucionImagenesEtiquetadas
)

// Obtener imágenes de cierta etiqueta
router.post('/category/:category',
    tagImageAssociationController.imagenesEtiquetadasPorCategoria
)

module.exports = router;