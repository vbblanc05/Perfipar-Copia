const imagem = ["/img/sala_reuniao.png", "/img/sala_auditorio.png"];
let index = 0

function trocarImagem() {
    index = (index + 1) % imagem.length;
    document.getElementById("imagem").src = imagem[index];
}

setInterval(trocarImagem, 2000);