// Conexion a MySQL Server
const { poolPromise, sql } = require('../../db');
const bcrypt = require('bcrypt');
const multer = require("multer")
const path = require('path');
const transporter = require('../../correo');

const storage = multer.memoryStorage();
const upload = multer({ storage: multer.memoryStorage() });
const crypto = require("crypto");

//<------------- RECUPERAR CUENTA ---------------------->
async function recuperar(req, res) {
  const { correoElectronico } = req.body;
  console.log(req.body)
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('correoElectronico', sql.NVarChar, correoElectronico)
      .query(`SELECT idUsuario, nombre, apellido, google
                FROM Usuarios 
                WHERE correoElectronico = @correoElectronico`);

    const usuario = result.recordset[0];
    console.log(usuario)
    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "El correo no esta registrado" });
    }
    if (result.recordset.length != 0 && usuario.google == 1) {
      return res.status(404).json({ success: false, message: "Un correo asociado con Google no puede cambiar su contraseña" });
    } else {
      const codigo = generarCodigo();
      const usuario = result.recordset[0];

      const nombre = usuario.nombre;
      const apellido = usuario.apellido;

      const mailOptions = {
        from: {
          name: 'SmartSys - Sistema de Gestión',
          address: 'smartsyscj@gmail.com'
        },
        to: correoElectronico,
        subject: "🔐 Código de Recuperación - SmartSys",
        html: generarTemplateCorreo(codigo, nombre, apellido),
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error al enviar correo:", error);
          return res.status(500).json({ success: false, message: "Error al enviar el correo" });
        } else {
          console.log("Correo enviado:", info.response);
        }
      });

      return res.json({ success: true, message: "Código de recuperación enviado correctamente", codigo });
    }
  } catch (error) {
    console.error("Error en sendCode:", error);
    return res.status(500).json({ success: false, message: "Error en el servidor" });
  }
}
//<------------- RECUPERAR CUENTA ---------------------->

//<------------- CAMBIAR CONTRASEÑA --------------------->
async function resetpassword(req, res) {
  try {
    let { correoElectronico, nuevaContrasena } = req.body;
    console.log(req.body)
    // Convertir correo a minúsculas
    const newCorreo = correoElectronico.toLowerCase();

    // Generar hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nuevaContrasena, salt);

    // Actualizar en la base de datos
    const pool = await poolPromise;
    await pool.request()
      .input('correo', sql.NVarChar, newCorreo)
      .input('contraseña', sql.NVarChar, hashedPassword)
      .query(`UPDATE Usuarios SET contraseña = @contraseña WHERE correoElectronico = @correo`);

    return res.json({ success: true, message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar contraseña:", error);
    return res.status(500).json({ success: false, message: "Error en el servidor" });
  }
}
//<------------- CAMBIAR CONTRASEÑA --------------------->

//<--------------GOOGLE INICIO Y REGISTRO ------------------->
async function google(req, res) {
  try {
    const { email, nombre, apellido } = req.body;
    console.log(req.body);

    const pool = await poolPromise;
    const consulta = await pool.request()
      .input('correoElectronico', sql.NVarChar, email)
      .query(`SELECT * FROM Usuarios WHERE correoElectronico = @correoElectronico`);

    if (consulta.recordset.length !== 0) {
      // Usuario ya existe
      const usuario = consulta.recordset[0];
      console.log(consulta)
      if (usuario.google === true) {
        // Login con Google permitido
        return res.status(201).json({
          success: true,
          message: "Inicio de sesión con Google",
          user: usuario,
        });
      } else {
        // Usuario existe pero no es Google
        return res.status(400).json({
          success: false,
          message: "El usuario está registrado pero no con Google",
        });
      }
    } else {
      // Crear nuevo usuario Google
      const codigo = generarCodigo();
      const salt = await bcrypt.genSalt(10);
      const hashedcodigo = await bcrypt.hash(codigo, salt);

      const telefono = null;
      const tipoUsuario = "Usuario";
      const foto_perfil = null;
      const biografia = null;
      const codigoUnico = generarCodigoUnico(nombre, apellido);
      const google = 1;

      await pool.request()
        .input("nombre", sql.NVarChar, nombre)
        .input("apellido", sql.NVarChar, apellido)
        .input("correoElectronico", sql.NVarChar, email)
        .input("contrasena", sql.NVarChar, hashedcodigo)
        .input("telefono", sql.NVarChar, telefono)
        .input("tipoUsuario", sql.NVarChar, tipoUsuario)
        .input("foto_perfil", sql.VarBinary, foto_perfil)
        .input("biografia", sql.NVarChar, biografia)
        .input("codigoUnico", sql.NVarChar, codigoUnico)
        .input("google", sql.Bit, google)
        .query(`INSERT INTO Usuarios 
          (nombre, apellido, correoElectronico, contrasena, telefono, tipoUsuario, foto_perfil, biografia, codigoUnico, google)
          VALUES (@nombre, @apellido, @correoElectronico, @contrasena, @telefono, @tipoUsuario, @foto_perfil, @biografia, @codigoUnico, @google)`);

      return res.status(201).json({
        success: true,
        message: "Usuario insertado en la BD",
        user: {
          nombre,
          apellido,
          correoElectronico: email,
          telefono,
          tipoUsuario,
          biografia,
          codigoUnico,
          google
        },
      });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
}
//<--------------GOOGLE INICIO Y REGISTRO ------------------->



//<------- Inicio Codigo unico chat -------->
function generarCodigoUnico(nombre, apellido) {
  let iniciales = "";
  if (nombre && nombre.length > 0) iniciales += nombre[0];
  if (apellido && apellido.length > 0) iniciales += apellido[0];
  iniciales = iniciales.toUpperCase();

  // Generar 2 bytes aleatorios en HEX (ej: 3F7C)
  const randomBytes = crypto.randomBytes(2).toString("hex").toUpperCase();

  return iniciales + randomBytes; // Ejemplo: ER3F7C
}
//<------- Fin Codigo unico chat -------->
// <---------- inicio login -------------->
async function login(req, res) {
  try {
    const { correoElectronico, contrasena } = req.body;

    const pool = await poolPromise;
    const consulta = await pool.request()
      .input('correoElectronico', sql.NVarChar, correoElectronico)
      .query(`SELECT idUsuario, nombre, apellido, correoElectronico, contrasena, telefono, tipoUsuario, estadoCuenta, fechaCreacion, foto_perfil, biografia 
              FROM Usuarios 
              WHERE correoElectronico = @correoElectronico`);
    const estado = consulta.recordset[0]
    if (consulta.recordset.length === 0) {
      return res.status(401).json({
        ok: false,
        mensaje: 'Usuario no encontrado',
      });
    } else if (estado.estadoCuenta === "Pendiente") {
      return res.status(401).json({
        ok: false,
        mensaje: 'Usuario no activo, porfavor verifique su cuenta en su correo electronico',
      });
    } else {
      const usuario = consulta.recordset[0];
      const passwordMatch = await bcrypt.compare(contrasena, usuario.contrasena);
      if (!passwordMatch) {
        res.status(401).json({
          ok: false,
          mensaje: 'Contraseña incorrecta',
        });
      } else {
        res.status(200).json({
          ok: true,
          mensaje: 'Login exitoso',
          data: {
            idUsuario: usuario.idUsuario,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            correoElectronico: usuario.correoElectronico,
            telefono: usuario.telefono,
            tipoUsuario: usuario.tipoUsuario,
            estadoCuenta: usuario.estadoCuenta,
            fechaCreacion: usuario.fechaCreacion,
            foto_perfil: usuario.foto_perfil,
            biografia: usuario.biografia
          }
        });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al iniciar sesión',
    });
  }
}
// <---------- fin login -------------->

// <---------- inicio registro -------->
async function registro(req, res) {
  try {
    const {
      nombre,
      apellido,
      correoElectronico,
      contrasena,
      telefono = null,
      tipoUsuario = "Usuario",
      foto_perfil = null,
      biografia = null,
      google = 0
    } = req.body;

    console.log(correoElectronico)

    const pool = await poolPromise;
    const result = await pool.request()
      .input('correoElectronico', sql.NVarChar, correoElectronico)
      .query(`SELECT idUsuario, nombre, apellido, correoElectronico, contrasena, telefono, tipoUsuario, estadoCuenta, fechaCreacion, foto_perfil, biografia 
              FROM Usuarios 
              WHERE correoElectronico = @correoElectronico`);

    if (result.recordset.length > 0) {
      res.status(500).json({
        ok: false,
        mensaje: "El correo ya esta registrado",
      });
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(contrasena, salt);


      const codigoUnico = generarCodigoUnico(nombre, apellido);
      const mailOptions = {
        from: {
          name: 'SmartSys - Sistema de Gestión',
          address: 'smartsyscj@gmail.com'
        },
        to: correoElectronico,
        subject: "¡Bienvenido a SmartSys!",
        html: generarTemplateCodigo(nombre, apellido, codigoUnico),
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          res.status(500).json({
            ok: false,
            mensaje: "Error al insertar usuario",
          });
        } else {
          console.log("Correo enviado:", info.response);
        }
      });

      const pool = await poolPromise;
      await pool.request()
        .input("nombre", sql.NVarChar, nombre)
        .input("apellido", sql.NVarChar, apellido)
        .input("correoElectronico", sql.NVarChar, correoElectronico)
        .input("contrasena", sql.NVarChar, hashedPassword)
        .input("telefono", sql.NVarChar, telefono)
        .input("tipoUsuario", sql.NVarChar, tipoUsuario)
        .input("foto_perfil", sql.VarBinary, foto_perfil)
        .input("biografia", sql.NVarChar, biografia)
        .input("codigoUnico", sql.NVarChar, codigoUnico)
        .input("google", sql.Bit, google)
        .query(`INSERT INTO Usuarios 
        (nombre, apellido, correoElectronico, contrasena, telefono, tipoUsuario, foto_perfil, biografia, codigoUnico, google)
        VALUES (@nombre, @apellido, @correoElectronico, @contrasena, @telefono, @tipoUsuario, @foto_perfil, @biografia, @codigoUnico, @google)`);

      res.status(201).json({
        ok: true,
        mensaje: "Porfavor confirme su cuenta en su correo electronico",
        data: {
          nombre,
          apellido,
          correoElectronico,
          telefono,
          tipoUsuario,
          biografia,
          codigoUnico
        },
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al insertar usuario",
    });
  }
}
// <---------- fin registro -------->

// <---------- inicio actualizar perfil imagen -------->//
async function actualizarPerfilImg(req, res) {
  try {
    const { idUsuario } = req.body;
    let foto_perfil = null;

    if (req.file) {
      foto_perfil = req.file.buffer; // Los bytes correctos de la imagen
    }

    const pool = await poolPromise;

    if (req.file) {
      // Solo actualiza la foto si hay archivo
      await pool.request()
        .input('idUsuario', sql.BigInt, idUsuario)
        .input('foto_perfil', sql.VarBinary, req.file.buffer)
        .query(`
      UPDATE Usuarios SET 
        foto_perfil = @foto_perfil
      WHERE idUsuario = @idUsuario
    `);
    }


    const consulta = await pool.request()
      .input('idUsuario', sql.BigInt, idUsuario)
      .query(`
        SELECT idUsuario, nombre, apellido, correoElectronico, telefono, tipoUsuario, estadoCuenta, fechaCreacion, foto_perfil, biografia 
        FROM Usuarios WHERE idUsuario = @idUsuario
      `);

    res.status(200).json({
      ok: true,
      message: 'Perfil con foto actualizado exitosamente',
      data: consulta.recordset[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: 'Error al actualizar perfil con foto'
    });
  }
}

// <---------- FIN actualizar perfil imagen -------->//
// <---------- inicio actualizar perfil -------->
async function actualizarPerfil(req, res) {
  try {
    const { idUsuario, nombre, apellido, telefono, biografia } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('idUsuario', sql.BigInt, idUsuario)
      .input('nombre', sql.NVarChar, nombre)
      .input('apellido', sql.NVarChar, apellido)
      .input('telefono', sql.NVarChar, telefono)
      .input('biografia', sql.NVarChar, biografia)
      .query(`UPDATE Usuarios SET 
                nombre = @nombre, 
                apellido = @apellido, 
                telefono = @telefono, 
                biografia = @biografia 
              WHERE idUsuario = @idUsuario`);

    // Consulta el usuario actualizado
    const consulta = await pool.request()
      .input('idUsuario', sql.BigInt, idUsuario)
      .query(`SELECT idUsuario, nombre, apellido, correoElectronico, telefono, tipoUsuario, estadoCuenta, fechaCreacion, foto_perfil, biografia 
              FROM Usuarios WHERE idUsuario = @idUsuario`);

    const usuarioActualizado = consulta.recordset[0];

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: usuarioActualizado
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando perfil'
    });
  }
}
// <---------- fin actualizar perfil -------->//
// <---------- inicio explorar plataformas ---------->

// Función para explorar plataformas con búsqueda
async function explorar(req, res) {
  try {
    console.log('Endpoint explorar llamado con query:', req.query);

    const { busqueda = "" } = req.query;
    const pool = await poolPromise;

    // Log para debug
    console.log('Buscando plataformas con término:', busqueda);

    // Consulta SQL con LIKE y filtros
    const consulta = await pool.request()
      .input("busqueda", sql.NVarChar, `%${busqueda}%`)
      .query(`
        SELECT 
          idPlataforma, 
          nombrePlataforma, 
          descripcionPlataforma, 
          privacidadPlataforma, 
          estadoPlataforma, 
          capacidadMiembros_plataforma, 
          codigoPlataforma, 
          iconoPlataforma, 
          fondoPlataforma,
          fechaCreacion
        FROM Plataforma
        WHERE privacidadPlataforma IN ('Público','Privado','Public','Private')
          AND (nombrePlataforma LIKE @busqueda OR descripcionPlataforma LIKE @busqueda)
        ORDER BY fechaCreacion DESC
      `);

    console.log('Resultados encontrados:', consulta.recordset.length);

    res.status(200).json({
      ok: true,
      mensaje: "Plataformas encontradas",
      data: consulta.recordset,
      totalResultados: consulta.recordset.length
    });

  } catch (error) {
    console.error('Error en explorar:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al buscar plataformas",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Función para obtener plataformas activas
async function explorarActivas(req, res) {
  try {
    console.log('Endpoint explorarActivas llamado');

    const pool = await poolPromise;

    const consulta = await pool.request()
      .query(`
        SELECT 
          idPlataforma, 
          nombrePlataforma, 
          descripcionPlataforma, 
          privacidadPlataforma, 
          estadoPlataforma, 
          capacidadMiembros_plataforma, 
          codigoPlataforma, 
          iconoPlataforma, 
          fondoPlataforma,
          fechaCreacion
        FROM Plataforma
        WHERE estadoPlataforma = 'Activo'
        ORDER BY fechaCreacion DESC
      `);

    console.log('Plataformas activas encontradas:', consulta.recordset.length);

    res.status(200).json({
      ok: true,
      mensaje: "Plataformas activas encontradas",
      data: consulta.recordset,
      totalResultados: consulta.recordset.length
    });

  } catch (error) {
    console.error('Error en explorarActivas:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al obtener plataformas activas",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
// <---------- fin explorar plataformas ---------->
// <---------- inicio unirse a plataforma ---------->

async function unirsePublico(req, res) {
  try {
    const { idUsuario, idPlataforma } = req.body;

    if (!idUsuario || !idPlataforma) {
      return res.status(400).json({
        ok: false,
        mensaje: "Faltan datos (idUsuario o idPlataforma)."
      });
    }

    const pool = await poolPromise;

    // Verificar si ya está unido
    const existe = await pool.request()
      .input('idUsuario', sql.BigInt, idUsuario)
      .input('idPlataforma', sql.BigInt, idPlataforma)
      .query(`
        SELECT * FROM usuario_plataforma 
        WHERE idUsuario4 = @idUsuario AND idPlataforma1 = @idPlataforma
      `);

    if (existe.recordset.length > 0) {
      return res.status(200).json({
        ok: true,
        mensaje: "El usuario ya está unido a esta plataforma"
      });
    }

    // Insertar nueva relación
    await pool.request()
      .input('idUsuario', sql.BigInt, idUsuario)
      .input('idPlataforma', sql.BigInt, idPlataforma)
      .input('rolUsuarioPlataforma', sql.NVarChar, "Miembro")
      .query(`
        INSERT INTO usuario_plataforma (idUsuario4, idPlataforma1, rolUsuarioPlataforma) 
        VALUES (@idUsuario, @idPlataforma, @rolUsuarioPlataforma)
      `);

    res.status(201).json({
      ok: true,
      mensaje: "Unido a la plataforma (pública) correctamente"
    });

  } catch (error) {
    console.error("Error en unirsePublico:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al unirse a la plataforma pública"
    });
  }
}

async function unirsePrivado(req, res) {
  try {
    const { idUsuario, idPlataforma, codigo } = req.body;

    if (!idUsuario || !idPlataforma || !codigo) {
      return res.status(400).json({
        ok: false,
        mensaje: "Faltan datos (idUsuario, idPlataforma o código)."
      });
    }

    const pool = await poolPromise;

    // Buscar plataforma
    const plataforma = await pool.request()
      .input('idPlataforma', sql.BigInt, idPlataforma)
      .query(`SELECT * FROM Plataforma WHERE idPlataforma = @idPlataforma`);

    if (plataforma.recordset.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Plataforma no encontrada"
      });
    }

    const datosPlataforma = plataforma.recordset[0];

    // Validar código
    if (datosPlataforma.codigoPlataforma !== codigo) {
      return res.status(401).json({
        ok: false,
        mensaje: "Código incorrecto"
      });
    }

    // Verificar si ya está unido
    const existe = await pool.request()
      .input('idUsuario', sql.BigInt, idUsuario)
      .input('idPlataforma', sql.BigInt, idPlataforma)
      .query(`
        SELECT * FROM usuario_plataforma 
        WHERE idUsuario4 = @idUsuario AND idPlataforma1 = @idPlataforma
      `);

    if (existe.recordset.length > 0) {
      return res.status(200).json({
        ok: true,
        mensaje: "El usuario ya está unido a esta plataforma"
      });
    }

    // Insertar nueva relación
    await pool.request()
      .input('idUsuario', sql.BigInt, idUsuario)
      .input('idPlataforma', sql.BigInt, idPlataforma)
      .input('rolUsuarioPlataforma', sql.NVarChar, "Miembro")
      .query(`
        INSERT INTO usuario_plataforma (idUsuario4, idPlataforma1, rolUsuarioPlataforma) 
        VALUES (@idUsuario, @idPlataforma, @rolUsuarioPlataforma)
      `);

    res.status(201).json({
      ok: true,
      mensaje: "Unido a la plataforma (privada) correctamente"
    });

  } catch (error) {
    console.error("Error en unirsePrivado:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al unirse a la plataforma privada"
    });
  }
}

// <---------- inicio mis Plataformas con búsqueda ---------->
async function misPlataformas(req, res) {
  try {
    const { idUsuario, busqueda = "" } = req.query;
    if (!idUsuario) {
      return res.status(400).json({
        ok: false,
        mensaje: "Se requiere el ID del usuario"
      });
    }

    const pool = await poolPromise;

    const consulta = await pool.request()
      .input('idUsuario', sql.BigInt, idUsuario)
      .input('busqueda', sql.NVarChar, `%${busqueda}%`)
      .query(`
        SELECT 
          p.idPlataforma,
          p.nombrePlataforma,
          p.descripcionPlataforma,
          p.privacidadPlataforma,
          p.estadoPlataforma,
          p.capacidadMiembros_plataforma,
          p.codigoPlataforma,
          p.iconoPlataforma,
          p.fondoPlataforma,
          p.fechaCreacion,
          up.rolUsuarioPlataforma,
          up.fechaUnion
        FROM usuario_plataforma up
        INNER JOIN Plataforma p ON up.idPlataforma1 = p.idPlataforma
        WHERE up.idUsuario4 = @idUsuario
          AND (p.nombrePlataforma LIKE @busqueda OR p.descripcionPlataforma LIKE @busqueda)
        ORDER BY up.fechaUnion DESC
      `);

    console.log('Plataformas del usuario encontradas:', consulta.recordset.length);

    res.status(200).json({
      ok: true,
      mensaje: "Plataformas del usuario obtenidas exitosamente",
      data: consulta.recordset,
      totalPlataformas: consulta.recordset.length
    });

  } catch (error) {
    console.error('Error en misPlataformas:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al obtener las plataformas del usuario",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
// <---------- fin mis Plataformas con búsqueda ---------->
// <---------- inicio publicaciones ---------->

// Listado de publicaciones por plataforma
async function publicacionesPorPlataforma(req, res) {
  try {
    const idPlataforma = Number(req.params.idPlataforma);

    if (!idPlataforma || isNaN(idPlataforma)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El id de plataforma no es válido"
      });
    }

    console.log('Buscando publicaciones para la plataforma ID:', idPlataforma);

    const pool = await poolPromise;

    const consulta = await pool.request()
      .input('idPlataforma', sql.BigInt, idPlataforma)
      .query(`
        SELECT pub.*
        FROM Publicaciones pub
        INNER JOIN plataforma_publicacion rel
          ON pub.idPublicacion = rel.idPublicacion2
        WHERE rel.idPlataforma2 = @idPlataforma
          AND pub.estado = 'Activo'
      `);

    console.log('Publicaciones encontradas:', consulta.recordset.length);

    res.status(200).json({
      ok: true,
      mensaje: "Publicaciones encontradas",
      data: consulta.recordset,
      total: consulta.recordset.length
    });

  } catch (error) {
    console.error("Error en publicacionesPorPlataforma:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al obtener publicaciones por plataforma",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}


// Ver detalles de una publicación
async function verPublicacion(req, res) {
  try {
    const { idPublicacion } = req.params;

    if (!idPublicacion) {
      return res.status(400).json({
        ok: false,
        mensaje: "Falta el id de la publicación"
      });
    }

    const pool = await poolPromise;
    const consulta = await pool.request()
      .input('idPublicacion', sql.BigInt, idPublicacion)
      .query(`SELECT * FROM Publicaciones WHERE idPublicacion = @idPublicacion`);

    if (consulta.recordset.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Publicación no encontrada"
      });
    }

    res.status(200).json({
      ok: true,
      mensaje: "Publicación encontrada",
      data: consulta.recordset[0]
    });

  } catch (error) {
    console.error("Error en verPublicacion:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al obtener publicación"
    });
  }
}

// <---------- Generar codigo unico -------------->
function generarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
// <---------- Generar codigo unico -------------->

// <------------ CONFIRMAR REGISTRO------------------>   
async function confirmarRegistro(req, res) {
  const token = req.params.token;
  console.log(token)
  const pool = await poolPromise;

  try {
    const result = await pool.request()
      .input("codigoUnico", sql.NVarChar, token)
      .query(`
        UPDATE Usuarios
        SET estadoCuenta = 'Activo'
        WHERE codigoUnico = @codigoUnico
      `);

    console.log(result)

    if (result.rowsAffected[0] > 0) {
      return res.send("<h1>Bienvenido pajarito</h1>");
    } else {
      return res.send("<h1>Código no válido pajarito</h1>");
    }

  } catch (error) {
    console.error(error);
    return res.status(500).send("Error al confirmar el registro");
  }
}
// <------------ CONFIRMAR REGISTRO------------------>   

// <------------------ TEMPLATE VERIFICAR CORREO --------------------->
function generarTemplateCodigo(nombre, apellido, token) {
  const enlaceConfirmacion = `http://localhost:3000/confirmar/${token}`;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirma tu Registro - SmartSys</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333333;
                background-color: #f4f4f4;
            }
            
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                border-radius: 10px;
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
                padding: 30px 20px;
                text-align: center;
                color: white;
            }
            
            .logo {
                max-width: 150px;
                height: auto;
                margin-bottom: 15px;
                border-radius: 8px;
            }
            
            .header h1 {
                font-size: 28px;
                font-weight: 600;
                margin-bottom: 5px;
            }
            
            .header p {
                font-size: 16px;
                opacity: 0.9;
            }
            
            .content {
                padding: 40px 30px;
                text-align: center;
            }
            
            .greeting {
                font-size: 18px;
                color: #555555;
                margin-bottom: 25px;
            }
            
            .message {
                font-size: 16px;
                color: #666666;
                margin-bottom: 30px;
                line-height: 1.7;
            }
            
            .btn-container {
                margin: 30px 0;
                text-align: center;
            }
            
            .btn-confirmar {
                display: inline-block;
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                color: white;
                text-decoration: none;
                padding: 15px 35px;
                border-radius: 50px;
                font-size: 18px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
                transition: all 0.3s ease;
                border: none;
                cursor: pointer;
            }
            
            .btn-confirmar:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 35px rgba(40, 167, 69, 0.4);
                background: linear-gradient(135deg, #34ce57 0%, #28d8a3 100%);
            }
            
            .alternative-link {
                margin: 20px 0;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
                border: 1px solid #dee2e6;
            }
            
            .alternative-link p {
                font-size: 14px;
                color: #6c757d;
                margin-bottom: 10px;
            }
            
            .link-text {
                font-size: 12px;
                color: #007bff;
                word-break: break-all;
                background: white;
                padding: 10px;
                border-radius: 4px;
                border: 1px solid #e9ecef;
                font-family: monospace;
            }
            
            .instructions {
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #28a745;
                margin: 25px 0;
                text-align: left;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            }
            
            .instructions h3 {
                color: #2c3e50;
                font-size: 16px;
                margin-bottom: 10px;
            }
            
            .instructions ul {
                list-style: none;
                padding: 0;
            }
            
            .instructions li {
                padding: 5px 0;
                color: #555555;
                position: relative;
                padding-left: 20px;
            }
            
            .instructions li:before {
                content: "✓";
                color: #28a745;
                font-weight: bold;
                position: absolute;
                left: 0;
            }
            
            .security-note {
                background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                border: 1px solid #2196f3;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                color: #1565c0;
                font-size: 14px;
            }
            
            .expiration-warning {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                color: #856404;
                font-size: 14px;
            }
            
            .footer {
                background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
                color: white;
                padding: 25px 30px;
                text-align: center;
                font-size: 14px;
            }
            
            .footer p {
                margin: 5px 0;
                opacity: 0.8;
            }
            
            .footer strong {
                color: #bdc3c7;
            }
            
            @media (max-width: 600px) {
                .container {
                    margin: 10px;
                    border-radius: 5px;
                }
                
                .content {
                    padding: 30px 20px;
                }
                
                .btn-confirmar {
                    font-size: 16px;
                    padding: 12px 25px;
                }
                
                .header h1 {
                    font-size: 24px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="header-content">
                    <h1>SmartSys</h1>
                    <p>¡Bienvenido/a!</p>
                </div>
            </div>
            
            <div class="content">
                <div class="greeting">
                    ¡Hola ${nombre} ${apellido}! 🎉
                </div>
                
                <div class="message">
                    ¡Gracias por registrarte en SmartSys! Para completar tu registro y activar tu cuenta, 
                    necesitamos que confirmes tu dirección de correo electrónico.
                </div>
                
                <div class="btn-container">
                    <a href="${enlaceConfirmacion}" class="btn-confirmar">
                        🚀 Confirmar mi Registro
                    </a>
                </div>
                
                <div class="alternative-link">
                    <p><strong>¿No puedes hacer clic en el botón?</strong> Copia y pega este enlace en tu navegador:</p>
                    <div class="link-text">${enlaceConfirmacion}</div>
                </div>
                
                <div class="instructions">
                    <h3>📋 ¿Qué sucede después?</h3>
                    <ul>
                        <li>Haz clic en el botón "Confirmar mi Registro"</li>
                        <li>Serás redirigido a SmartSys</li>
                        <li>Tu cuenta quedará activa inmediatamente</li>
                        <li>Podrás iniciar sesión con tus credenciales</li>
                    </ul>
                </div>
                
                <div class="security-note">
                    <strong>🔒 Seguridad:</strong> Este enlace es único y personal. No lo compartas con nadie.
                </div>
                
                <div class="expiration-warning">
                    <strong>⏰ Importante:</strong> Este enlace expira en 24 horas por motivos de seguridad. 
                    Si no confirmas tu registro antes de que expire, deberás registrarte nuevamente.
                </div>
            </div>
            
            <div class="footer">
                <p><strong>SmartSys</strong> - Sistema de Gestión Inteligente</p>
                <p>Si no te registraste en SmartSys, puedes ignorar este mensaje.</p>
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                <p>© ${new Date().getFullYear()} SmartSys. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

// <---------- Template HTML para el correo -------------->
function generarTemplateCorreo(codigo, nombre, apellido) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Código de Recuperación - SmartSys</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333333;
                background-color: #f4f4f4;
            }
            
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                border-radius: 10px;
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
                padding: 30px 20px;
                text-align: center;
                color: white;
            }
            
            .logo {
                max-width: 150px;
                height: auto;
                margin-bottom: 15px;
                border-radius: 8px;
            }
            
            .header h1 {
                font-size: 28px;
                font-weight: 600;
                margin-bottom: 5px;
            }
            
            .header p {
                font-size: 16px;
                opacity: 0.9;
            }
            
            .content {
                padding: 40px 30px;
                text-align: center;
            }
            
            .greeting {
                font-size: 18px;
                color: #555555;
                margin-bottom: 25px;
            }
            
            .message {
                font-size: 16px;
                color: #666666;
                margin-bottom: 30px;
                line-height: 1.7;
            }
            
            .code-container {
                background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
                padding: 25px;
                border-radius: 12px;
                margin: 30px 0;
                box-shadow: 0 4px 15px rgba(240, 147, 251, 0.3);
            }
            
            .code {
                font-size: 32px;
                font-weight: bold;
                color: white;
                letter-spacing: 3px;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }
            
            .code-label {
                font-size: 14px;
                color: white;
                opacity: 0.9;
                margin-bottom: 10px;
                text-transform: uppercase;
                font-weight: 500;
            }
            
            .instructions {
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #2c3e50;
                margin: 25px 0;
                text-align: left;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            }
            
            .instructions h3 {
                color: #2c3e50;
                font-size: 16px;
                margin-bottom: 10px;
            }
            
            .instructions ul {
                list-style: none;
                padding: 0;
            }
            
            .instructions li {
                padding: 5px 0;
                color: #555555;
                position: relative;
                padding-left: 20px;
            }
            
            .instructions li:before {
                content: "✓";
                color: #28a745;
                font-weight: bold;
                position: absolute;
                left: 0;
            }
            
            .warning {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                color: #856404;
                font-size: 14px;
            }
            
            .footer {
                background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
                color: white;
                padding: 25px 30px;
                text-align: center;
                font-size: 14px;
            }
            
            .footer p {
                margin: 5px 0;
                opacity: 0.8;
            }
            
            .footer strong {
                color: #bdc3c7;
            }
            
            @media (max-width: 600px) {
                .container {
                    margin: 10px;
                    border-radius: 5px;
                }
                
                .content {
                    padding: 30px 20px;
                }
                
                .code {
                    font-size: 24px;
                    letter-spacing: 2px;
                }
                
                .header h1 {
                    font-size: 24px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="header-content">
                    <h1>SmartSys</h1>
                </div>
            </div>
            
            <div class="content">
                <div class="greeting">
                    ¡Hola ${nombre} ${apellido} !
                </div>
                
                <div class="message">
                    Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en SmartSys. 
                    Utiliza el siguiente código de verificación para continuar con el proceso.
                </div>
                
                <div class="code-container">
                    <div class="code-label">Código de Verificación</div>
                    <div class="code">${codigo}</div>
                </div>
                
                <div class="instructions">
                    <h3>📋 Instrucciones:</h3>
                    <ul>
                        <li>Ingresa este código en la pantalla de recuperación</li>
                        <li>No compartas este código con nadie</li>
                        <li>Si no solicitaste este cambio, ignora este correo</li>
                    </ul>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Importante:</strong> Por tu seguridad, este código es unico. 
                    Si no lo utilizas o refrescas la web, deberás solicitar uno nuevo.
                </div>
            </div>
            
            <div class="footer">
                <p><strong>SmartSys</strong> - Sistema de Gestión Inteligente</p>
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                <p>© ${new Date().getFullYear()} SmartSys. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// <---------- fin publicaciones ---------->
module.exports = {
  registro,
  login,
  actualizarPerfilImg,
  actualizarPerfil,
  explorar,
  explorarActivas,
  unirsePublico,
  unirsePrivado,
  misPlataformas,
  publicacionesPorPlataforma,
  verPublicacion,
  recuperar,
  resetpassword,
  google,
  confirmarRegistro
};
