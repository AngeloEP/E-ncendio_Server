const TagImageAssociation = require('../models/TagImageAssociation')
const Usuario = require('../models/Usuario')
const Image = require('../models/Image')
const Category = require('../models/Category')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')

exports.crearAsociacionDeImagen = async (req, res) => {
    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    // Extraer información de la asociación
    const {  } = req.body

    try {
        imagenAsociada = new TagImageAssociation(req.body)

        await imagenAsociada.save()

        console.log("Asociacion de imagen a categoría: ", imagenAsociada)
        res.json(imagenAsociada)

    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de asociar la imagen a la categoría'})
    }
}