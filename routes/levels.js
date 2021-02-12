const express = require('express')
const router = express.Router()
const levelController = require('../controllers/levelController')
const { check } = require('express-validator')
const auth = require('../middleware/auth')

// Crea un Nivel
// api/levels
router.post('/',
    auth,
    [
        check('level', 'Debe ingresar un Nivel').not().isEmpty()
    ],
    levelController.crearNivel
)

router.get('/',
    auth,
    [
        check('level', 'Debe ingresar un Nivel').not().isEmpty()
    ],
    levelController.obtenerNiveles
)

module.exports = router;