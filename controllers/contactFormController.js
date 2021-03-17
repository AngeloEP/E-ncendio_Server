const ContactForm = require('../models/ContactForm')
const { validationResult } = require('express-validator')

const { readFileSync } = require('fs');
    require.extensions['.html'] = ( module, path ) =>{
        const html = readFileSync( path, 'utf8'); 
        // 1
        const code = `const hogan = require( 'hogan.js' );
                    const template = hogan.compile( \`${ html }\` );
                    module.exports = template;`
        ; 
        // 2
        module._compile( code, path ); 
        // 3

    };

const jwt = require('jsonwebtoken')
const transporter = require('../config/mailer');
exports.guardarFormularioDeContacto = async (req, res, next) => {
    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    // Extraer información del formulario de contacto
    const { email, subject, message } = req.body
    
    try {
        
        // Crear el nuevo formulario de contacto
        contactForm = new ContactForm(req.body)

        // Guardar el usuario asociado al formulario de contacto
        contactForm.user_id = req.usuario.id;

        await contactForm.save()
        // console.log(templateDir)
        next();

    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de guardar el formulario de contacto'})
    }
}

exports.enviarCorreo = async (req, res) => {
    try {
        const { email, subject, message } = req.body
        var correo = require('../mailtemplates/html.html');
        correo = correo.text.toString();
        // var str3 = correo.replace('__correo__', email);
        // var str2 = str3.replace('__asunto__', subject);
        // var str = str2.replace('__mensaje__', message);
        // Enviar correo
        await transporter.sendMail({
            from: '"E-ncendio 👻" <e.encendio@example.com>',
            to: "angelocristobalep@gmail.com", // list of receivers
            subject: subject,
            html: correo, // html body
        }, function (err, responseStatus) {
            if (err) {
                res.status(400).send({ msg: err})
            }
            res.status(200).json({ msg: "Mensaje enviado!" });
        });
        

    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de guardar el formulario de contacto'})
    }
}