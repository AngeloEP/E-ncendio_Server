const League = require('../models/League')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')

exports.crearLiga = async (req, res) => {
    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    const { league } = req.body
    try {
        let liga = await League.findOne({ league })

        if (liga) {
            return res.status(400).json({ msg: 'La liga ya existe' })
        }

        liga = new League(req.body)
        await liga.save()

        res.json(liga)

    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de guardar la liga'})
    }

}