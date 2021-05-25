const TagHangmanAssociation = require('../models/TagHangmanAssociation')
const Usuario = require('../models/Usuario')
const Hangman = require('../models/Hangman')
const Category = require('../models/Category')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

exports.crearAsociacionDeAhorcado = async (req, res) => {
    
    // Extraer información de la asociación
    const {  } = req.body

    try {
        ahorcadoAsociado = new TagHangmanAssociation()
        ahorcadoAsociado.user_id = req.usuario.id
        ahorcadoAsociado.hangman_id = req.params.hangman
        ahorcadoAsociado.associatedWord = req.params.associatedWord

        await ahorcadoAsociado.save()

        res.json(ahorcadoAsociado)

    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de asociar el ahorcado a la categoría'})
    }
}

exports.obtenerAsociacionesPorUsuario = async (req, res) => {
    try {
        let id = mongoose.Types.ObjectId(req.params.id);
        console.log(id)
        // const asociacionesAhorcados = await TagHangmanAssociation.aggregate([
        //     { $match: { user_id: id } },
        //     // { $lookup: {from: 'categories', localField: 'category_id', foreignField: '_id', as: 'category_id'} },
        //     { $lookup: {from: 'hangmens', localField: 'hangman_id', foreignField: '_id', as: 'hangman_id'} },
        //     { $replaceWith: {
        //         $mergeObjects: [
        //             { _id: "$_id" },
        //             // { $arrayToObject: { $map: {
        //             //         input: "$category_id", in: [ "categoria", "$$this.name" ] 
        //             //     } } },
        //             // { $arrayToObject: { $map: {
        //             //         input: "$hangman_id" 
        //             //     } } }
        //         ]
        //     } },
        // ])
        const asociacionesAhorcados = await TagHangmanAssociation.find({ user_id: id })
                                    .populate("hangman_id");
        console.log(asociacionesAhorcados)
        res.json({ asociacionesAhorcados })
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo obtener las asociaciones de ahorcados de este usuario')
    }
}

exports.eliminarAsociacionesPorUsuario = async (req, res) => {
    try {
        const etiquetasReseteadas = await TagHangmanAssociation.deleteMany(
            {
                user_id: req.params.id
            }
        )
        res.status(200).send( "Se han reseteado las etiquetas de ahorcados " )
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo obtener las asociaciones de ahorcados de este usuario')
    }
}