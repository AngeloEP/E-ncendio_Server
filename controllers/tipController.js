const Tip = require('../models/Tip')
const Profile = require('../models/Profile')
const League = require('../models/League')
const ViewedTipAssociation = require('../models/ViewedTipAssociation')
const Usuario = require('../models/Usuario')
const DailyTask = require('../models/DailyTask')
const Level = require('../models/Level')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const moment = require('moment-timezone');
const mongoose = require('mongoose')

exports.guardarTip = async (req, res) => {
    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    const { text } = req.body

    try {
        let perfilAntiguo = await Profile.findOne({ user_id: req.usuario.id })
        let ligaAntigua = await League.findOne({ _id: perfilAntiguo.league_id })
        // Revisar que el Tip no exista
        let tip = await Tip.findOne({ text })

        if (tip) {
            return res.status(400).json({ msg: 'Este Tip ya existe' })
        }

        // Crear el nuevo Tip
        tip = new Tip(req.body)

        // Encontrar nivel a asociar
        nivel = await Level.findOne({ level: 1 })

        // Guardar al Nivel al que pertenece el Tip
        tip.level_id = nivel._id;
        tip.user_id = req.usuario.id;

        // Fechas de creacion
        tip.createdAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss")
        tip.updatedAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss");
        let usuario = await Usuario.findOne({ "_id": req.usuario.id })
        if (usuario.isAdmin) {
            tip.isEnabled = true
        } else {
            tip.isEnabled = false
        }

        let addPoints = 0;
        let nuevoPerfil = {}
        if (ligaAntigua.league === "Bronce") addPoints = 10; else if (ligaAntigua.league === "Plata") addPoints = 7; else addPoints = 5;
        nuevoPerfil.score = perfilAntiguo.score + addPoints;

        if ( nuevoPerfil.score >= ligaAntigua.pointsNextLeague ) {
            let nuevaLiga = ""
            switch (ligaAntigua.league) {
                case "Bronce":
                    nuevaLiga = "Plata"
                    break;

                case "Plata":
                    nuevaLiga = "Oro"
                    break;
            
                default:
                    nuevaLiga = "Oro"
                    break;
            }
            ligaNueva = await League.findOne({ league: nuevaLiga })
            nuevoPerfil.league_id = ligaNueva._id
        }

        await Profile.findOneAndUpdate({ _id : perfilAntiguo._id }, nuevoPerfil, { new: true } );

        await tip.save()

        perfilAntiguo = await Profile.findOne({user_id: req.usuario.id})
        let id = mongoose.Types.ObjectId(req.usuario.id);
        let uploads = await Tip.countDocuments({ user_id: id });
        let recompensa = null
        if ([5,10,15,20,25].includes(uploads)) {
            recompensa = {
                msg: "Por haber aportado con ".concat(uploads).concat(" tips al sitio, obtuviste "),
                count: uploads,
                firePoints: uploads
            }

            nuevoPerfil = {};
            nuevoPerfil.firePoints = perfilAntiguo.firePoints + uploads
            await Profile.findOneAndUpdate({ _id : perfilAntiguo._id }, nuevoPerfil, { new: true } )
        }

        let recompensaTareas = null
        let nuevaTarea = {}
        let tareas = await DailyTask.find({ user_id: req.usuario.id, isActivated: true, isClaimed: false, type: "Tip", mode: "uploads" })
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

        res.json({tip, reward: recompensa, rewardTasks: recompensaTareas })
        
    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de guardar el Tip'})
    }
}

exports.obtenerTips = async (req, res) => {
    try {
        const tips = await Tip.find({ isEnabled: true })
        res.json({ tips })
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de obtener los Tips' })
    }
}

exports.obtenerTipsPorUsuario = async (req, res) => {
    try {
        let id = mongoose.Types.ObjectId(req.usuario.id);
        const tips = await Tip.aggregate([
            { $match: { user_id: id } },
            { $replaceWith: {
                "_id": "$_id",
                "Texto": "$text",
                "Puntos" : "$points",
                "Estado" : "$isEnabled",
                "Creado el" : "$createdAt",
                "Actualizado el" : "$updatedAt",
            } },
          ])
        res.json({ tips })
    } catch (error) {
        console.log(error)
        res.status(400).json({ msg: 'Hubo un error al tratar de obtener los Tips del usuario' })
    }
}

exports.eliminarTipPorUsuario = async (req, res) => {
    try {
        let tip = await Tip.findById(req.params.id);
        
        if (!tip) {
            return res.status(404).json({ msg: "No existe el Tip" });
        }

        if (req.usuario.id != tip.user_id) {
            return res.status(404).json({ msg: "Este usuario no tiene permisos para eliminar este Tip" });
        }

        // Eliminar tip
        await Tip.findOneAndRemove({ _id: req.params.id })


        res.json({ msg: "Tip eliminado correctamente" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de eliminar el Tip' })
    }
}

exports.modificarTipPorUsuario = async (req, res) => {

    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    try {
        const {
            text,
        } = req.body;
        // Comprobar si existe el Tip
        let tipAntiguo = await Tip.findById(req.params.id)

        if (!tipAntiguo) {
            return res.status(404).json({ msg: "No existe ese Tip" })
        }
        if ( tipAntiguo.user_id.toString() !== req.usuario.id ) {
            return res.status(401).json({ msg: "No Autorizado, no puede editar el Tip de este Usuario" })
        }

        let tipNuevo = {}
        tipNuevo.text = text
        let usuario = await Usuario.findOne({ "_id": req.usuario.id })
        if (usuario.isAdmin) {
            tipNuevo.isEnabled = true
        } else {
            tipNuevo.isEnabled = false
        }

        // Guardar Tip modificada
        tipAntiguo = await Tip.findOneAndUpdate(
                        { _id : req.params.id },
                        tipNuevo,
                        { new: true }
                        );

        
        await tipAntiguo.save()

        res.json({ tipAntiguo })

    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo modificar el Tip seleccionada')
    }
}

exports.habilitarOinhabilitarTipPorUsuario = async (req, res) => {
    try {
        // Comprobar si existe el Tip
        let tipAntiguo = await Tip.findById(req.params.id)

        if (!tipAntiguo) {
            return res.status(404).json({ msg: "No existe ese Tip" })
        }
        let usuarioModificador = await Usuario.findById(req.usuario.id)
        if ( !usuarioModificador.isAdmin ) {
            return res.status(401).json({ msg: "No Autorizado, debe ser un usuario administrador" })
        }

        let tipNuevo = {}
        tipNuevo.isEnabled = !tipAntiguo.isEnabled

        // Guardar Tip modificado
        tipAntiguo = await Tip.findOneAndUpdate(
                        { _id : req.params.id },
                        tipNuevo,
                        { new: true }
                        );

        
        await tipAntiguo.save()

        tipAntiguo = await Tip.aggregate([
            { $match: { _id: tipAntiguo._id } },
            { $replaceWith: {
                "_id": "$_id",
                "Texto": "$text",
                "Puntos" : "$points",
                "Habilitada" : "$isEnabled",
                "Creadoel" : "$createdAt",
                "Actualizadoel" : "$updatedAt",
            } },
        ])

        res.json({ tipAntiguo })
        
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo habilitar/inhabilitar el Tip') 
    }
}

exports.eliminarTipPorUsuarioDesdeAdmin = async (req, res) => {
    try {
        let tip = await Tip.findById(req.params.id);        
        if (!tip) {
            return res.status(404).json({ msg: "No existe el Tip" });
        }

        let usuarioModificador = await Usuario.findById(req.usuario.id)
        if ( !usuarioModificador.isAdmin ) {
            return res.status(401).json({ msg: "No Autorizado, debe ser un usuario administrador" })
        }

        await Tip.findOneAndRemove({ _id: req.params.id })
        await ViewedTipAssociation.deleteMany({ tip_id: req.params.id })

        res.json({ msg: "Tip eliminada correctamente" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de eliminar el Tip' })
    }
}

exports.modificarTipDesdeAdmin = async (req, res) => {
    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    try {
        const {
            points,
        } = req.body;
        // Comprobar si existe el Tip
        let tipAntiguo = await Tip.findById(req.params.id)

        if (!tipAntiguo) {
            return res.status(404).json({ msg: "No existe ese Tip" })
        }
        let usuarioModificador = await Usuario.findById(req.usuario.id)
        if ( !usuarioModificador.isAdmin ) {
            return res.status(401).json({ msg: "No Autorizado, debe ser un usuario administrador" })
        }
 
        let tipNuevo = {}
        tipNuevo.points = points

        // Guardar tip modificado
        tipAntiguo = await Tip.findOneAndUpdate(
                        { _id : req.params.id },
                        tipNuevo,
                        { new: true }
                        );

        await tipAntiguo.save()

        tipNuevo = await Tip.aggregate([
            { $match: { _id: tipAntiguo._id } },
            { $replaceWith: {
                "_id": "$_id",
                "Texto": "$text",
                "Puntos" : "$points",
                "Habilitada" : "$isEnabled",
                "Creadoel" : "$createdAt",
                "Actualizadoel" : "$updatedAt",
            } },
        ])

        res.json({ tipNuevo })

    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo modificar el Tip seleccionada')
    }
}