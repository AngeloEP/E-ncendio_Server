const TagImageAssociation = require('../models/TagImageAssociation')
const Usuario = require('../models/Usuario')
const Image = require('../models/Image')
const Category = require('../models/Category')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

exports.crearAsociacionDeImagen = async (req, res) => {
    
    // Extraer información de la asociación
    const {  } = req.body

    try {
        imagenAsociada = new TagImageAssociation()
        imagenAsociada.user_id = req.usuario.id
        imagenAsociada.image_id = req.params.image
        imagenAsociada.category_id = req.params.category

        let imagenRepetida = {}
        imagenRepetida.category_id = req.params.category

        etiquetaExistente = await TagImageAssociation.findOne({ image_id: req.params.image })
        if (etiquetaExistente) {
            await TagImageAssociation.findOneAndUpdate({ _id : etiquetaExistente._id }, imagenRepetida, { new: true } );
            res.json(imagenRepetida)
        } else {
            await imagenAsociada.save()
    
            res.json(imagenAsociada)
        }

    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de asociar la imagen a la categoría'})
    }
}

exports.obtenerAsociacionesPorUsuario = async (req, res) => {
    try {
        let id = mongoose.Types.ObjectId(req.params.id);
        const asociacionesImagenes = await TagImageAssociation.aggregate([
            { $match: { user_id: id } },
            { $lookup: {from: 'categories', localField: 'category_id', foreignField: '_id', as: 'category_id'} },
            { $lookup: {from: 'images', localField: 'image_id', foreignField: '_id', as: 'image_id'} },
            { $replaceWith: {
                $mergeObjects: [
                    { _id: "$_id" },
                    { $arrayToObject: { $map: {
                            input: "$category_id", in: [ "categoria", "$$this.name" ] 
                        } } },
                    { $arrayToObject: { $map: {
                            input: "$image_id", in: [ "urlImagen", "$$this.imageUrl" ] 
                        } } }
                ]
            } },
        ])
        res.json({ asociacionesImagenes })
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo obtener las asociaciones de imágenes de este usuario')
    }
}

exports.eliminarAsociacionesPorUsuario = async (req, res) => {
    try {
        const etiquetasReseteadas = await TagImageAssociation.deleteMany(
            {
                user_id: req.params.id
            }
        )
        res.status(200).send( "Se han reseteado las etiquetas de imágenes " )
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo obtener las asociaciones de imágenes de este usuario')
    }
}