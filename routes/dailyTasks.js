// Rutas para las tareas diarios del usuario
const express = require('express')
const router = express.Router()
const dailyTasksController = require('../controllers/dailyTasksController')
const { check } = require('express-validator')
const auth = require('../middleware/auth')

// api/dailyTasks
// Obtener tareas del usuario
router.get('/',
    auth,
    dailyTasksController.obtenerTareasUsuario
)

// crear nuevas tareas a los usuarios
router.get('/newTasks',
    dailyTasksController.crearNuevasTareas
)

// Entregar recompensas a los mejores participantes
router.get('/rewards',
    dailyTasksController.entregarRecompensasMejoresParticipantes
)

module.exports = router;