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

// Obtiene todas las categorías
router.get('/',
    auth,
    categoryController.obtenerTodasLasCategorias
)

// Obtiene todas las categorías VISIBLES
router.get('/isVisible',
    auth,
    categoryController.obtenerCategoriasVisibles
)

// Modificar categorpia
router.put('/:id',
    auth,
    auth,
    [
        check('name', 'El nombre de la categoría es obligatorio').not().isEmpty(),
        check('isVisible', 'Debes seleccionar si será o no visible la categoría').isBoolean(),
    ],
    categoryController.modificarCategoría
)

module.exports = router;