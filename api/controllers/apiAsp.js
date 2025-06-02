const axios = require('axios');

async function DescOrg(req, res) {
    console.log("Mensaje recibido de ASP.NET:", req.body);
    try {
        const respuestaPython = await axios.post('http://localhost:5000/procesar', req.body);
        console.log("Respuesta desde Flask:", respuestaPython.data);
        res.json(respuestaPython.data);
    } catch (error) {
        console.error("Error al contactar con Python:", error.message);
    }
}

module.exports = {
    DescOrg
};
