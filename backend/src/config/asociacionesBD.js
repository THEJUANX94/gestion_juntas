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
import { PoblacionesPorPersona } from '../model/poblacionesporpersonaModel.js';
import { GrupoPoblacional } from '../model/grupopoblacionalModel.js';

export const Asociaciones = () => {
    // ========================================
    // RELACIONES PARA USUARIO
    // ========================================
    Usuario.belongsTo(Rol, { foreignKey: "idrol", as: "RolInfo" });
    Usuario.belongsTo(TipoDocumento, { foreignKey: "idtipodocumento" });
    Usuario.hasMany(MandatarioJunta, { foreignKey: 'numeroidentificacion' });
    Usuario.hasMany(Firma, { foreignKey: "numeroidentificacion" });
    Usuario.hasOne(Credenciales, { foreignKey: "numeroidentificacion" });
    Usuario.hasMany(PoblacionesPorPersona, { foreignKey: "numeroidentificacion" });

    // ========================================
    // RELACIONES PARA MANDATARIOJUNTA
    // ========================================
    MandatarioJunta.belongsTo(Usuario, { foreignKey: 'numeroidentificacion' });
    MandatarioJunta.belongsTo(Junta, { foreignKey: 'idjunta' });
    MandatarioJunta.belongsTo(Cargo, { foreignKey: "idcargo" });
    MandatarioJunta.belongsTo(Comisiones, { foreignKey: "idcomision", as: "Comision" });
    MandatarioJunta.belongsTo(Lugar, { as: "LugarExpedido", foreignKey: "expedido", targetKey: "IDLugar" });
    MandatarioJunta.hasMany(PeriodoPorMandato, { foreignKey: "numeroidentificacion", sourceKey: "numeroidentificacion", as: "Periodos"});

    // ========================================
    // RELACIONES PARA JUNTA
    // ========================================
    Junta.belongsTo(Lugar, { foreignKey: "idmunicipio" });
    Junta.belongsTo(TipoJunta, { foreignKey: "tipojunta" });
    Junta.belongsTo(Institucion, { foreignKey: "idinstitucion" });
    Junta.belongsTo(Reconocida, { foreignKey: "IDReconocida", targetKey: "IDReconocida" });
    Junta.hasMany(MandatarioJunta, { foreignKey: "idjunta" });

    // ========================================
    // RELACIONES PARA PERIODO Y PERIODOPORMANDAT0
    // ========================================
    Periodo.hasMany(PeriodoPorMandato, {
        foreignKey: "idperiodo",  
        sourceKey: "IDPeriodo", 
        as: "Mandatos"
            
    });

    PeriodoPorMandato.belongsTo(Periodo, {
        foreignKey: "idperiodo",  
        targetKey: "IDPeriodo",
        as: "Periodo"     
    });


    PeriodoPorMandato.belongsTo(MandatarioJunta, {
        foreignKey: "numeroidentificacion",
        targetKey: "numeroidentificacion",
        as: "Mandatario"
    });

    // ========================================
    // RELACIONES PARA CARGO
    // ========================================
    Cargo.hasMany(MandatarioJunta, { foreignKey: "idcargo" });

    // ========================================
    // RELACIONES PARA COMISIONES
    // ========================================
    Comisiones.hasMany(MandatarioJunta, {
        foreignKey: "idcomision",
        as: "Mandatarios"
    });


    // ========================================
    // RELACIONES PARA LUGAR (MUNICIPIOS/DEPARTAMENTOS)
    // ========================================
    Lugar.hasMany(Lugar, { foreignKey: 'idotrolugar' });
    Lugar.hasMany(Junta, { foreignKey: "idmunicipio" });
    // ↓ LÍNEAS NUEVAS — necesarias para el reporte de provincias
    Lugar.belongsTo(Lugar, { foreignKey: 'idotrolugar', as: 'LugarPadre' });
    Lugar.hasMany(Lugar,   { foreignKey: 'idotrolugar', as: 'LugaresMunicipio' });

    
    // ========================================
    // RELACIONES PARA FIRMA
    // ========================================
    Firma.belongsTo(Usuario, { foreignKey: "numeroidentificacion" });

    // ========================================
    // RELACIONES PARA CREDENCIALES
    // ========================================
    Credenciales.belongsTo(Usuario, { foreignKey: "numeroidentificacion" });

    // ========================================
    // RELACIONES PARA ROL
    // ========================================
    Rol.hasMany(Usuario, { foreignKey: "idrol" });

    // ========================================
    // RELACIONES PARA TIPOJUNTA
    // ========================================
    TipoJunta.hasMany(Junta, { foreignKey: "tipojunta" });

    // ========================================
    // RELACIONES PARA INSTITUCION
    // ========================================
    Institucion.hasMany(Junta, { foreignKey: "idinstitucion" });

    // ========================================
    // RELACIONES PARA RECONOCIDA
    // ========================================
    Reconocida.hasMany(Junta, {
        foreignKey: "IDReconocida",
        sourceKey: "IDReconocida"
    });

    // ========================================
    // RELACIONES PARA TIPODOCUMENTO
    // ========================================
    TipoDocumento.hasMany(Usuario, { foreignKey: "idtipodocumento" });

    // ========================================
    // RELACIONES PARA GRUPOS POBLACIONALES
    // ========================================

    GrupoPoblacional.hasMany(PoblacionesPorPersona, { foreignKey: "idgrupopoblacional" });

    // ========================================
    // RELACIONES PARA POBLACIONES POR PERSONA
    // ========================================
    PoblacionesPorPersona.belongsTo(Usuario, { foreignKey: "numeroidentificacion" });
    PoblacionesPorPersona.belongsTo(GrupoPoblacional, { foreignKey: "idgrupopoblacional" });

    console.log(" Asociaciones de Sequelize configuradas exitosamente.");
};