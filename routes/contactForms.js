// Rutas para los formularios de contacto
const express = require('express')
const router = express.Router()
const contactFormController = require('../controllers/contactFormController')
const { check } = require('express-validator')
const auth = require('../middleware/auth')

// Guardar el formulario de contacto y enviar correo al Admin del Sitio
// api/contact-form
router.post('/send-email',
    auth,
    [
        check('email', 'Su Correo es obligatorio').isEmail(),
        check('subject', 'Debe ingresar un Asunto asociado a la observación').not().isEmpty(),
        check('message', 'Debe ingresar un Mensaje asociado a la observación').not().isEmpty(),
    ],
    contactFormController.guardarFormularioDeContacto,    
    contactFormController.enviarCorreo,    
)

module.exports = router;