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

        // Iniciar el Puntaje del juego del perfil en 0
        perfil.score = 1

        await perfil.save()

        // res.json(perfil)

    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de guardar el perfil'})
    }

}

exports.obtenerTodosLosPerfiles = async (req, res) => {
    try {
        const perfiles = await Profile.find({})
                                        .populate("league_id")
                                        .populate("user_id");
        res.json({ perfiles })
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de obtener los perfiles' })
    }
}

exports.actualizarPuntuacionYLigaPerfil = async (req, res) => {
    try {

        const {
            user_id,
            level_image_id,
            level_word_id,
            level_four_image_id,
            league_id,
            score,
        } = req.body;
        // Comprobar si existe el perfil
        let perfil = await Profile.findById(req.params.id)
        
        if (!perfil) {
            return res.status(404).json({ msg: "No existe ese Perfil de Usuario" })
        }

        if ( user_id.toString() !== req.usuario.id ) {
            return res.status(401).json({ msg: "No Autorizado, no puede editar el Perfil" })
        }

        const nuevoPerfil = {}
        nuevoPerfil.score = score
        if ( typeof league_id === "string" ) {
            let nuevaLiga = ""
            switch (league_id) {
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

        // Guardar Perfil
        perfil = await Profile.findOneAndUpdate({ _id : req.params.id }, nuevoPerfil, { new: true } )
                                .populate("league_id")
                                .populate("level_image_id")
                                .populate("level_word_id")
                                .populate("level_four_image_id");
        res.json({ perfil })

    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo modificar su puntaje')
    }
}