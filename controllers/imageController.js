const Image = require('../models/Image')
const Level = require('../models/Level')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const upload = require('../libs/storage')
const moment = require('moment-timezone');
const fs = require('fs')
const path = require('path')
const AWS = require('aws-sdk');
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    signatureVersion: 'v4'
});
const S3 = new AWS.S3();

exports.cargarImagen = async (req, res, next) => {
    upload(req, res, function (error) {
        if (error) { //instanceof multer.MulterError
            console.log(error)
            if (error.code == 'LIMIT_FILE_SIZE') {
                return res.status(500).json({ msg: 'Tamaño del archivo demasiado grande, el límite es de 1 MB' })
            }
            return res.status(500).json({ msg: error.message});
        } else {
            if (!req.file) {
                // console.log("No a seleccionado una imagen....")
                return res.status(400).json({ msg: 'No ha adjuntado la imagen' })
            }
            next();
        }
    })
}

exports.cargarONoImagen = async (req, res, next) => {
    upload(req, res, function (error) {
        if (error) { //instanceof multer.MulterError
            console.log(error)
            if (error.code == 'LIMIT_FILE_SIZE') {
                return res.status(500).json({ msg: 'Tamaño del archivo demasiado grande, el límite es de 1 MB' })
            }
            return res.status(500).json({ msg: error.message});
        } else {
            if (!req.file) {
                console.log("No a seleccionado una imagen....")
                // return res.status(400).json({ msg: 'No ha adjuntado la imagen' })
            }
            next();
        }
    })
}

exports.guardarImagen = async (req, res) => {
    // Revisar si hay errores
    console.log("BBBBBBBBBBBBb")
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    try {
        console.log("AAAAAAAAAAAAAAAAAHHHHHH")
        // Crear la nueva imagen
        image = new Image(req.body)

        if( !req.file ) {
            return res.status(400).json({ msg: 'No ha adjuntado la imagen' })
        }
        // Revisar que el nombre de la imagen no exista
        console.log("imagen AQUI: ", req.file)
        let { filename } = req.file
        image.setImagegUrl(filename)
        filename = filename.split(".")[0]
        let existeImagen = await Image.findOne({ filename })
        if ( existeImagen ) {
            return res.status(400).json({ msg: 'La imagen ya existe' })
        }
        image.filename = filename;
        
        // Encontrar nivel a asociar
        nivel = await Level.findOne({ level: 1 })

        // Guardar al Nivel al que pertenece la imagen
        image.level_id = nivel._id;
        image.user_id = req.usuario.id;

        image.createdAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss")
        image.updatedAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss");

        await image.save()

        res.json(image)

    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de guardar la imagen'})
    }
}

exports.obtenerImagenes = async (req, res) => {
    try {
        const imagenes = await Image.find({})
        res.json({ imagenes })
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de obtener las imágenes' })
    }
}

exports.obtenerImagenesPorUsuario = async (req, res) => {
    try {
        let id = mongoose.Types.ObjectId(req.usuario.id);
        const imagenes = await Image.aggregate([
            { $match: { user_id: id } },
            { $replaceWith: {
                "_id": "$_id",
                "Imagen": "$imageUrl",
                "Nombre" : "$filename",
                "Dificultad" : "$difficulty",
                "Puntos" : "$points",
                "Creado el" : "$createdAt",
                "Actualizado el" : "$updatedAt",
            } },
          ])
        res.json({ imagenes })
    } catch (error) {
        console.log(error)
        res.status(400).json({ msg: 'Hubo un error al tratar de obtener las imágenes del usuario' })
    }
}

exports.eliminarImagenPorUsuario = async (req, res) => {
    try {
        let imagen = await Image.findById(req.params.id);
        
        if (!imagen) {
            return res.status(404).json({ msg: "No existe la imagen" });
        }

        if (req.usuario.id != imagen.user_id) {
            return res.status(404).json({ msg: "Este usuario no tiene permisos para eliminar esta imagen" });
        }
        
        let arrayUrl = imagen.imageUrl.split("/");
        let filename = arrayUrl.slice(-1)[0];

        const deleteParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: "images/" + filename
        }
        
        S3.deleteObject(deleteParams, function(err, data) {
            if (err) {
                res.status(500).json({ msg: 'Hubo un error al tratar de eliminar la imagen en AWS' })
            }
            // console.log("Se eliminó la imagen en AWS!")
        });
        // try {
        //     fs.unlinkSync(path.join(__dirname, "../storage/imgs/") + filename)
        //     //file removed
        // } catch(err) {
        //     return res.status(404).json({ msg: "No se pudo eliminar del directorio" });
        // }

        // Eliminar imagen
        await Image.findOneAndRemove({ _id: req.params.id })


        res.json({ msg: "Imagen eliminada correctamente" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de eliminar la imagen' })
    }
}

exports.modificarImagenPorUsuario = async (req, res) => {

    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    try {
        const {
            difficulty,
            points,
        } = req.body;
        // Comprobar si existe la imagen
        let imagenAntigua = await Image.findById(req.params.id)

        if (!imagenAntigua) {
            return res.status(404).json({ msg: "No existe esa imagen" })
        }
        if ( imagenAntigua.user_id.toString() !== req.usuario.id ) {
            return res.status(401).json({ msg: "No Autorizado, no puede editar la imagen de este Usuario" })
        }

        let imagenNueva = {}
        imagenNueva.difficulty = difficulty
        imagenNueva.points = points

        if ( req.file ) {
            let { filename } = req.file
            arrayNewFilename = filename.split(".")
            filename = arrayNewFilename[0]
            let existeImagen = await Image.findOne({ filename })
            if ( existeImagen ) {
                return res.status(400).json({ msg: 'La imagen ingresada ya existe' })
            }
            

            let arrayUrl = imagenAntigua.imageUrl.split("/");
            let filenameDelete = arrayUrl.slice(-1)[0];
            const deleteParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: "images/" + filenameDelete
            }
            
            S3.deleteObject(deleteParams, function(err, data) {
                if (err) {
                    res.status(500).json({ msg: 'Hubo un error al tratar de eliminar la imagen en AWS' })
                }
            });
            imagenAntigua.setImagegUrl(filename+"."+arrayNewFilename.slice(-1)[0])
            await imagenAntigua.save()
            imagenNueva.filename = filename;
        }

        // Guardar Imagen modificada
        imagenAntigua = await Image.findOneAndUpdate(
                        { _id : req.params.id },
                        imagenNueva,
                        { new: true }
                        );

        
        await imagenAntigua.save()

        res.json({ imagenAntigua })

    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo modificar la imagen seleccionada')
    }
}