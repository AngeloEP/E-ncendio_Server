// Rutas para las Categorías
const express = require('express')
const router = express.Router()
const categoryController = require('../controllers/categoryController')
const { check } = require('express-validator')
const auth = require('../middleware/auth')

// Crear categoría
// api/categories
router.post('/',
    auth,
    [
        check('name', 'El nombre de la categoría es obligatorio').not().isEmpty(),
    ],
    categoryController.crearCategoria
)

// Obtiene las categorías
router.get('/',
    auth,
    categoryController.obtenerCategorias
)

module.exports = router;