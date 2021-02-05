const League = require('../models/League')
const { validationResult } = require('express-validator')

exports.crearLiga = async (req, res) => {

    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    try {
        // Crear una Liga
        const liga = new League(req.body)

        // Guardamos la liga
        liga.save()
        res.json(liga)

    } catch (error) {
        console.log(error)
        res.status(500).send('Hubo un error en el servidor al tratar de crear una Liga')
    }

}

exports.obtenerLigas = async (req, res) => {
    try {
        const ligas = await League.find().sort({ creado: -1})
        res.json({ ligas })
    } catch (error) {
        console.log(error)
        res.status(500).send('Hubo un error')
    }
}