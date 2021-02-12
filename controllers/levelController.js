const Level = require('../models/Level')
const { validationResult } = require('express-validator')

exports.crearNivel = async (req, res) => {

    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    try {
        // Crear un Nivel
        const nivel = new Level(req.body)

        // Guardamos el Nivel
        nivel.save()
        res.json(nivel)

    } catch (error) {
        console.log(error)
        res.status(500).send('Hubo un error en el servidor al tratar de crear una Liga')
    }

}

exports.obtenerNiveles = async (req, res) => {
    try {
        const niveles = await Level.find().sort({ creado: -1})
        res.json({ niveles })
    } catch (error) {
        console.log(error)
        res.status(500).send('Hubo un error')
    }
}