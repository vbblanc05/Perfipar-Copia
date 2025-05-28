function mostrarSecao(secao) {
    document.getElementById("secao_auditorio").style.display = 'none';
    document.getElementById("secao_reuniao").style.display = 'none';
    document.getElementById(secao).style.display = 'block';
}

function esconderSecao(secao) {
    document.getElementById(secao).style.display = 'none';
    document.getElementById("form_auditorio").reset();
    document.getElementById("form_reuniao").reset();
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

function exibirModalConfirmacaoReserva(mensagem) {
    return new Promise((resolve) => {
        document.getElementById("textoConfirmacaoReserva").textContent = mensagem;
        document.getElementById("modalConfirmacaoReserva").style.display = "flex";

        const confirmar = document.getElementById("btnConfirmarReserva");
        const cancelar = document.getElementById("btnCancelarReserva");

        const fechar = (resposta) => {
            document.getElementById("modalConfirmacaoReserva").style.display = "none";
            confirmar.removeEventListener("click", confirmarHandler);
            cancelar.removeEventListener("click", cancelarHandler);
            resolve(resposta);
        };

        const confirmarHandler = () => fechar(true);
        const cancelarHandler = () => fechar(false);

        confirmar.addEventListener("click", confirmarHandler);
        cancelar.addEventListener("click", cancelarHandler);
    });
}

function exibirAlerta(mensagem) {
    return new Promise((resolve) => {
        const modalAlerta = document.createElement('div');
        modalAlerta.id = 'modalAlerta';
        modalAlerta.classList.add('modal-overlay'); // Usando sua classe para o fundo escuro

        const conteudoAlerta = document.createElement('div');
        conteudoAlerta.classList.add('modal-conteudo'); // Usando sua classe para a caixa branca

        const mensagemTexto = document.createElement('p');
        mensagemTexto.textContent = mensagem;

        const botoesAlerta = document.createElement('div');
        botoesAlerta.classList.add('botoes'); // Usando sua classe para o layout dos botões

        const btnOk = document.createElement('button');
        btnOk.textContent = 'OK';
        btnOk.classList.add('btn-confirmar'); // Usando uma classe semelhante à de confirmação

        btnOk.addEventListener('click', () => {
            document.body.removeChild(modalAlerta);
            resolve(true); // Resolve a Promise quando o OK é clicado
        });

        botoesAlerta.appendChild(btnOk);
        conteudoAlerta.appendChild(mensagemTexto);
        conteudoAlerta.appendChild(botoesAlerta);
        modalAlerta.appendChild(conteudoAlerta);
        document.body.appendChild(modalAlerta);

        // Foca no botão OK para acessibilidade
        btnOk.focus();
    });
}

async function adicionarReserva(sala) {
    let nome, setor, descricao, data, horaInicio, horaTermino;

    const prefixo = sala === "auditório" ? "auditorio" : "reuniao";

    nome = document.getElementById(`nome_${prefixo}`).value;
    setor = document.getElementById(`setor_${prefixo}`).value;
    descricao = document.getElementById(`descricao_${prefixo}`).value;
    data = document.getElementById(`data_${prefixo}`).value;
    horaInicio = document.getElementById(`hora_inicio_${prefixo}`).value;
    horaTermino = document.getElementById(`hora_termino_${prefixo}`).value;

    // Verificação de campos obrigatórios
    if (!nome || !setor || !descricao || !data || !horaInicio || !horaTermino) {
        alert("Por favor, preencha todos os campos.");

        // Foca no primeiro campo vazio
        if (!nome) document.getElementById(`nome_${prefixo}`).focus();
        else if (!setor) document.getElementById(`setor_${prefixo}`).focus();
        else if (!descricao) document.getElementById(`descricao_${prefixo}`).focus();
        else if (!data) document.getElementById(`data_${prefixo}`).focus();
        else if (!horaInicio) document.getElementById(`hora_inicio_${prefixo}`).focus();
        else if (!horaTermino) document.getElementById(`hora_termino_${prefixo}`).focus();

        return false; // Retorna false em caso de erro
    }

    // Verificação de datas/hora passadas com margem de 15 minutos
    const agora = new Date();
    const margemMinutos = 15;
    const agoraComMargem = new Date(agora.getTime() + margemMinutos * 60000);
    const dataHoraInicio = new Date(`${data}T${horaInicio}`);
    const dataHoraTermino = new Date(`${data}T${horaTermino}`);
    // Pega o valor do input de data e transforma em objeto Date no horário local
    const partesData = data.split('-'); // ["2025", "04", "15"]
    const dataSelecionada = new Date(
    parseInt(partesData[0]),  // ano
    parseInt(partesData[1]) - 1,  // mês (0-indexed)
    parseInt(partesData[2])   // dia
    );

    // Agora pega a data de hoje, também só com ano/mês/dia
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataSelecionada.setHours(0, 0, 0, 0);

    // Verifica se a data escolhida é menor que hoje
    if (dataSelecionada < hoje) {
        await exibirAlerta("Não é possível reservar uma data que já passou.");
        document.getElementById(`data_${prefixo}`).focus();
        return false;
    }

    // Verifica se a data/hora de início está dentro da margem de 15 minutos
    if (dataHoraInicio <= agoraComMargem) {
        await exibirAlerta(`A reserva deve ser feita com pelo menos ${margemMinutos} minutos de antecedência.`);
        document.getElementById(`hora_inicio_${prefixo}`).focus();
        return false;
    }

    // Verifica se a hora de término é no passado
    if (dataHoraTermino <= agora) {
        await exibirAlerta("Não é possível reservar com hora de término no passado.");
        document.getElementById(`hora_termino_${prefixo}`).focus();
        return false;
    }

    // Verifica se o horário de término é menor ou igual ao de início
    if (dataHoraTermino <= dataHoraInicio) {
        await exibirAlerta("O horário de término deve ser maior que o de início.");
        document.getElementById(`hora_termino_${prefixo}`).focus();
        return false;
    }

    const dataFormatada = `${data.split('-').reverse().join('/')}`;
    const mensagem = `Você está prestes a confirmar a reserva para a Sala ${sala.toUpperCase()} no dia ${dataFormatada}, das ${horaInicio} às ${horaTermino}. Deseja continuar?`;
    const confirmar = await exibirModalConfirmacaoReserva(mensagem);
    if (!confirmar) {
        // alert("Reserva cancelada.");
        return false;
    }

    // Formatação para envio ao backend
    horaInicio = horaInicio.length === 5 ? horaInicio + ':00' : horaInicio;
    horaTermino = horaTermino.length === 5 ? horaTermino + ':00' : horaTermino;

    const reserva = { nome, setor, descricao, data, horaInicio, horaTermino, sala };

    try {
        const response = await fetch('http://localhost:3000/api/reservas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reserva)
        });

        if (response.ok) {
            // alert("Reserva realizada com sucesso!");
            carregarReservas("auditório");
            carregarReservas("reunião");
            return true; // Retorna true para sucesso
        } else {
            const erro = await response.json();
            alert("Erro ao salvar reserva: " + (erro.error || "Desconhecido"));
            return false; // Retorna false para erro
        }
    } catch (error) {
        console.error("Erro ao enviar reserva:", error);
        alert("Erro de conexão com o servidor.");
        return false; // Retorna false em caso de erro de conexão
    }
}

async function carregarReservas(sala) {
    const tabela = sala === "auditório"
        ? document.getElementById("reservas_auditorio").getElementsByTagName('tbody')[0]
        : document.getElementById("reservas_reuniao").getElementsByTagName('tbody')[0];

    tabela.innerHTML = "";

    try {
        const response = await fetch(`http://localhost:3000/api/reservas?sala=${encodeURIComponent(sala)}`);
        if (!response.ok) throw new Error("Resposta do servidor não OK.");

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
                linha.insertCell(2).textContent = dataFormatada;
                linha.insertCell(3).textContent = horaInicioFormatada;
                linha.insertCell(4).textContent = horaTerminoFormatada;
            } catch (e) {
                console.warn("Erro ao processar reserva:", reserva, e);
            }
        });
    } catch (error) {
        console.error("Erro ao carregar reservas:", error);
        alert("Erro ao buscar reservas.");
    }
}

document.getElementById("form_auditorio").addEventListener("submit", async function (event) {
    event.preventDefault();
    const sucesso = await adicionarReserva("auditório");
    if (sucesso) {
        this.reset(); // Só reseta se for sucesso
        esconderSecao("secao_auditorio"); // nome direto
    }
});

document.getElementById("form_reuniao").addEventListener("submit", async function (event) {
    event.preventDefault();
    const sucesso = await adicionarReserva("reunião");
    if (sucesso) {
        this.reset(); // Só reseta se for sucesso
        esconderSecao("secao_reuniao"); // nome direto
    }
});

document.addEventListener('DOMContentLoaded', function () {
    carregarReservas("auditório");
    carregarReservas("reunião");
});
