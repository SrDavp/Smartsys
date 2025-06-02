from flask import Flask, request, jsonify
from index import categorizar_empresa
import json

app = Flask(__name__)

@app.route('/procesar', methods=['POST'])
def procesar():
    data = request.get_json()
    print("Descripcion recibida:", data)
    
    mensaje = data.get("Mensaje")
    categorias = categorizar_empresa(mensaje)

    return jsonify({
        "descripcion": mensaje,
        "categorias": categorias
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)