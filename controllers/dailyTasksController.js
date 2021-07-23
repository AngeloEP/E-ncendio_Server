const { validationResult } = require('express-validator');
const DailyTask = require('../models/DailyTask');
const Usuario = require('../models/Usuario');
const moment = require('moment-timezone');
const Task = require('../models/Task');
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