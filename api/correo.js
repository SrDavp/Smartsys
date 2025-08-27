const nodemailer = require("nodemailer")

//CONFIGURACION DE MANDAR CORREOS
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "smartsyscj@gmail.com",
    pass: "vgrghoslpxjykkdn"
  },
});

module.exports = transporter;