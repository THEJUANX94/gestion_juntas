import { Usuario } from '../model/usuarioModel.js'; 
import { Cargo } from '../model/cargoModel.js';
import { Institucion } from '../model/institucionModel.js';
import { Rol } from "../model/rolModel.js";
import { Firma } from "../model/firmaModel.js";
import { Junta } from '../model/juntaModel.js';
import { Lugar } from '../model/lugarModel.js';
import { Credenciales } from '../model/credencialesModel.js';
import { MandatarioJunta } from '../model/mandatarioJuntaModel.js';
import { TipoJunta } from '../model/tipoJuntaModel.js';

export const Asociaciones = () => {
    // Relaciones para MandatarioJunta (Tabla intermedia)
    MandatarioJunta.belongsTo(Usuario, { foreignKey: 'idusuario' });
    MandatarioJunta.belongsTo(Junta, { foreignKey: 'idjunta'});
    MandatarioJunta.belongsTo(Cargo, { foreignKey: "idcargo" })

    // Relaciones para Users
    Usuario.belongsTo(Rol, { foreignKey: "idrol", as: "RolInfo" });
    Usuario.hasMany(MandatarioJunta, { foreignKey: 'idusuario' }); 
    Usuario.hasMany(Firma, { foreignKey: "idusuario" });
    Usuario.hasOne(Credenciales, { foreignKey: "idusuario" });
    
    // Relaciones para Municipios-Departamentos
    Lugar.hasMany(Lugar, { foreignKey: 'idotrolugar' });
    Lugar.hasMany(Junta, { foreignKey: "idmunicipio" })

    //Relaciones para firma
    Firma.belongsTo(Usuario, { foreignKey: "idusuario" });

    //Relaciones para Cargo
    Cargo.hasMany(MandatarioJunta, { foreignKey: "idcargo" })

    //Relaciones Credenciales
    Credenciales.belongsTo(Usuario, { foreignKey: "idusuario" })

    //Relaciones Para Junta
    Junta.belongsTo(Lugar, { foreignKey: "idmunicipio" })
    Junta.belongsTo(TipoJunta, { foreignKey: "tipojunta" })
    Junta.belongsTo(Institucion, { foreignKey: "idinstitucion" })
    Junta.hasMany(MandatarioJunta, { foreignKey: "idjunta" })

    //Relaciones para Roles
    Rol.hasMany(Usuario, { foreignKey: "idrol" });

    //Relaciones para TipoJunta
   TipoJunta.hasMany(Junta, { foreignKey: "tipojunta" })

    //Relaciones para Instituciones
    Institucion.hasMany(Junta, { foreignKey: "idinstitucion" })

    console.log("Asociaciones de Sequelize configuradas exitosamente.");
};