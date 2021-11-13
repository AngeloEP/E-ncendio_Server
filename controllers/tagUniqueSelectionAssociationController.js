const TagUniqueSelectionAssociation = require('../models/TagUniqueSelectionAssociation')
const Profile = require('../models/Profile')
const DailyTask = require('../models/DailyTask')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

exports.crearAsociacionDeSeleccionUnica = async (req, res) => {
    // Extraer información de la asociación
    const {  } = req.body
    try {
        seleccionUnicaAsociada = new TagUniqueSelectionAssociation()
        seleccionUnicaAsociada.user_id = req.usuario.id
        seleccionUnicaAsociada.uniqueSelection_id = req.params.uniqueSelection
        seleccionUnicaAsociada.keyWord = req.params.keyWord

        let seleccionUnicaRepetida = {}
        seleccionUnicaRepetida.keyWord = req.params.keyWord

        let perfil = await Profile.findOne({user_id: req.usuario.id})
        let nuevoPerfil = {};
        nuevoPerfil.uniqueSelectionTagCount = perfil.uniqueSelectionTagCount + 1;
        await Profile.findOneAndUpdate({ _id : perfil._id }, nuevoPerfil, { new: true } )

        let id = mongoose.Types.ObjectId(req.usuario.id);
        let tags = nuevoPerfil.uniqueSelectionTagCount;
        let recompensa = null
        if ([10,25,50,100,200].includes(tags)) {
            recompensa = {
                msg: "Por completar ".concat(tags).concat(" selecciones únicas, obtuviste "),
                count: tags,
                firePoints: tags
            }

            nuevoPerfil = {};
            nuevoPerfil.firePoints = perfil.firePoints + tags
            await Profile.findOneAndUpdate({ _id : perfil._id }, nuevoPerfil, { new: true } )
        }

        let recompensaTareas = null
        let nuevaTarea = {}
        perfil = await Profile.findOne({user_id: req.usuario.id})
        let tareas = await DailyTask.find({ user_id: req.usuario.id, isActivated: true, isClaimed: false, type: "UniqueSelection", mode: "counts" })
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

        etiquetaExistente = await TagUniqueSelectionAssociation.findOne({user_id: req.usuario.id, uniqueSelection_id: req.params.uniqueSelection })
        if (etiquetaExistente) {
            await TagUniqueSelectionAssociation.findOneAndUpdate({ _id : etiquetaExistente._id }, seleccionUnicaRepetida, { new: true } );
            res.json({seleccionUnicaRepetida, reward: recompensa, rewardTasks: recompensaTareas })
        } else {
            await seleccionUnicaAsociada.save()
    
            res.json({seleccionUnicaAsociada, reward: recompensa, rewardTasks: recompensaTareas })
        }

    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de asociar la selección única al usuario'})
    }
}

exports.obtenerAsociacionesPorUsuario = async (req, res) => {
    try {
        let id = mongoose.Types.ObjectId(req.params.id);
        const asociacionesSeleccionesUnicas = await TagUniqueSelectionAssociation.find({ user_id: id })
                                    .populate("uniqueSelection_id");
        res.json({ asociacionesSeleccionesUnicas })
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo obtener las asociaciones de selecciones únicas de este usuario')
    }
}

exports.eliminarAsociacionesPorUsuario = async (req, res) => {
    try {
        const etiquetasReseteadas = await TagUniqueSelectionAssociation.deleteMany(
            {
                user_id: req.params.id
            }
        )
        res.status(200).send( "Se han reseteado las etiquetas de selecciones únicas " )
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo obtener las asociaciones de selecciones únicas de este usuario')
    }
}