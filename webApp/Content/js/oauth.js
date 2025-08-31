function handleCredentialResponse(response) {
    // JWT de Google
    const token = response.credential;

    // Mandamos al backend
    fetch("http://localhost:3000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                console.log("Usuario autenticado:", data);
                // Guardar token en localStorage o cookie y redirigir
                localStorage.setItem('token', data.token);
                window.location.href = "/Home/Index";
            } else {
                alert(data.message || "Error al iniciar sesión");
            }
        });
}

window.onload = () => {
    google.accounts.id.initialize({
        client_id: "850012171335-055q5ld8dc76qlb24nvaitg6opkf8b9v.apps.googleusercontent.com",
        callback: handleCredentialResponse
    });

    google.accounts.id.renderButton(
        document.getElementById("googleSignInButton"),
        { theme: "outline", size: "large", width: "250" }
    );

    google.accounts.id.prompt(); // muestra el prompt automáticamente si se puede
};