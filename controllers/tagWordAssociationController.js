const TagWordAssociation = require('../models/TagWordAssociation')
const Usuario = require('../models/Usuario')
const Category = require('../models/Category')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')

exports.crearAsociacionDePalabra = async (req, res) => {
    
    // Extraer información de la asociación
    const {  } = req.body

    try {
        palabraAsociada = new TagWordAssociation()
        palabraAsociada.user_id = req.usuario.id
        palabraAsociada.word_id = req.params.word
        palabraAsociada.category_id = req.params.category

        await palabraAsociada.save()

        res.json(palabraAsociada)

    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de asociar la Palabra a la categoría'})
    }
}