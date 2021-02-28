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

module.exports = router;