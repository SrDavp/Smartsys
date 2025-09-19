const axios = require('axios');
const { poolPromise, sql } = require("../db");
const transporter = require('../correo');
const bcrypt = require('bcrypt');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client("850012171335-055q5ld8dc76qlb24nvaitg6opkf8b9v.apps.googleusercontent.com");
const crypto = require("crypto");

// <---------- Generar codigo unico -------------->
function generarCodigo() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
// <---------- Generar codigo unico -------------->

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
                    <img src="cid:logo" alt="SmartSys Logo" class="logo">
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

async function googleauth(req, res) {
    const { token } = req.body;
    console.log("Token recibido en backend:", token);

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: "850012171335-055q5ld8dc76qlb24nvaitg6opkf8b9v.apps.googleusercontent.com",
        });

        const payload = ticket.getPayload();
        console.log("Payload:", payload);

        const { email, given_name, family_name, picture } = payload;

        const nombre = given_name || "Desconocido";
        const apellido = family_name || "";

        const pool = await poolPromise;
        const consulta = await pool.request()
            .input('correoElectronico', sql.NVarChar, email)
            .query(`SELECT * FROM Usuarios WHERE correoElectronico = @correoElectronico`);

        if (consulta.recordset.length !== 0) {

            const usuario = consulta.recordset[0];
            console.log(consulta)
            if (usuario.google === true) {

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

            /* 
            
            Payload: {
                iss: 'https://accounts.google.com',
                azp: '850012171335-055q5ld8dc76qlb24nvaitg6opkf8b9v.apps.googleusercontent.com',
                aud: '850012171335-055q5ld8dc76qlb24nvaitg6opkf8b9v.apps.googleusercontent.com',
                sub: '117393349556950911597',
                email: 'daniel.valencia.sv2@gmail.com',
                email_verified: true,
                nbf: 1756301231,
                name: 'Daniel',
                picture: 'https://lh3.googleusercontent.com/a/ACg8ocJdMTkbgU9_yKUxtbD87OzSiOVlKv0QEX3sioyqeYcluctXyfpx=s96-c',
                given_name: 'Daniel',
                iat: 1756301531,
                exp: 1756305131,
                jti: 'fc40b58bad7df306aeac417300de4831c474155a'
                }
            
            */


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
    } catch (exception) {
        console.log("Error al verificar token:", exception);
        res.status(400).json({ success: false, message: "Token inválido" });
    }
}

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


async function actualizarcontrasenaperfil(req, res) {
    try {
        const { correo, contrasenaActual, contrasenaNueva } = req.body;

        const pool = await poolPromise;

        const result = await pool.request()
            .input('correo', sql.NVarChar, correo)
            .query(`SELECT contrasena FROM Usuarios WHERE correoElectronico = @correo`);

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const usuario = result.recordset[0];

        const passwordMatch = await bcrypt.compare(contrasenaActual, usuario.contrasena);
        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contrasenaNueva, salt);

        await pool.request()
            .input('correo', sql.NVarChar, correo)
            .input('contrasena', sql.NVarChar, hashedPassword)
            .query(`UPDATE Usuarios SET contrasena = @contrasena WHERE correoElectronico = @correo`);

        return res.json({ success: true, message: 'Contraseña actualizada correctamente' });

    } catch (error) {
        console.error("Error al actualizar contraseña:", error);
        return res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
}
// Cambiar contraseña dentro del perfil

// <---------- Template HTML para el correo -------------->

async function restablecer(req, res) {
    const { correoElectronico } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('correoElectronico', sql.NVarChar, correoElectronico)
            .query(`SELECT idUsuario, nombre, apellido
                FROM Usuarios 
                WHERE correoElectronico = @correoElectronico`);

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "El correo no está registrado" });

        } else {
            const codigo = generarCodigo();
            const usuario = result.recordset[0]; // Obtenemos la primera fila (debería ser única por correo)

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
                attachments: [{
                    filename: 'logo-dark.png',
                    path: path.join(__dirname, '../content/imgs/logo-dark.png'), // Ruta correcta basada en tu estructura
                    cid: 'logo' // Mismo cid que se usa en el HTML
                }]
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

//Actualiza contrasena
async function actualizarContrasena(req, res) {
    const { correo, contraseña } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contraseña, salt);
        const pool = await poolPromise;
        await pool.request()
            .input('correo', sql.NVarChar, correo)
            .input('contraseña', sql.NVarChar, hashedPassword)
            .query(`UPDATE Usuarios SET contrasena = @contraseña WHERE correoElectronico = @correo`);

        return res.json({ success: true, message: "Contraseña actualizada correctamente" });
    } catch (error) {
        console.error("Error al actualizar contraseña:", error);
        return res.status(500).json({ success: false, message: "Error en el servidor" });
    }
}
//Actualiza contrasena

async function DescOrg(req, res) {
    console.log("Mensaje recibido de ASP.NET:", req.body);
    try {
        const respuestaPython = await axios.post('http://localhost:5000/procesar', req.body);
        console.log("Respuesta desde Flask:", respuestaPython.data);
        res.json(respuestaPython.data);
    } catch (error) {
        console.error("Error al contactar con Python:", error.message);
        res.status(500).json({ success: false, message: "Error al contactar con el servicio Python" });
    }
}

module.exports = {
    DescOrg,
    restablecer,
    actualizarContrasena,
    googleauth,
    actualizarcontrasenaperfil
};