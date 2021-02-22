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

module.exports = router;