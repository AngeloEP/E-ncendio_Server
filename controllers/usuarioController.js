const Usuario = require('../models/Usuario')
const Profile = require('../models/Profile')
const Level = require('../models/Level')
const bcryptjs = require('bcryptjs')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')

exports.crearUsuario = async (req, res, next) => {

    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }
    
    // Extraer email y password
    const { email, password } = req.body

    try {
        // Revisar que el usuario registrado sea único
        let usuario = await Usuario.findOne({ email })

        if (usuario) {
            return res.status(400).json({ msg: 'El usuario ya existe' })
        }

        // Crea el nuevo usuario
        usuario = new Usuario(req.body)

        // Hashear el password
        const salt = await bcryptjs.genSalt(10)
        usuario.password = await bcryptjs.hash(password, salt)

        // Guardar el nuevo usuario
        await usuario.save()

        // Crear y firmar el JWT
        const payload = {
            usuario: {
                id: usuario.id
            }
        }

        // Firmar el JWT
        jwt.sign(payload, process.env.SECRETA, {
            expiresIn: 3600 // 1 hora?
        }, (error, token) => {
            if (error) throw error;

            // Mensaje de confirmación
            res.json({ token: token })
        });
        next();
        

    } catch (error) {
        console.log(error)
        res.status(400).send('Hubo un errror al tratar de crear usuario')
    }
}

exports.obtenerPerfilUsuario = async (req, res) => {
    try {
        const perfil = await Profile.findOne({ user_id: req.usuario.id })
                                    .populate("league_id")
                                    .populate("level_image_id")
                                    .populate("level_word_id")
                                    .populate("level_four_image_id");
        res.json(perfil)
    } catch (error) {
        console.log(error)
        res.status(400).send('Hubo un errror al tratar de obtener el perfil del usuario')
    }
}

exports.obtenerNivelImagenesUsuario = async (req, res) => {
    try {
        const perfil = await Profile.findOne({ user_id: req.usuario.id });
        const nivelImagenes = await Level.findOne({ _id : perfil.level_image_id });
        res.json(nivelImagenes)
    } catch (error) {
        console.log(error)
        res.status(400).send('Hubo un errror al tratar de obtener el nivel de imágenes del usuario')
    }
}

exports.obtenerRangoDeEdades = async (req, res) => {
    try {
        let usuarios = {};
        usuarios.range = [ "9-13", "14-20", "21-25", "26-40"]
        usuarios.total = []
        usuarios.total.push(
            await Usuario.countDocuments( { age: {$gte: 9, $lte: 13} } ),
            await Usuario.countDocuments( { age: {$gte: 14, $lte: 20} } ),
            await Usuario.countDocuments( { age: {$gte: 21, $lte: 25} } ),
            await Usuario.countDocuments( { age: {$gte: 26, $lte: 40} } )
        );

        res.json(usuarios)
    } catch (error) {
        console.log(error)
        res.status(400).send('Hubo un errror al tratar de obtener el rango de edades de los usuarios')
    }
}