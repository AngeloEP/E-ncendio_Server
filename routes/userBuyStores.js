// Rutas para las imágenes
const express = require('express')
const router = express.Router()
const userBuyStoreController = require('../controllers/userBuyStoreController')
const { check } = require('express-validator')
const auth = require('../middleware/auth')

// Comprar un marco a tienda
// api/userBuyStores
router.post('/buy/frame/:id',
    auth,
    userBuyStoreController.comprarMarcoATienda,
)

// Comprar un apodo a tienda
router.post('/buy/nickname/:id',
    auth,
    userBuyStoreController.comprarApodoATienda,
)

// Obtener productos comprados por usuario
router.get('/',
    auth,
    userBuyStoreController.obtenerProductosPorUsuario,
)

module.exports = router;