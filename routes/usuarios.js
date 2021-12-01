// Rutas para crear usuarios
const express = require('express')
const router = express.Router()
const usuarioController = require('../controllers/usuarioController')
const profileController = require('../controllers/profileController')
const { check } = require('express-validator')
const auth = require('../middleware/auth')

// api/usuarios

router.get('/',
    auth,
    usuarioController.obtenerUsuarios
)

// Crea un usuario
router.post('/',
    usuarioController.cargarImagenUsuario,
    [
        check('firstname', 'El Nombre es obligatorio').not().isEmpty(),
        check('lastname', 'El Apellido es obligatorio').not().isEmpty(),
        check('gender', 'El Género es obligatorio').not().isEmpty(),
        check('city', 'El Apellido es obligatorio').not().isEmpty(),
        check('age', 'Su edad es obligatoria y debe ser un número').isNumeric(),
        check('phone', 'Su teléfono es obligatoro y debe ser de 9 dígitos').isLength( {min:9,max:9} ),
        check('email', 'Agrega un email válido').isEmail(),
        check('password', 'El password debe ser mínimo de 6 caracteres').isLength({ min: 6 }),
        check('isFireRelated', 'Debes seleccionar si tus actividades se relacionan con incendios').isBoolean(),
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

router.put('/:id/adminYbloqueo',
    auth,
    [
        check('isAdmin', 'Debes señalar tu condición de administrador').not().isEmpty(),
        check('isBlocked', 'Debes señalar tu condición de Bloqueado o no').not().isEmpty(),
    ],
    usuarioController.cambiarAdminConBloqueo
)

router.get('/:id/images',
    auth,
    usuarioController.obtenerImagenesSubidasPorUsuario
)

router.get('/:id/words',
    auth,
    usuarioController.obtenerPalabrasSubidasPorUsuario
)

router.get('/:id/hangmans',
    auth,
    usuarioController.obtenerAhorcadosSubidosPorUsuario
)

router.get('/:id/uniqueSelections',
    auth,
    usuarioController.obtenerSeleccionesUnicasSubidasPorUsuario
)

router.get('/:id/tips',
    auth,
    usuarioController.obtenerTipsSubidosPorUsuario
)

router.get('/getCSVTagImages',
    auth,
    usuarioController.obtenerCSVImagenesEtiquetadas
)

router.get('/getCSVTagWords',
    auth,
    usuarioController.obtenerCSVPalabrasEtiquetadas
)

router.get('/getCSVTagUniqueSelections',
    usuarioController.obtenerCSVSeleccionesUnicasEtiquetadas
)

module.exports = router;