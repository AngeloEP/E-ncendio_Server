const Usuario = require('../models/Usuario')
const Log = require('../models/Log')
const bcryptjs = require('bcryptjs')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const moment = require('moment-timezone');

// api/auth
exports.autenticarUsuario = async (req, res) => {
    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    // Extraer el email y password
    const { email, password } = req.body

    try {
        // Revisar que sea un usuario registrado
        let usuario = await Usuario.findOne({ email })
        if (!usuario) {
            return res.status(400).json({ msg: 'El usuario no existe' })
        }

        // Revisar su password
        const passCorrecto = await bcryptjs.compare(password, usuario.password)
        if (!passCorrecto) {
            return res.status(400).json({ msg: 'Password Incorrecto' })
        }

        // Si todo es correcto Crear y firmar el JWT
        const payload = {
            usuario: {
                id: usuario.id
            }
        }

        // Firmar el JWT
        jwt.sign(payload, process.env.SECRETA, {
            expiresIn: 3600 // 1 hora
        }, async (error, token) => {
            if (error) throw error;
            // crear registro de cuando se logeo
            let login = new Log();
            login.user_id = usuario.id;
            login.loginAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss")
            login.logoutAt = moment().add(1, 'hour').tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss")
            await login.save()
            
            // Mensaje de confirmación
            res.json({ token: token })
        })

    } catch (error) {
        console.log(error)
    }

}

// Obtiene que usuario esta autenticado
exports.usuarioAutenticado = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id).select('-password')
        res.json({ usuario })
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error' })
    }
}

// Cerrar sesión, actualizar registro de login del usuarioa su hora
exports.cerrarSesion = async (req, res) => {
    try {
        const loginAntiguo = await Log.findOne( { user_id: req.usuario.id } ).sort('-loginAt')

        let loginNuevo = {}
        loginNuevo.logoutAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss");
        await Log.findOneAndUpdate({ _id : loginAntiguo._id }, loginNuevo, { new: true } );

        res.status(200).json({ msg: "Cierre de sesión exitoso" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al intentar cerrar su sesión' })
    }
}