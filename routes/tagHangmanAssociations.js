// Rutas para las asociaciones de ahorcados a categorías
const express = require('express')
const router = express.Router()
const tagHangmanAssociationController = require('../controllers/tagHangmanAssociationController')
const { check } = require('express-validator')
const auth = require('../middleware/auth')


// Guardar asociación
// api/tag-hangmans
router.post('/:hangman/word/:associatedWord',
    auth,
    tagHangmanAssociationController.crearAsociacionDeAhorcado
)

// Obtener asociaciones por usuario
router.get('/user/:id',
    auth,
    tagHangmanAssociationController.obtenerAsociacionesPorUsuario
)

// Eliminar(resetear) todas los ahorcados etiquetadas por usuario
router.delete('/user/:id',
    auth,
    tagHangmanAssociationController.eliminarAsociacionesPorUsuario
)

module.exports = router;