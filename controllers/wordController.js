const Word = require('../models/Word')
const Profile = require('../models/Profile')
const League = require('../models/League')
const TagWordAssociation = require('../models/TagWordAssociation')
const Usuario = require('../models/Usuario')
const Level = require('../models/Level')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const moment = require('moment-timezone');
const mongoose = require('mongoose')

exports.guardarPalabra = async (req, res) => {
    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    const { name } = req.body

    try {
        let perfilAntiguo = await Profile.findOne({ user_id: req.usuario.id })
        let ligaAntigua = await League.findOne({ _id: perfilAntiguo.league_id })
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
        word.user_id = req.usuario.id;

        // Fechas de creacion
        word.createdAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss")
        word.updatedAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss");
        let usuario = await Usuario.findOne({ "_id": req.usuario.id })
        if (usuario.isAdmin) {
            word.isEnabled = true
        } else {
            word.isEnabled = false
        }

        let nuevoPerfil = {}
        nuevoPerfil.score = perfilAntiguo.score + 10

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

        await word.save()

        res.json(word)
        
    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de guardar la Palabra'})
    }
}

exports.obtenerPalabras = async (req, res) => {
    try {
        const palabras = await Word.find({ isEnabled: true })
        res.json({ palabras })
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de obtener las Palabras' })
    }
}

exports.obtenerPalabrasPorUsuario = async (req, res) => {
    try {
        let id = mongoose.Types.ObjectId(req.usuario.id);
        const palabras = await Word.aggregate([
            { $match: { user_id: id } },
            { $replaceWith: {
                "_id": "$_id",
                "Palabra": "$name",
                "Dificultad" : "$difficulty",
                "Puntos" : "$points",
                "Estado" : "$isEnabled",
                "Creado el" : "$createdAt",
                "Actualizado el" : "$updatedAt",
            } },
          ])
        res.json({ palabras })
    } catch (error) {
        console.log(error)
        res.status(400).json({ msg: 'Hubo un error al tratar de obtener las palabras del usuario' })
    }
}

exports.eliminarPalabraPorUsuario = async (req, res) => {
    try {
        let palabra = await Word.findById(req.params.id);
        
        if (!palabra) {
            return res.status(404).json({ msg: "No existe la palabra" });
        }

        if (req.usuario.id != palabra.user_id) {
            return res.status(404).json({ msg: "Este usuario no tiene permisos para eliminar esta palabra" });
        }

        // Eliminar palabra
        await Word.findOneAndRemove({ _id: req.params.id })


        res.json({ msg: "Palabra eliminada correctamente" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de eliminar la palabra' })
    }
}

exports.modificarPalabraPorUsuario = async (req, res) => {

    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    try {
        const {
            name,
            difficulty,
            points,
        } = req.body;
        // Comprobar si existe la palabra
        let palabraAntigua = await Word.findById(req.params.id)

        if (!palabraAntigua) {
            return res.status(404).json({ msg: "No existe esa palabra" })
        }
        if ( palabraAntigua.user_id.toString() !== req.usuario.id ) {
            return res.status(401).json({ msg: "No Autorizado, no puede editar la palabra de este Usuario" })
        }

        let palabraNueva = {}
        palabraNueva.name = name
        palabraNueva.difficulty = difficulty
        palabraNueva.points = points
        let usuario = await Usuario.findOne({ "_id": req.usuario.id })
        if (usuario.isAdmin) {
            palabraNueva.isEnabled = true
        } else {
            palabraNueva.isEnabled = false
        }

        // Guardar Palabra modificada
        palabraAntigua = await Word.findOneAndUpdate(
                        { _id : req.params.id },
                        palabraNueva,
                        { new: true }
                        );

        
        await palabraAntigua.save()

        res.json({ palabraAntigua })

    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo modificar la palabra seleccionada')
    }
}

exports.habilitarOinhabilitarPalabraPorUsuario = async (req, res) => {
    try {
        // Comprobar si existe la palabra
        let palabraAntigua = await Word.findById(req.params.id)

        if (!palabraAntigua) {
            return res.status(404).json({ msg: "No existe esa palabra" })
        }
        let usuarioModificador = await Usuario.findById(req.usuario.id)
        if ( !usuarioModificador.isAdmin ) {
            return res.status(401).json({ msg: "No Autorizado, debe ser un usuario administrador" })
        }

        let palabraNueva = {}
        palabraNueva.isEnabled = !palabraAntigua.isEnabled

        // Guardar palabra modificada
        palabraAntigua = await Word.findOneAndUpdate(
                        { _id : req.params.id },
                        palabraNueva,
                        { new: true }
                        );

        
        await palabraAntigua.save()

        palabraAntigua = await Word.aggregate([
            { $match: { _id: palabraAntigua._id } },
            { $replaceWith: {
                "_id": "$_id",
                "Palabra": "$name",
                "Dificultad" : "$difficulty",
                "Puntos" : "$points",
                "Habilitada" : "$isEnabled",
                "Creadoel" : "$createdAt",
                "Actualizadoel" : "$updatedAt",
            } },
        ])

        res.json({ palabraAntigua })
        
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo habilitar/inhabilitar la palabra') 
    }
}

exports.eliminarPalabraPorUsuarioDesdeAdmin = async (req, res) => {
    try {
        let palabra = await Word.findById(req.params.id);        
        if (!palabra) {
            return res.status(404).json({ msg: "No existe la palabra" });
        }

        let usuarioModificador = await Usuario.findById(req.usuario.id)
        if ( !usuarioModificador.isAdmin ) {
            return res.status(401).json({ msg: "No Autorizado, debe ser un usuario administrador" })
        }

        await Word.findOneAndRemove({ _id: req.params.id })
        await TagWordAssociation.deleteMany({ word_id: req.params.id })

        res.json({ msg: "Palabra eliminada correctamente" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de eliminar la palabra' })
    }
}