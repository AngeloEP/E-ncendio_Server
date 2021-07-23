const TagWordAssociation = require('../models/TagWordAssociation')
const Usuario = require('../models/Usuario')
const Profile = require('../models/Profile')
const DailyTask = require('../models/DailyTask')
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

        let palabraRepetida = {}
        palabraRepetida.category_id = req.params.category

        let perfil = await Profile.findOne({user_id: req.usuario.id})
        let nuevoPerfil = {};
        nuevoPerfil.wordTagCount = perfil.wordTagCount + 1;
        await Profile.findOneAndUpdate({ _id : perfil._id }, nuevoPerfil, { new: true } )

        let tags = nuevoPerfil.wordTagCount;
        let recompensa = null
        if ([10,25,50,100,200].includes(tags)) {
            recompensa = {
                msg: "Por etiquetar ".concat(tags).concat(" palabras, obtuviste "),
                count: tags,
                firePoints: tags
            }

            nuevoPerfil = {};
            nuevoPerfil.firePoints = perfil.firePoints + tags
            await Profile.findOneAndUpdate({ _id : perfil._id }, nuevoPerfil, { new: true } )
        }

        let recompensaTareas = null
        let nuevaTarea = {}
        let tareas = await DailyTask.find({ user_id: req.usuario.id, isActivated: true, isClaimed: false, type: "Word", mode: "counts" })
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

        etiquetaExistente = await TagWordAssociation.findOne({ user_id: req.usuario.id, word_id: req.params.word })
        if (etiquetaExistente) {
            await TagWordAssociation.findOneAndUpdate({ _id : etiquetaExistente._id }, palabraRepetida, { new: true } );
            res.json({palabraRepetida, reward: recompensa, rewardTasks: recompensaTareas })
        } else {
            await palabraAsociada.save()
    
            res.json({palabraAsociada, reward: recompensa, rewardTasks: recompensaTareas })
        }

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