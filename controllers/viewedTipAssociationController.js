const ViewedTipAssociation = require('../models/ViewedTipAssociation')
const Usuario = require('../models/Usuario')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

exports.crearAsociacionDeTip = async (req, res) => {

    try {
        tipAsociado = new ViewedTipAssociation()
        tipAsociado.user_id = req.usuario.id
        tipAsociado.tip_id = req.params.tip

        let tipRepetido = {}

        etiquetaExistente = await ViewedTipAssociation.findOne({ tip_id: req.params.tip })
        if (etiquetaExistente) {
            await ViewedTipAssociation.findOneAndUpdate({ _id : etiquetaExistente._id }, tipRepetido, { new: true } );
            res.json(tipRepetido)
        } else {
            await tipAsociado.save()
            res.json(tipAsociado)
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