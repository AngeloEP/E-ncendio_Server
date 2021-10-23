const { validationResult } = require('express-validator');
const DailyTask = require('../models/DailyTask');
const Usuario = require('../models/Usuario');
const Profile = require('../models/Profile')
const Task = require('../models/Task');
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

exports.obtenerTareasUsuario = async (req, res) => {
    try {
        let tareas = await DailyTask.find({ user_id: req.usuario.id, isActivated: true })
        res.json({ tareas })
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de obtener las tareas del usuario' })
    }
}

exports.crearNuevasTareas = async (req, res) => {
    try {
        console.log("creando tareas")
        let options = { multi: true, upsert: true };
        await DailyTask.updateMany(
            {isActivated: true},
            {isActivated: false},
            options
        );
        let usuarios = await Usuario.find({});
        let perfilUsuario;
        let elegidos = []
        let randomData = []
        let result;
        usuarios.forEach( async user => {
            perfilUsuario = await Profile.findOne({user_id: user._id})
            elegidos = []
            randomData = []
            randomData = await Task.find({ league_id: perfilUsuario.league_id });
            for (let index = 0; index < 3; index++) {
                var random = Math.floor(Math.random() * (randomData.length) )
                result = randomData[random];
                elegidos.push(result)
                randomData = randomData.filter(function(value, index, arr){ 
                    return (value.mode !== result.mode) | (value.type !== result.type);
                });
            }
            elegidos.forEach(async element => {
                // Add document to user
                let task = new DailyTask;
                task.user_id = user._id;
                task.league_id = element.league_id;
                task.message = element.message;
                task.type = element.type;
                task.mode = element.mode;
                task.total = element.total;
                task.newCount = 0;
                task.isClaimed = false;
                task.isActivated = true;
                task.createdAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss");
                task.updatedAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss");
                await task.save();
            });
            elegidos.splice(0, elegidos.length);
        });
        res.json({ msg: "tareas creadas exitosamente" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de crear las nuevas tareas a los usuarios' })
    }
}

exports.entregarRecompensasMejoresParticipantes = async (req, res) => {
    try {
        console.log("entregando puntaje diario")
        let perfiles = await Profile.find({}).populate("user_id")
        perfiles = perfiles.sort((a, b) => parseFloat(b["score"]) - parseFloat(a["score"]));
        
        let ganadores = [
            perfiles[0],
            perfiles[1],
            perfiles[2]
        ]
        let perfilUsuario;
        let points = [25, 20, 15];
        let nuevoPerfil;
        ganadores.forEach( async (ganador, index) => {
            perfilUsuario = await Profile.findOne({user_id: ganador.user_id._id})
            nuevoPerfil = {};
            nuevoPerfil.firePoints = perfilUsuario.firePoints + points[index]
            await Profile.findOneAndUpdate({ _id : perfilUsuario._id }, nuevoPerfil, { new: true } )
        });
        res.json({ msg: "Recompensas diarias entregadas" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de entregar las recompensas diarias' })
    }
}