// Rutas para crear usuarios
const express = require('express')
const router = express.Router()
const usuarioController = require('../controllers/usuarioController')
const profileController = require('../controllers/profileController')
const { check } = require('express-validator')
const auth = require('../middleware/auth')



// Crea un usuario
// api/usuarios
router.post('/',
    usuarioController.cargarImagenUsuario,
    [
        check('firstname', 'El Nombre es obligatorio').not().isEmpty(),
        check('lastname', 'El Apellido es obligatorio').not().isEmpty(),
        check('gender', 'El Género es obligatorio').not().isEmpty(),
        check('age', 'Su edad es obligatoria y debe ser un número').isNumeric(),
        check('phone', 'Su teléfono es obligatoro y debe ser de 9 dígitos').isLength( {min:9,max:9} ),
        check('email', 'Agrega un email válido').isEmail(),
        check('password', 'El password debe ser mínimo de 6 caracteres').isLength({ min: 6 }),
        check('isExpert', 'Debes seleccionar si perteneces o no a FireSES').isBoolean(),
    ],
    usuarioController.crearUsuario,
    profileController.crearPerfil
)

// Obtener el perfil del usuario
router.get('/profile',
    auth,
    usuarioController.obtenerPerfilUsuario
)

// Obtener el nivel de etiquetado de imágenes del usuario
router.get('/level-images',
    auth,
    usuarioController.obtenerNivelImagenesUsuario
)

// Obtener el rango de edades de los usuarios
router.get('/rangeAge',
    auth,
    usuarioController.obtenerRangoDeEdades
)

router.put('/profile/edit/:id',
    auth,
    usuarioController.cargarImagenUsuario,
    [
        check('firstname', 'El Nombre es obligatorio').not().isEmpty(),
        check('lastname', 'El Apellido es obligatorio').not().isEmpty(),
        check('gender', 'El Género es obligatorio').not().isEmpty(),
        check('age', 'Su edad es obligatoria y debe ser un número').isNumeric(),
        check('phone', 'Su teléfono es obligatoro y debe ser de 9 dígitos').isLength( {min:9,max:9} ),
    ],
    usuarioController.modificarUsuario
)

module.exports = router;