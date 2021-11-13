const Usuario = require('../models/Usuario')
const Profile = require('../models/Profile')
const DailyTask = require('../models/DailyTask')
const Log = require('../models/Log')
const bcryptjs = require('bcryptjs')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const moment = require('moment-timezone');
const transporter = require('../config/mailer');
var handlebars = require('handlebars');
var fs = require('fs');
const path = require('path')
const mongoose = require('mongoose')

var readHTMLFile = function(path, callback) {
    fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
        if (err) {
            throw err;
            callback(err);
        }
        else {
            callback(null, html);
        }
    });
};

// api/auth
exports.autenticarUsuario = async (req, res) => {
    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    // Extraer el email y password
    const { email, password, latitude, longitude } = req.body

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
            login.geometry = [latitude, longitude];
            login.loginAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss")
            login.logoutAt = moment().add(1, 'hour').tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss")
            await login.save()

            let id = mongoose.Types.ObjectId(usuario.id);
            let logins = await Log.countDocuments({ user_id: id });
            let recompensa = null
            if ([5,15,30,50,100,200].includes(logins)) {
                recompensa = {
                    msg: "Por haber ingresado a Encendio ".concat(logins).concat(" veces, obtuviste "),
                    count: logins,
                    firePoints: logins
                }
                let perfil = await Profile.findOne({user_id: id})
                const nuevoPerfil = {}
                nuevoPerfil.firePoints = perfil.firePoints + logins
                await Profile.findOneAndUpdate({ _id : perfil._id }, nuevoPerfil, { new: true } )
            }

            let recompensaTareas = null
            let nuevaTarea = {}
            let perfil = await Profile.findOne({user_id: id})
            let tareas = await DailyTask.find({ user_id: id, isActivated: true, isClaimed: false, type: "Login", mode: "logins" })
            if (tareas.length > 0) {
                tareas.forEach( async (tareita) => {
                    nuevaTarea.newCount = tareita.newCount + 1;
                    if ( nuevaTarea.newCount === tareita.total ) {
                        nuevaTarea.isClaimed = true;
                        recompensaTareas = {
                            msg: "Cumpliste tu tarea de: ".concat(tareita.message).concat(", obtuviste "),
                            count: tareita.total,
                            firePoints: 15
                        }
                        nuevoPerfil = {};
                        nuevoPerfil.firePoints = perfil.firePoints + 15
                        await Profile.findOneAndUpdate({ _id : perfil._id }, nuevoPerfil, { new: true } )
                    }
                    await DailyTask.findOneAndUpdate({ _id : tareita._id }, nuevaTarea, { new: true } )
                })
            }
            
            // Mensaje de confirmación
            res.json({ token: token, reward: recompensa, rewardTasks: recompensaTareas })
        })

    } catch (error) {
        console.log(error)
    }

}

//Comprobar si usuario de tal correo existe
exports.enviarCodigo = async (req, res) => {
    try {
        const { email } = req.body;
        const usuario = await Usuario.findOne({ email: email }).select('-password')
        if (usuario) {
            var correo = require('../mailtemplates/codeToResetPassword.html');
            correo = correo.text.toString();
            var subject = "Validar correo";

            readHTMLFile(path.join(__dirname, "../mailtemplates/codeToResetPassword.html"), async (err, html) => {
                var template = handlebars.compile(html);
                var codigo = Math.random().toString(36).substring(7);
                var replacements = {
                    code: codigo
                };
                var htmlToSend = template(replacements);

                await transporter.sendMail({
                    from: '"E-ncendio 👻" <e.encendio@example.com>',
                    to: email, // list of receivers
                    subject: subject,
                    html: htmlToSend, // html body
                }, function (err, responseStatus) {
                    if (err) {
                        res.status(400).send({ msg: err})
                    }
                    res.status(200).json({ codigo });
                });
            })
        }
        else {
            res.status(500).json({ msg: "Correo no válido" })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error no se pudo obtener el usuario con este correo' })
    }
}


// Cambiar la contraseña del usuario
exports.cambiarContraseña = async (req, res) => {
    try {
        const { email, password } = req.body;
        let nuevoUsuario = {}
        const usuario = await Usuario.findOne({ email: email })

        // Hashear el password
        const salt = await bcryptjs.genSalt(10)
        nuevoUsuario.password = await bcryptjs.hash(password, salt)
        
        await Usuario.findOneAndUpdate({ _id : usuario._id }, nuevoUsuario, { new: true } );
        res.status(200).json({ msg: "Contraseña modificada exitosamente" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'No se pudo modificar la contraseña' })
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