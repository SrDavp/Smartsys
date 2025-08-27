// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "smartsyscj@gmail.com",  // <-- TU CORREO
    pass: "vgrghoslpxjykkdn"      // <-- APP PASSWORD DE GMAIL
  },
});

// =======================
// GENERAR CÓDIGO ÚNICO CHAT
// =======================
function generarCodigoUnico(nombre, apellido) {
  let iniciales = "";
  if (nombre && nombre.length > 0) iniciales += nombre[0];
  if (apellido && apellido.length > 0) iniciales += apellido[0];
  iniciales = iniciales.toUpperCase();
  const randomBytes = crypto.randomBytes(2).toString("hex").toUpperCase();
  return iniciales + randomBytes; // Ej: ER3F7C
}

// =======================
// LOGIN USUARIO
// =======================
async function login(req, res) {
  try {
    const { correoElectronico, contrasena } = req.body;

    const pool = await poolPromise;
    const consulta = await pool.request()
      .input('correoElectronico', sql.NVarChar, correoElectronico)
      .query(`SELECT idUsuario, nombre, apellido, correoElectronico, contrasena, telefono, tipoUsuario, estadoCuenta, fechaCreacion, foto_perfil, biografia 
              FROM Usuarios 
              WHERE correoElectronico = @correoElectronico`);

    if (consulta.recordset.length === 0) {
      return res.status(401).json({ ok: false, mensaje: 'Usuario no encontrado' });
    }

    const usuario = consulta.recordset[0];

    // Verificar si está activo
    if (usuario.estadoCuenta === "pendiente") {
        return res.status(403).json({ ok: false, mensaje: 'Debes verificar tu correo antes de iniciar sesión' });
    }

    const passwordMatch = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!passwordMatch) {
      return res.status(401).json({ ok: false, mensaje: 'Contraseña incorrecta' });
    }

    res.status(200).json({
      ok: true,
      mensaje: 'Login exitoso',
      data: usuario
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al iniciar sesión' });
  }
}

// =======================
// REGISTRO USUARIO
// =======================
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
      biografia = null
    } = req.body;

    const pool = await poolPromise;

    // Validar si el correo ya existe
    const existe = await pool.request()
      .input("correoElectronico", sql.NVarChar, correoElectronico)
      .query(`SELECT idUsuario FROM Usuarios WHERE correoElectronico = @correoElectronico`);
    if (existe.recordset.length > 0) {
      return res.status(400).json({ ok: false, mensaje: "El correo ya está registrado" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contrasena, salt);

    // Generar CodigoUnico y Código de verificación
    const codigoUnico = generarCodigoUnico(nombre, apellido);
    const codigoVerificacion = (Math.floor(100000 + Math.random() * 900000)).toString();


    // Fecha de expiración del código: 15 minutos desde ahora
    const fechaExpiracionCodigo = new Date(Date.now() + 15 * 60 * 1000); 

    // Insertar usuario con estado pendiente
    await pool.request()
      .input("nombre", sql.NVarChar, nombre)
      .input("apellido", sql.NVarChar, apellido)
      .input("correoElectronico", sql.NVarChar, correoElectronico)
      .input("contrasena", sql.NVarChar, hashedPassword)
      .input("telefono", sql.NVarChar, telefono)
      .input("tipoUsuario", sql.NVarChar, tipoUsuario)
      .input("foto_perfil", sql.VarBinary, null)
      .input("biografia", sql.NVarChar, biografia)
      .input("codigoUnico", sql.NVarChar, codigoUnico)
      .input("codigoVerificacion", sql.NVarChar, codigoVerificacion)
      .input("fechaExpiracionCodigo", sql.DateTime2, fechaExpiracionCodigo)
      .input("intentosCodigo", sql.Int, 0)
      .input("estadoCuenta", sql.NVarChar, "pendiente")
      .query(`INSERT INTO Usuarios 
        (nombre, apellido, correoElectronico, contrasena, telefono, tipoUsuario, foto_perfil, biografia, codigoUnico, codigoVerificacion, fechaExpiracionCodigo, intentosCodigo, estadoCuenta)
        VALUES (@nombre, @apellido, @correoElectronico, @contrasena, @telefono, @tipoUsuario, @foto_perfil, @biografia, @codigoUnico, @codigoVerificacion, @fechaExpiracionCodigo, @intentosCodigo, @estadoCuenta)`);

    // Enviar correo con código de verificación
    await transporter.sendMail({
      from: "SmartSys <smartsyscj@gmail.com>",
      to: correoElectronico,
      subject: "Código de verificación - SmartSys",
      html: `
        <h2>Hola ${nombre},</h2>
        <p>Gracias por registrarte en SmartSys.</p>
        <p>Tu código de verificación es:</p>
        <h1>${codigoVerificacion}</h1>
        <p>Este código expirará en 15 minutos.</p>
        <p>Ingresa este código en la app para activar tu cuenta.</p>
      `
    });

    res.status(201).json({
      ok: true,
      mensaje: "Usuario registrado. Verifica tu correo para activar la cuenta."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: "Error al registrar usuario" });
  }
}

// =======================
// VERIFICAR CÓDIGO
// =======================
async function verificarCodigo(req, res) {
  try {
    const { correoElectronico } = req.body;
    // Convertir el código recibido a string y eliminar espacios
    const codigo = req.body.codigo?.toString().trim();

    if (!codigo) {
      return res.status(400).json({ ok: false, mensaje: "Código inválido" });
    }

    const pool = await poolPromise;

    // Obtener usuario por correo
    const usuarioQuery = await pool.request()
      .input("correoElectronico", sql.NVarChar, correoElectronico)
      .query(`SELECT idUsuario, codigoVerificacion, intentosCodigo, fechaExpiracionCodigo, estadoCuenta 
              FROM Usuarios WHERE correoElectronico = @correoElectronico`);

    if (usuarioQuery.recordset.length === 0) {
      return res.status(400).json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    const usuario = usuarioQuery.recordset[0];

    // Verificar si usuario está bloqueado
    if (usuario.estadoCuenta === "bloqueado") {
      return res.status(403).json({ ok: false, mensaje: "Cuenta bloqueada por intentos fallidos. Solicita un nuevo código." });
    }

    // Verificar si el código expiró
    if (usuario.fechaExpiracionCodigo && new Date() > new Date(usuario.fechaExpiracionCodigo)) {
      return res.status(400).json({ ok: false, mensaje: "El código ha expirado. Solicita uno nuevo." });
    }

    // Verificar código
    if (usuario.codigoVerificacion?.toString() !== codigo) {
      const nuevosIntentos = usuario.intentosCodigo + 1;
      let nuevoEstado = "pendiente";

      if (nuevosIntentos >= 5) {
        nuevoEstado = "bloqueado"; // Bloquea al usuario después de 5 intentos
      }

      await pool.request()
        .input("idUsuario", sql.BigInt, usuario.idUsuario)
        .input("intentosCodigo", sql.Int, nuevosIntentos)
        .input("estadoCuenta", sql.NVarChar, nuevoEstado)
        .query(`UPDATE Usuarios SET intentosCodigo = @intentosCodigo, estadoCuenta = @estadoCuenta WHERE idUsuario = @idUsuario`);

      return res.status(400).json({ ok: false, mensaje: `Código incorrecto. Intentos: ${nuevosIntentos}/5` });
    }

    // Código correcto: activar usuario y resetear intentos
    await pool.request()
      .input("idUsuario", sql.BigInt, usuario.idUsuario)
      .query(`UPDATE Usuarios 
              SET estadoCuenta = 'activo', codigoVerificacion = NULL, intentosCodigo = 0, verificado = 1 
              WHERE idUsuario = @idUsuario`);

    res.status(200).json({ ok: true, mensaje: "Cuenta verificada con éxito" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: "Error al verificar código" });
  }
}