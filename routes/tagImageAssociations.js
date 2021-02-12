// Rutas para las asociaciones de imágenes a categorías
const express = require('express')
const router = express.Router()
const tagImageAssociationController = require('../controllers/tagImageAssociationController')
const { check } = require('express-validator')
const auth = require('../middleware/auth')


// Guardar asociación
// api/tagImageAssociations
router.post('/',
    auth,
    [
        check('user_id', 'La relación a un usuario es obligatorio').not().isEmpty(),
        check('image_id', 'La relación a una imagen es obligatorio').not().isEmpty(),
        check('category_id', 'La relación a una categoría es obligatorio').not().isEmpty(),
    ],
    tagImageAssociationController.crearAsociacionDeImagen
)

module.exports = router;