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
import { Reconocida } from '../model/reconocidaModel.js';
import { TipoDocumento } from '../model/tipoDocumentoModel.js';
import { Comisiones } from '../model/comisionModel.js';
import { Periodo } from "../model/periodoModel.js";
import { PeriodoPorMandato } from "../model/periodopormandato.js";

export const Asociaciones = () => {
    // Relaciones para MandatarioJunta (Tabla intermedia)
    MandatarioJunta.belongsTo(Usuario, { foreignKey: 'numeroidentificacion' });
    MandatarioJunta.belongsTo(Junta, { foreignKey: 'idjunta' });
    MandatarioJunta.belongsTo(Cargo, { foreignKey: "idcargo" })
    MandatarioJunta.belongsTo(Comisiones, { foreignKey: "idcomision",});
    MandatarioJunta.hasMany(PeriodoPorMandato, { foreignKey: "idjunta" }, { foreignKey: "numeroidentificacion" })


    // Relaciones para Users
    Usuario.belongsTo(Rol, { foreignKey: "idrol", as: "RolInfo" });
    Usuario.hasMany(MandatarioJunta, { foreignKey: 'numeroidentificacion' });
    Usuario.hasMany(Firma, { foreignKey: "numeroidentificacion" });
    Usuario.hasOne(Credenciales, { foreignKey: "numeroidentificacion" });
    Usuario.belongsTo(TipoDocumento, { foreignKey: "idtipodocumento"});
    // Relaciones para Municipios-Departamentos
    Lugar.hasMany(Lugar, { foreignKey: 'idotrolugar' });
    Lugar.hasMany(Junta, { foreignKey: "idmunicipio" })

    //Relaciones para firma
    Firma.belongsTo(Usuario, { foreignKey: "numeroidentificacion" });

    //Relaciones para Cargo
    Cargo.hasMany(MandatarioJunta, { foreignKey: "idcargo" })

    //Relaciones Credenciales
    Credenciales.belongsTo(Usuario, { foreignKey: "numeroidentificacion" })

    //Relaciones Para Junta
    Junta.belongsTo(Lugar, { foreignKey: "idmunicipio" })
    Junta.belongsTo(TipoJunta, { foreignKey: "tipojunta" })
    Junta.belongsTo(Institucion, { foreignKey: "idinstitucion" })
    Junta.hasMany(MandatarioJunta, { foreignKey: "idjunta" })

    Junta.belongsTo(Reconocida, {
        foreignKey: "IDReconocida",
        targetKey: "IDReconocida"
    });


    //Relaciones para Roles
    Rol.hasMany(Usuario, { foreignKey: "idrol" });

    //Relaciones para TipoJunta
    TipoJunta.hasMany(Junta, { foreignKey: "tipojunta" })

    //Relaciones para Instituciones
    Institucion.hasMany(Junta, { foreignKey: "idinstitucion" })

    Reconocida.hasMany(Junta, {
        foreignKey: "IDReconocida",
        sourceKey: "IDReconocida"
    });

    PeriodoPorMandato.belongsTo(Periodo, { foreignKey: "idperiodo" })
    PeriodoPorMandato.belongsTo(MandatarioJunta, { foreignKey: "idjunta" }, { foreignKey: "numeroidentificacion"})

    Periodo.hasMany(PeriodoPorMandato, { foreignKey: "idperiodo" })

    console.log("Asociaciones de Sequelize configuradas exitosamente.");
};