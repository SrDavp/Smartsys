const actualizarForm = document.getElementById("actualizarContrasenaForm");

actualizarForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const contraseña = document.getElementById("password-field").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const correo = hiddeninput.value;

    if (contraseña !== confirmPassword) {
        alert("Las contraseñas no coinciden");
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/actualizarcontrasena", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, contraseña })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            alert("Contraseña actualizada correctamente");
            window.location.href = "/Account/Login"; // redirige al login
        } else {
            alert(data.message || "Error al actualizar la contraseña");
        }
    } catch (err) {
        console.error(err);
        alert("Error de conexión con el servidor");
    }
});
