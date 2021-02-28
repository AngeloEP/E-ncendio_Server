const Word = require('../models/Word')
const Level = require('../models/Level')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')

exports.guardarPalabra = async (req, res) => {
    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    const { name } = req.body

    try {
        // Revisar que la Palabra no exista
        let word = await Word.findOne({ name })

        if (word) {
            return res.status(400).json({ msg: 'La Palabra ya existe' })
        }

        // Crear la nueva Palabra
        word = new Word(req.body)

        // Encontrar nivel a asociar
        nivel = await Level.findOne({ level: 1 })

        // Guardar al Nivel al que pertenece la Palabra
        word.level_id = nivel._id;

        await word.save()

        res.json(word)
        
    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de guardar la Palabra'})
    }
}

exports.obtenerPalabras = async (req, res) => {
    try {
        const palabras = await Word.find({})
        res.json({ palabras })
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de obtener las Palabras' })
    }
}