function handleCredentialResponse(response) {
    const token = response.credential;

    fetch("/Account/GoogleLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Sesión creada en backend, ahora redirigimos
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