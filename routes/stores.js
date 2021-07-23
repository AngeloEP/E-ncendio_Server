// Rutas para las imágenes
const express = require('express')
const router = express.Router()
const storeController = require('../controllers/storeController')
const { check } = require('express-validator')
const auth = require('../middleware/auth')

// Guardar producto a tienda
// api/stores
router.post('/',
    storeController.agregarStore,
)

router.get('/',
    storeController.obtenerProductosTienda,
)

module.exports = router;