let chamadoParaEnviar = null;

document.getElementById("form_suporte").addEventListener("submit", function (e) {
    e.preventDefault();

    const nome = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const setor = document.getElementById("setor").value.trim();
    const descricao = document.getElementById("descricao").value.trim();

    // if (!nome || !email || !setor || !descricao) {
    //     alert("Por favor, preencha todos os campos!");
    //     return;
    // }

    chamadoParaEnviar = { nome, email, setor, descricao };

    const mensagem = `
        Você está prestes a enviar um chamado com os seguintes dados:<br><br>
        Nome: ${nome}<br>
        Email: ${email}<br>
        Setor: ${setor}<br>
        Descrição: ${descricao}<br><br>
        Deseja continuar?`;

    document.getElementById("mensagemModal").innerHTML = mensagem;
    document.getElementById("modalConfirmacao").style.display = "flex";
});

function fecharModal() {
    document.getElementById("modalConfirmacao").style.display = "none";
}

document.getElementById("btnConfirmarEnvio").addEventListener("click", async function () {
    if (!chamadoParaEnviar) return;

    try {
        const response = await fetch('http://localhost:3000/api/chamados', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chamadoParaEnviar)
        });

        if (response.ok) {
            // alert("Chamado enviado com sucesso!");
            document.getElementById("form_suporte").reset();
            fecharModal();
        } else {
            const erro = await response.json();
            alert("Erro ao enviar chamado: " + (erro.error || "Desconhecido"));
        }
    } catch (error) {
        console.error("Erro ao enviar chamado:", error);
        alert("Erro de conexão com o servidor.");
    }

    chamadoParaEnviar = null;
});