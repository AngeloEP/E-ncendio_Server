// Rutas para las imágenes
const express = require('express')
const router = express.Router()
const imageController = require('../controllers/imageController')
const { check } = require('express-validator')
const auth = require('../middleware/auth')

// Guardar imagen
// api/images
router.post('/',
    auth,
    imageController.cargarImagen,
    [
        // check('filename', 'El nombre de la imagen es obligatorio').not().isEmpty(),
        check('difficulty', 'Debes ingresar una dificultad asociada a la imagen').not().isEmpty(),
        check('points', 'Debes ingresar una cantidad de puntos asociados a la imagen').isNumeric(),
    ],
    imageController.guardarImagen
)

// Obtiene las imágenes (agregar de cierta liga)
router.get('/',
    auth,
    imageController.obtenerImagenes
)

// Obtiene las imágenes subidas por usuario
router.get('/user',
    auth,
    imageController.obtenerImagenesPorUsuario
)

// Eliminar una imagen del usuario
router.delete('/user/:id',
    auth,
    imageController.eliminarImagenPorUsuario
)

router.put('/user/image/:id',
    auth,
    imageController.cargarONoImagen,
    [
        check('difficulty', 'Debes ingresar una dificultad asociada a la imagen').not().isEmpty(),
        check('points', 'Debes ingresar una cantidad de puntos asociados a la imagen').isNumeric(),
    ],
    imageController.modificarImagenPorUsuario
)

router.put('/user/image/isEnabled/:id',
    auth,
    imageController.habilitarOinhabilitarImagenPorUsuario
)

router.delete('/user/image/:id',
    auth,
    imageController.eliminarImagenPorUsuarioDesdeAdmin
)

module.exports = router;