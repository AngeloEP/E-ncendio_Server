const express = require('express')
const router = express.Router()
const leagueController = require('../controllers/leagueController')
const { check } = require('express-validator')
const auth = require('../middleware/auth')

// Crea una Liga
// api/leagues
router.post('/',
    auth,
    [
        check('level', 'Debe ingresar un Nivel de Liga').not().isEmpty()
    ],
    leagueController.crearLiga
)

router.get('/',
    auth,
    [
        check('level', 'Debe ingresar un Nivel de Liga').not().isEmpty()
    ],
    leagueController.obtenerLigas
)

module.exports = router;