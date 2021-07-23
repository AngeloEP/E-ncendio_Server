const Profile = require('../models/Profile')

module.exports = class DeliverDailyRewards {
    static async deliver() {
        console.log("entregando puntaje diario")
        let perfiles = await Profile.find({}).populate("user_id")
        perfiles = perfiles.sort((a, b) => parseFloat(b["score"]) - parseFloat(a["score"]));
        
        let ganadores = [
            perfiles[0],
            perfiles[1],
            perfiles[2]
        ]
        let perfilUsuario;
        let points = [25, 20, 15];
        let nuevoPerfil;
        ganadores.forEach( async (ganador, index) => {
            perfilUsuario = await Profile.findOne({user_id: ganador.user_id._id})
            nuevoPerfil = {};
            nuevoPerfil.firePoints = perfilUsuario.firePoints + points[index]
            await Profile.findOneAndUpdate({ _id : perfilUsuario._id }, nuevoPerfil, { new: true } )
        });
        console.log(ganadores)
    }
}