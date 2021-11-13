const ViewedTipAssociation = require('../models/ViewedTipAssociation')
const Usuario = require('../models/Usuario')
const DailyTask = require('../models/DailyTask')
const Profile = require('../models/Profile')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

exports.crearAsociacionDeTip = async (req, res) => {

    try {
        tipAsociado = new ViewedTipAssociation()
        tipAsociado.user_id = req.usuario.id
        tipAsociado.tip_id = req.params.tip

        let tipRepetido = {}

        let perfil = await Profile.findOne({user_id: req.usuario.id})
        let nuevoPerfil = {};
        nuevoPerfil.tipViewed = perfil.tipViewed + 1;
        await Profile.findOneAndUpdate({ _id : perfil._id }, nuevoPerfil, { new: true } )

        let id = mongoose.Types.ObjectId(req.usuario.id);
        let views = nuevoPerfil.tipViewed;
        let recompensa = null
        if ([20,50,100,150,200].includes(views)) {
            recompensa = {
                msg: "Por haber visto ".concat(views).concat(" Tips acerca de incendios, obtuviste "),
                count: views,
                firePoints: views
            }

            nuevoPerfil = {};
            nuevoPerfil.firePoints = perfil.firePoints + views
            await Profile.findOneAndUpdate({ _id : perfil._id }, nuevoPerfil, { new: true } )
        }
        
        let recompensaTareas = null
        let nuevaTarea = {}
        perfil = await Profile.findOne({user_id: req.usuario.id})
        let tareas = await DailyTask.find({ user_id: req.usuario.id, isActivated: true, isClaimed: false, type: "Tip", mode: "vieweds" })
        if (tareas.length > 0) {
            tareas.forEach( async (tareita) => {
                nuevaTarea.newCount = tareita.newCount + 1;
                if ( nuevaTarea.newCount === tareita.total ) {
                    nuevaTarea.isClaimed = true;
                    recompensaTareas = {
                        msg: "Cumpliste tu tarea de: ".concat(tareita.message).concat(", obtuviste "),
                        count: tareita.total,
                        firePoints: 15
                    }
                    nuevoPerfil = {};
                    nuevoPerfil.firePoints = perfil.firePoints + 15
                    await Profile.findOneAndUpdate({ _id : perfil._id }, nuevoPerfil, { new: true } )
                }
                await DailyTask.findOneAndUpdate({ _id : tareita._id }, nuevaTarea, { new: true } )
            })
        }

        etiquetaExistente = await ViewedTipAssociation.findOne({ user_id: req.usuario.id, tip_id: req.params.tip })
        if (etiquetaExistente) {
            await ViewedTipAssociation.findOneAndUpdate({ _id : etiquetaExistente._id }, tipRepetido, { new: true } );
            res.json({tipRepetido, reward: recompensa, rewardTasks: recompensaTareas })
        } else {
            await tipAsociado.save()
            res.json({tipAsociado, reward: recompensa, rewardTasks: recompensaTareas })
        }
    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de asociar el Tip al usuario'})
    }
}

exports.obtenerAsociacionesPorUsuario = async (req, res) => {
    try {
        const asociacionesTips = await ViewedTipAssociation.find({ user_id: req.params.id })
                                    .populate("tip_id");
        res.json({ asociacionesTips })
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo obtener las asociaciones de Tips de este usuario')
    }
}

exports.eliminarAsociacionesPorUsuario = async (req, res) => {
    try {
        const etiquetasReseteadas = await ViewedTipAssociation.deleteMany(
            {
                user_id: req.params.id
            }
        )
        res.status(200).send( "Se han reseteado los Tips vistos" )
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo obtener las asociaciones de Tips de este usuario')
    }
}