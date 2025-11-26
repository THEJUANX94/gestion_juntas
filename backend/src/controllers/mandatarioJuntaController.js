import { Usuario } from "../model/usuarioModel.js";
import { MandatarioJunta } from "../model/mandatarioJuntaModel.js";
import { Cargo } from "../model/cargoModel.js";
import { Comisiones } from "../model/comisionModel.js";
import { Junta } from "../model/juntaModel.js";
import { Periodo } from "../model/periodoModel.js";
import { PeriodoPorMandato } from "../model/periodopormandato.js";
import { TipoDocumento } from "../model/tipoDocumentoModel.js";
import { Lugar } from "../model/lugarModel.js";



// ======================================================
// 1️⃣ CREAR MANDATARIO
// ======================================================
export const crearMandatario = async (req, res) => {
  try {
    const { id } = req.params;
    const idJunta = id;

    const {
      documento,
      tipoDocumento,
      expedido,
      primernombre,
      segundonombre,
      primerapellido,
      segundoapellido,
      genero,
      fNacimiento,
      residencia,
      telefono,
      profesion,
      email,
      fInicioPeriodo,
      fFinPeriodo,
      cargo,
      comision
    } = req.body;

    const existeJunta = await Junta.findByPk(idJunta);
    if (!existeJunta) {
      return res.status(400).json({ message: "La junta no existe" });
    }

    // 1️⃣ Crear o actualizar usuario
    let usuario = await Usuario.findByPk(documento);

    if (!usuario) {
      usuario = await Usuario.create({
        NumeroIdentificacion: documento,
        PrimerNombre: primernombre,
        SegundoNombre: segundonombre,
        PrimerApellido: primerapellido,
        SegundoApellido: segundoapellido,
        Sexo: genero,
        FechaNacimiento: fNacimiento,
        Residencia: residencia,
        Celular: telefono,
        Correo: email,
        IDRol: "8d0784a1-7fc6-406a-903f-3b9bfd43ce16",
        IDTipoDocumento: tipoDocumento   // ← agregado correctamente
      });
    } else {
      await usuario.update({
        Residencia: residencia,
        Celular: telefono,
        Correo: email,
        IDTipoDocumento: tipoDocumento   // ← si cambia
      });
    }

    // 2️⃣ Crear Mandatario
    const mandatario = await MandatarioJunta.create({
      NumeroIdentificacion: documento,
      IDJunta: idJunta,
      IDCargo: cargo || null,
      IDComision: comision || null,     // ← este era el error
      Residencia: residencia,
      Expedido: expedido,
      Profesion: profesion
    });

    // 3️⃣ Crear periodo
    const nuevoPeriodo = await Periodo.create({
      FechaInicio: fInicioPeriodo,
      FechaFin: fFinPeriodo
    });

    // 4️⃣ Relación periodo–mandatario–junta
    await PeriodoPorMandato.create({
      IDPeriodo: nuevoPeriodo.IDPeriodo,
      NumeroIdentificacion: documento,
      IDJunta: idJunta
    });

    res.json({
      message: "Mandatario creado correctamente",
      mandatario,
      periodo: nuevoPeriodo
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear el mandatario", error: error.message });
  }
};



// ======================================================
// 2️⃣ OBTENER MIEMBROS DE LA JUNTA
// ======================================================
export const getMiembrosJunta = async (req, res) => {
  const { id } = req.params;

  try {
    console.log("🔍 Buscando miembros para junta:", id);

    const miembros = await MandatarioJunta.findAll({
      where: { IDJunta: id },
      include: [
        {
          model: Usuario,
          attributes: [
            "NumeroIdentificacion",
            "PrimerNombre",
            "SegundoNombre",
            "PrimerApellido",
            "SegundoApellido",
            "Sexo",
            "FechaNacimiento",
            "Celular",
            "Correo"
          ],
          include: [
            {
              model: TipoDocumento,
              attributes: ["NombreTipo"]
            }
          ]
        },
        {
          model: Cargo,
          attributes: ["NombreCargo"]
        },
        {
          model: Comisiones,
          as: "Comision",        
          attributes: ["Nombre"]
        },
        {
          model: Lugar,
          as: "LugarExpedido",   
          attributes: ["NombreLugar"]
        },
        {
          model: Lugar,
          as: "LugarResidencia", 
          attributes: ["NombreLugar"]
        },
        {
          model: PeriodoPorMandato,
          required: false,
          where: { IDJunta: id },
          include: [
            {
              model: Periodo,
              attributes: ["FechaInicio", "FechaFin"]
            }
          ]
        }
      ]

    });

    console.log(" Miembros encontrados:", miembros.length);


    // ======================================================
    // FORMATEAR RESPUESTA
    // ======================================================
    const resultado = miembros.map(m => {
      const u = m.Usuario;

      if (!u) return null;

    
      const f = new Date(u.FechaNacimiento);
      const nacimientoFormateado =
        `${String(f.getDate()).padStart(2, "0")}/${String(f.getMonth() + 1).padStart(2, "0")}/${f.getFullYear()}`;

  
      const hoy = new Date();
      let edad = hoy.getFullYear() - f.getFullYear();
      if (hoy < new Date(hoy.getFullYear(), f.getMonth(), f.getDate())) edad--;

      const periodos = m.PeriodoPorMandatos || [];
      const periodo = periodos.length ? periodos[0].Periodo : null;

      return {
        cargo: m.Cargo?.NombreCargo || "",
        comision: m.Comision?.Nombre || "", 

        nombreCompleto: `${u.PrimerNombre} ${u.SegundoNombre ?? ""} ${u.PrimerApellido} ${u.SegundoApellido ?? ""}`.trim(),

        documento: u.NumeroIdentificacion,
        tipoDocumento: u.TipoDocumento?.NombreTipo || "",

        expedido: m.LugarExpedido?.NombreLugar || "",   
        residencia: m.LugarResidencia?.NombreLugar || "",

        genero: u.Sexo,
        edad,
        nacimiento: nacimientoFormateado,

        profesion: m.Profesion || "",

        periodo: periodo
          ? `${new Date(periodo.FechaInicio).getFullYear()}-${new Date(periodo.FechaFin).getFullYear()}`
          : "",

        telefono: u.Celular,
        email: u.Correo
      };
    }).filter(Boolean);

    res.json(resultado);

  } catch (error) {
    console.error("❌ Error cargando miembros:", error);
    res.status(500).json({
      message: "Error cargando miembros",
      error: error.message
    });
  }
};
