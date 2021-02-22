// Rutas para las ligas
const express = require('express')
const router = express.Router()
const leagueController = require('../controllers/leagueController')
const { check } = require('express-validator')
const auth = require('../middleware/auth')

// Guardar liga
// api/leagues
router.post('/',
    auth,
    [
        check('league', 'El nombre de la liga debe ser obligatorio').not().isEmpty(),
        check('pointsNextLeague', 'El nombre de la liga debe ser obligatorio').isNumeric(),
    ],
    leagueController.crearLiga
)

module.exports = router;