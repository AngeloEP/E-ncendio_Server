const Store = require('../models/Store')

exports.agregarStore = async (req, res) => {
    try {
        // Add document
        let tiendita = new Store;
        tiendita.name = "Flanqueador";
        tiendita.nameCss = "";
        tiendita.type = "Nickname";
        tiendita.firePoints = 150;
        await tiendita.save();

        console.log("producto agregado a tienda")
        res.json({ tiendita })
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo agregar el producto a tienda')
    }
}

exports.obtenerProductosTienda = async (req, res) => {
    try {
        let marcos = await Store.find({ type: "Frame" })
        let apodos = await Store.find({ type: "Nickname" })

        res.json({ marcos, apodos })
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo obtener los productos de la tienda')
    }
}

// Brigadista, Bombero, Extintor, Aguafiestas, El Jefe,
// Combatiente, Súper Tanker, Cortafuegos, Guarda Bosques, Flanqueador