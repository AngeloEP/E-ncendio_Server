const TagImageAssociation = require('../models/TagImageAssociation')
const Usuario = require('../models/Usuario')
const Image = require('../models/Image')
const Category = require('../models/Category')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')

exports.crearAsociacionDeImagen = async (req, res) => {
    
    // Extraer información de la asociación
    const {  } = req.body

    try {
        imagenAsociada = new TagImageAssociation()
        imagenAsociada.user_id = req.usuario.id
        imagenAsociada.image_id = req.params.image
        imagenAsociada.category_id = req.params.category

        await imagenAsociada.save()

        res.json(imagenAsociada)

    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de asociar la imagen a la categoría'})
    }
}