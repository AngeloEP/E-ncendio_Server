const TagWordAssociation = require('../models/TagWordAssociation')
const Usuario = require('../models/Usuario')
const Category = require('../models/Category')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

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

exports.obtenerAsociacionesPorUsuario = async (req, res) => {
    try {
        let id = mongoose.Types.ObjectId(req.params.id);
        const asociacionesPalabras = await TagWordAssociation.aggregate([
            { $match: { user_id: id } },
            { $lookup: {from: 'categories', localField: 'category_id', foreignField: '_id', as: 'category_id'} },
            { $lookup: {from: 'words', localField: 'word_id', foreignField: '_id', as: 'word_id'} },
            { $replaceWith: {
                $mergeObjects: [
                    { _id: "$_id" },
                    { $arrayToObject: { $map: {
                            input: "$category_id", in: [ "categoria", "$$this.name" ] 
                        } } },
                    { $arrayToObject: { $map: {
                            input: "$word_id", in: [ "palabra", "$$this.name" ] 
                        } } }
                ]
            } },
        ])
        res.json({ asociacionesPalabras })
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo obtener las asociaciones de palabras de este usuario')
    }
}

exports.eliminarAsociacionesPorUsuario = async (req, res) => {
    try {
        const etiquetasReseteadas = await TagWordAssociation.deleteMany(
            {
                user_id: req.params.id
            }
        )
        res.status(200).send( "Se han reseteado las etiquetas de palabras " )
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo obtener las asociaciones de palabras de este usuario')
    }
}