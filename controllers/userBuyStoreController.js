const Store = require('../models/Store')
const UserBuyStore = require('../models/UserBuyStore')
const Profile = require('../models/Profile')

exports.comprarMarcoATienda = async (req, res) => {
    try {
        let producto = await Store.findOne({ _id: req.params.id, type: "Frame" })
        let perfil = await Profile.findOne({user_id: req.usuario.id})

        nuevoPerfil = {};
        nuevoPerfil.firePoints = perfil.firePoints - producto.firePoints
        if ( nuevoPerfil.firePoints < 0 ) {
            // return res.status(400).json({ msg: 'El usuario no existe' })
            return res.status(400).json({ msg: 'Fire Points insuficientes para comprar' })
        } else {
            let marcoComprado = await new UserBuyStore;
            marcoComprado.user_id = req.usuario.id;
            marcoComprado.name = producto.name;
            marcoComprado.nameCss = producto.nameCss;
            marcoComprado.type = producto.type;
            marcoComprado.firePoints = producto.firePoints;
            await marcoComprado.save();
            await Profile.findOneAndUpdate({ _id : perfil._id }, nuevoPerfil, { new: true } )
            
            res.json({ marcoComprado })
        }

    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo comprar el marco de la tienda')
    }
}

exports.comprarApodoATienda = async (req, res) => {
    try {
        let producto = await Store.findOne({ _id: req.params.id, type: "Nickname" })
        let perfil = await Profile.findOne({user_id: req.usuario.id})

        nuevoPerfil = {};
        nuevoPerfil.firePoints = perfil.firePoints - producto.firePoints
        if ( nuevoPerfil.firePoints < 0 ) {
            return res.status(400).json({ msg: 'Fire Points insuficientes para comprar' })
        } else {
            let apodoComprado = new UserBuyStore;
            apodoComprado.user_id = req.usuario.id;
            apodoComprado.name = producto.name;
            apodoComprado.nameCss = producto.nameCss;
            apodoComprado.type = producto.type;
            apodoComprado.firePoints = producto.firePoints;
            await apodoComprado.save();
            await Profile.findOneAndUpdate({ _id : perfil._id }, nuevoPerfil, { new: true } )
            
            res.json({ apodoComprado })
        }

    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo comprar el apodo de la tienda')
    }
}

exports.obtenerProductosPorUsuario = async (req, res) => {
    try {
        let marcosUsuario = await UserBuyStore.find({ user_id: req.usuario.id, type: "Frame" })
        let apodosUsuario = await UserBuyStore.find({ user_id: req.usuario.id, type: "Nickname" })

        res.json({ marcosUsuario, apodosUsuario })
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo obtener los productos comprados del usuario')
    }
}