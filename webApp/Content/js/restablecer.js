document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('buscarCuentaForm');
    const modal = document.getElementById('codigoModal');
    const correoInput = document.getElementById('CorreoElectronico');
    const correoHidden = document.getElementById('correoHidden');
    const codigoInputs = document.querySelectorAll('.codigoInput');
    const submitCodigo = document.getElementById('submitCodigo');
    const passwordSection = document.getElementById('passwordSection');
    const submitPassword = document.getElementById('submitPassword');
    const ingresar = document.getElementById('ingresar');
    const revisa = document.getElementById('revisa');
    const mensajeCodigo2 = document.getElementById("mensajeCodigo2")
    const hiddeninput = document.getElementById("hiddeninput")

    let codigoReal;

    // Enviar correo para generar código
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const correo = correoInput.value;
        try {
            const res = await fetch("http://localhost:3000/auth/restablecer/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ correoElectronico: correo })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                correoHidden.value = correo;
                modal.style.display = 'flex';
                codigoInputs[0].focus();
                codigoReal = data.codigo;
                hiddeninput.value = correo;
            } else {
                mensajeCodigo2.className = "block mb-4 text-center px-4 py-2 rounded-lg text-white font-medium bg-red-500 text-white"
                mostrarMensaje(data.message || "Error al enviar código", "error");
            }
        } catch (err) {
            console.error(err);
            alert("Error de conexión");
        }
    });

    // Movimiento automático entre inputs
    codigoInputs.forEach((input, i) => {
        input.addEventListener('input', function () {
            if (this.value.length === 1 && i < codigoInputs.length - 1) {
                codigoInputs[i + 1].focus();
            }
        });
        input.addEventListener('keydown', function (e) {
            if (e.key === "Backspace" && !this.value && i > 0) {
                codigoInputs[i - 1].focus();
            }
        });
    });

    submitCodigo.addEventListener('click', function () {
        const codigoIngresado = Array.from(codigoInputs).map(i => i.value).join('');
        if (codigoIngresado.length < 6) {
            alert("Ingresa los 6 dígitos");
            return;
        }
        if (codigoIngresado === codigoReal) {
            mostrarMensaje("Código correcto!", "exito");
            verificarCodigoForm.style.display = 'none';
            passwordSection.style.display = 'block';
            ingresar.style.display = 'none';
            revisa.style.display = 'none';
            submitCodigo.style.display = "none"
        } else {
            mostrarMensaje("Código Incorrecto!", "error");
        }
    });
});
