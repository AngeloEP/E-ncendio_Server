const Image = require('../models/Image')
const League = require('../models/League')
const bcryptjs = require('bcryptjs')
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

        // Encontrar liga a asociar
        liga = await League.findOne({ level: 1 })

        // Guardar la Liga a la que pertenece la imagen
        image.league_id = liga._id;

        const { filename } = req.file
        image.setImagegUrl(filename)

        await image.save()

        res.json(image)

    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de guardar la imagen'})
    }
}