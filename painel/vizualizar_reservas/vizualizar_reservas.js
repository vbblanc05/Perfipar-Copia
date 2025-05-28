// Função para mostrar a seção de uma sala e carregar suas reservas
function mostrarSecao(secao) {
    document.getElementById("secao_auditorio").style.display = 'none';
    document.getElementById("secao_reuniao").style.display = 'none';
    document.getElementById(secao).style.display = 'block';

    const sala = secao === "secao_auditorio" ? "auditório" : "reunião";
    carregarReservas(sala, secao);
}

// Esconde a seção
function esconderSecao(secao) {
    document.getElementById(secao).style.display = 'none';
}

function formatarHora(hora) {
    if (!hora || typeof hora !== 'string') return "—";
    if (hora.includes('T')) {
        const partes = hora.split('T')[1].split(':');
        return `${partes[0].padStart(2, '0')}:${partes[1].padStart(2, '0')}`;
    }
    const partes = hora.split(':');
    if (partes.length >= 2) {
        return `${partes[0].padStart(2, '0')}:${partes[1].padStart(2, '0')}`;
    }
    return "Formato inválido";
}

// Carrega reservas futuras da sala correspondente
async function carregarReservas(sala) {
    const tabela = sala === "auditório"
        ? document.getElementById("reservas_auditorio").getElementsByTagName('tbody')[0]
        : document.getElementById("reservas_reuniao").getElementsByTagName('tbody')[0];

    tabela.innerHTML = "";

    try {
        const response = await fetch(`http://localhost:3000/api/reservas?sala=${encodeURIComponent(sala)}`);
        if (!response.ok) throw new Error("Erro ao buscar reservas.");

        const reservas = await response.json();
        const agora = new Date();

        reservas.forEach(reserva => {
            try {
                if (!reserva.data_reserva || !reserva.hora_termino) return;

                // Pega a data da reserva (mesmo que a hora esteja como 1970)
                const [ano, mes, dia] = reserva.data_reserva.split('T')[0].split('-').map(Number);

                // Pega hora e minuto da string ISO completa (1970-01-01T14:06:00.000Z)
                const horaTerminoStr = reserva.hora_termino.split('T')[1]; // "14:06:00.000Z"
                const [hStr, mStr] = horaTerminoStr.split(':');
                const hora = Number(hStr);
                const minuto = Number(mStr);

                if ([ano, mes, dia, hora, minuto].some(isNaN)) {
                    console.warn("Reserva ignorada por valores inválidos:", reserva);
                    return;
                }

                const termino = new Date(ano, mes - 1, dia, hora, minuto);
                if (termino <= agora) return;

                const dataFormatada = `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
                const horaInicioFormatada = formatarHora(reserva.hora_inicio);
                const horaTerminoFormatada = formatarHora(reserva.hora_termino);

                const linha = tabela.insertRow();
                linha.insertCell(0).textContent = reserva.nome;
                linha.insertCell(1).textContent = reserva.setor;
                linha.insertCell(2).textContent = reserva.descricao || "—";
                linha.insertCell(3).textContent = dataFormatada;
                linha.insertCell(4).textContent = horaInicioFormatada;
                linha.insertCell(5).textContent = horaTerminoFormatada;

                const botao = document.createElement("button");
                botao.className = "btn-excluir";
                botao.innerHTML = '<span>Excluir</span> <i class="fa fa-trash"></i>';
                botao.onclick = () => mostrarModalExclusao(reserva, sala, linha);
                const celulaBotao = linha.insertCell(6);
                celulaBotao.style.textAlign = "center"; // centraliza o conteúdo
                celulaBotao.appendChild(botao);

            } catch (e) {
                console.warn("Erro ao processar reserva:", reserva, e);
            }
        });
    } catch (error) {
        console.error("Erro ao carregar reservas:", error);
        alert("Erro ao carregar reservas da sala " + sala);
    }
}

// Exclui uma reserva da tabela e banco
let reservaParaExcluir = null;
let linhaParaRemover = null;

function mostrarModalExclusao(reserva, sala, linha) {
    reservaParaExcluir = { reserva, sala };
    linhaParaRemover = linha;
    document.getElementById("modalConfirmacao").style.display = "flex";
}

function fecharModal() {
    document.getElementById("modalConfirmacao").style.display = "none";
}

document.getElementById("btnConfirmarExclusao").onclick = async function () {
    const { reserva, sala } = reservaParaExcluir;
    try {
        const response = await fetch('http://localhost:3000/api/reservas/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: reserva.nome,
                data: reserva.data_reserva,
                horaInicio: reserva.hora_inicio,
                sala: sala
            })
        });

        if (response.ok) {
            linhaParaRemover.classList.add('fade-out');
            setTimeout(() => linhaParaRemover.remove(), 500);
            fecharModal();
        } else {
            const erro = await response.json();
            alert("Erro ao excluir reserva: " + (erro.error || "Desconhecido"));
        }
    } catch (error) {
        console.error("Erro ao excluir reserva:", error);
        alert("Erro ao excluir reserva.");
    }
};

// Carrega ambas as tabelas quando a página abre
document.addEventListener('DOMContentLoaded', function () {
    carregarReservas("auditório", "secao_auditorio");
    carregarReservas("reunião", "secao_reuniao");
});

function abrirModalConfirmacao(mensagem, aoConfirmar) {
    document.getElementById("modal_mensagem").textContent = mensagem;
    const modal = document.getElementById("modal_confirmacao");
    modal.style.display = "flex";

    const confirmar = document.getElementById("modal_confirmar");
    const cancelar = document.getElementById("modal_cancelar");

    confirmar.onclick = () => {
        modal.style.display = "none";
        aoConfirmar();
    };
    cancelar.onclick = () => {
        modal.style.display = "none";
    };
}