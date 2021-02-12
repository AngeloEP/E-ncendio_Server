const Level = require('../models/Level')
const Usuario = require('../models/Usuario')
const League = require('../models/League')
const Profile = require('../models/Profile')

const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')

exports.crearPerfil = async (req, res) => {
    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    try {
        perfil = new Profile()
        // Encontrar el usuario a asociar
        console.log(perfil)
        const { email } = req.body
        usuario = await Usuario.findOne({ email: email })
        perfil.user_id = usuario['_id']

        // Asociar los niveles de imágenes, palabras, y 4images del perfil a 1
        nivel = await Level.findOne({ level: 1 })
        perfil.level_image_id = nivel['_id']
        perfil.level_word_id = nivel['_id']
        perfil.level_four_image_id = nivel['_id']
        
        // Asociar a la liga más baja
        liga = await League.findOne({ league: 'Bronce' })
        perfil.league_id = liga['_id']

        // Iniciar el Puntaje del perfil en 0
        perfil.score = 0

        await perfil.save()

        res.json(image)

    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de guardar el perfil'})
    }

}

exports.obtenerTodosLosPerfiles = async (req, res) => {
    try {
        const perfiles = await Profile.find({})
        res.json({ perfiles })
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de obtener los perfiles' })
    }
}