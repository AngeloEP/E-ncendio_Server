const Image = require('../models/Image')
const Level = require('../models/Level')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')

exports.guardarImagen = async (req, res) => {
    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    // Extraer información de la imagen
    const { filename } = req.body
    
    try {
        
        // Crear la nueva imagen
        image = new Image(req.body)

        if( !req.file ) {
            return res.status(400).json({ msg: 'No ha adjuntado la imagen' })
        }

        // Encontrar nivel a asociar
        nivel = await Level.findOne({ level: 1 })

        // Guardar al Nivel al que pertenece la imagen
        image.level_id = nivel._id;

        const { filename } = req.file
        image.setImagegUrl(filename)

        await image.save()

        res.json(image)

    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de guardar la imagen'})
    }
}

exports.obtenerImagenes = async (req, res) => {
    try {
        const imagenes = await Image.find({})
        res.json({ imagenes })
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de obtener las imágenes' })
    }
}