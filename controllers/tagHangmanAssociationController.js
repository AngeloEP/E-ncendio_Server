const TagHangmanAssociation = require('../models/TagHangmanAssociation')
const Usuario = require('../models/Usuario')
const Hangman = require('../models/Hangman')
const Profile = require('../models/Profile')
const DailyTask = require('../models/DailyTask')
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

        let ahorcadoRepetido = {}
        ahorcadoRepetido.associatedWord = req.params.associatedWord

        let perfil = await Profile.findOne({user_id: req.usuario.id})
        let nuevoPerfil = {};
        nuevoPerfil.hangmanTagCount = perfil.hangmanTagCount + 1;
        await Profile.findOneAndUpdate({ _id : perfil._id }, nuevoPerfil, { new: true } )

        let id = mongoose.Types.ObjectId(req.usuario.id);
        let tags = nuevoPerfil.hangmanTagCount;
        let recompensa = null
        if ([10,25,50,100,200].includes(tags)) {
            recompensa = {
                msg: "Por completar ".concat(tags).concat(" ahorcados, obtuviste "),
                count: tags,
                firePoints: tags
            }

            nuevoPerfil = {};
            nuevoPerfil.firePoints = perfil.firePoints + tags
            await Profile.findOneAndUpdate({ _id : perfil._id }, nuevoPerfil, { new: true } )
        }

        let recompensaTareas = null
        let nuevaTarea = {}
        let tareas = await DailyTask.find({ user_id: req.usuario.id, isActivated: true, isClaimed: false, type: "Hangman", mode: "counts" })
        if (tareas.length > 0) {
            tareas.forEach( async (tareita) => {
                nuevaTarea.newCount = tareita.newCount + 1;
                if ( nuevaTarea.newCount === tareita.total ) {
                    nuevaTarea.isClaimed = true;
                    recompensaTareas = {
                        msg: "Cumpliste tu tarea de: ".concat(tareita.message).concat(", obtuviste "),
                        count: tareita.total,
                        firePoints: 25
                    }
                    nuevoPerfil = {};
                    nuevoPerfil.firePoints = perfil.firePoints + 25
                    await Profile.findOneAndUpdate({ _id : perfil._id }, nuevoPerfil, { new: true } )
                }
                await DailyTask.findOneAndUpdate({ _id : tareita._id }, nuevaTarea, { new: true } )
            })
        }

        etiquetaExistente = await TagHangmanAssociation.findOne({user_id: req.usuario.id, hangman_id: req.params.hangman })
        if (etiquetaExistente) {
            await TagHangmanAssociation.findOneAndUpdate({ _id : etiquetaExistente._id }, ahorcadoRepetido, { new: true } );
            res.json({ahorcadoRepetido, reward: recompensa, rewardTasks: recompensaTareas })
        } else {
            await ahorcadoAsociado.save()
    
            res.json({ahorcadoAsociado, reward: recompensa, rewardTasks: recompensaTareas })
        }

    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de asociar el ahorcado a la categoría'})
    }
}

exports.obtenerAsociacionesPorUsuario = async (req, res) => {
    try {
        let id = mongoose.Types.ObjectId(req.params.id);
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