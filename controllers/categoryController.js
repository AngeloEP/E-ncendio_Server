const Category = require('../models/Category')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const moment = require('moment-timezone');

exports.crearCategoria = async (req, res) => {
    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    // Extraer información de la imagen
    const { name } = req.body
    
    try {
        // Revisar si hay otra con ese nombre
        let categoria = await Category.findOne({ name })

        if (categoria) {
            return res.status(400).json({ msg: "La Categoría ingresada ya existe" })
        }
        
        // Crear la nueva categoría
        categoria = new Category(req.body)
        // Fechas de creacion
        categoria.createdAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss")
        categoria.updatedAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss");

        await categoria.save()

        res.json({ categoria })

    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de crear la categoría'})
    }
}

exports.obtenerTodasLasCategorias = async (req, res) => {
    try {
        const categorias = await Category.aggregate([
            { $replaceWith: {
                "_id": "$_id",
                "Nombre": "$name",
                "Visible" : "$isVisible",
                "Creado el" : "$createdAt",
                "Actualizado el" : "$updatedAt",
            } },
          ])

        res.json({ categorias })
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de obtener las categorías' })
    }
}

exports.obtenerCategoriasVisibles = async (req, res) => {
    try {
        const categoriasVisibles = await Category.find({ isVisible: true })
        res.json({ categoriasVisibles })
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de obtener las categorías visibles' })
    }
}

exports.modificarCategoría = async (req, res) => {

    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    try {
        const {
            name,
            isVisible,
        } = req.body;

        // Comprobar si existe la Categoría
        let categoríaAntigua = await Category.findById(req.params.id)

        if (!categoríaAntigua) {
            return res.status(404).json({ msg: "No existe esa Categoŕia" })
        }

        let categoríaNueva = {}
        categoríaNueva.name = name
        categoríaNueva.isVisible = isVisible
        categoríaNueva.updatedAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss");

        // Guardar Categoría modificada
        categoríaAntigua = await Category.findOneAndUpdate(
                        { _id : req.params.id },
                        categoríaNueva,
                        { new: true }
                        );

        await categoríaAntigua.save()

        res.json({ categoríaAntigua })

    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo modificar la Categoría seleccionada')
    }
}