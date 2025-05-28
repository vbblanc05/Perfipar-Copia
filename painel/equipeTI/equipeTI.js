// Função para mostrar a seção de uma lista selecionada
function mostrarSecao(secao) {
    // Esconde todas as seções
    document.getElementById("chamados_requisitados").style.display = 'none';
    document.getElementById("chamados_arquivados").style.display = 'none';

    // Mostra apenas a seção escolhida
    document.getElementById(secao).style.display = 'block';

    carregarChamados(); // Ainda carrega os chamados
}


// Esconde a seção
function esconderSecao(secao) {
    document.getElementById(secao).style.display = 'none';
}

let chamadoParaExcluir = null;
let linhaParaRemover = null;
let chamadoAtualId = null;

// Carrega os chamados do banco quando a página é carregada
async function carregarChamados() {
    const table = document.getElementById('tab_suporte').getElementsByTagName('tbody')[0];
    table.innerHTML = ''; // Limpa a tabela

    try {
        const response = await fetch('http://localhost:3000/api/chamados');
        const chamados = await response.json();

        chamados
            .filter(chamado => chamado._status !== 'Arquivado')
            .sort((a, b) => a.id - b.id) // Ordena por ID
            .forEach(chamado => {
                adicionarChamadoNaTabela(chamado, table);
            });

    } catch (error) {
        console.error('Erro ao carregar chamados:', error);
        alert('Erro ao carregar chamados do servidor.');
    }
}

document.addEventListener('DOMContentLoaded', carregarChamados);

function mostrarModalConfirmacao(chamado, linha) {
    chamadoParaExcluir = chamado;
    linhaParaRemover = linha;
    document.getElementById("modalConfirmacao").style.display = "flex";
}

function fecharModal() {
    document.getElementById("modalConfirmacao").style.display = "none";
}

// Função para adicionar um chamado na tabela
function adicionarChamadoNaTabela(chamado, table) {
    const linha = table.insertRow();

    // Células existentes
    linha.insertCell(0).textContent = chamado.nome;
    linha.insertCell(1).textContent = chamado.email;
    linha.insertCell(2).textContent = chamado.setor;
    linha.insertCell(3).textContent = chamado.descricao;

    // Célula de status
    const statusCell = linha.insertCell(4);
    const select = document.createElement('select');
    select.classList.add('status');
    
    const statusOptions = ["Aberto", "Iniciado", "Cancelado", "Fechado"];
    const statusColors = {
        "Aberto": "#28a745",
        "Iniciado": "#ffc107",
        "Cancelado": "#dc3545",
        "Fechado": "#6c757d"
    };

    statusOptions.forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        if (chamado._status === status) option.selected = true;
        select.appendChild(option);
    });

    function atualizarCorDeFundo() {
        select.style.backgroundColor = statusColors[select.value] || '#0072be';
    }
    atualizarCorDeFundo();

    select.addEventListener('change', async function() {
        if (select.value === "Fechado") {
            abrirModalSolucao(chamado.id);
            return; // Não atualiza ainda - espera a solução
        }
        
        try {
            const response = await fetch('http://localhost:3000/api/chamados/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: chamado.id, status: select.value })
            });

            if (!response.ok) throw new Error('Erro ao atualizar status.');
            
            atualizarCorDeFundo();
            carregarChamados(); // Recarrega para atualizar a interface
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            select.value = chamado._status; // Reverte a seleção
        }
    });

    statusCell.appendChild(select);

    // Nova célula para solução
    const solucaoCell = linha.insertCell(5);
    if (chamado.solucao) {
        solucaoCell.textContent = chamado.solucao;
    } else if (chamado._status === "Fechado") {
        const btnSolucao = document.createElement('button');
        btnSolucao.textContent = "Registrar Solução";
        btnSolucao.classList.add('btn-solucao');
        btnSolucao.addEventListener('click', () => abrirModalSolucao(chamado.id));
        solucaoCell.appendChild(btnSolucao);
    } else {
        solucaoCell.textContent = "N/A";
    }
}

// Modal controle
function abrirModalLimparChamados() {
    document.getElementById("modalConfirmacao").style.display = "flex";
}

function fecharModal() {
    document.getElementById("modalConfirmacao").style.display = "none";
}

document.getElementById("btn_limpar").addEventListener("click", abrirModalLimparChamados);

document.getElementById("btnConfirmarExclusao").addEventListener("click", async function () {
    try {
        const response = await fetch('http://localhost:3000/api/chamados/limpar', {
            method: 'POST'
        });

        if (response.ok) {
            // Remove visualmente apenas as linhas com status Fechado ou Cancelado
            const linhas = document.querySelectorAll("#tab_suporte tbody tr");
            
            linhas.forEach(linha => {
                const select = linha.querySelector("select");
                const status = select?.value;
                
                if (status === "Fechado" || status === "Cancelado") {
                    linha.classList.add("fade-out");
                    setTimeout(() => linha.remove(), 500);
                }
            });

            fecharModal();
            // Recarrega os chamados para garantir sincronização
            setTimeout(carregarChamados, 600); 
        } else {
            alert("Erro ao processar chamados.");
        }
    } catch (error) {
        console.error("Erro:", error);
        alert("Erro de conexão ao processar chamados.");
    }
});

// Atualize a função abrirModalSolucao para pré-carregar soluções existentes
function abrirModalSolucao(id, solucaoExistente = '') {
    chamadoAtualId = id;
    document.getElementById("textoSolucao").value = solucaoExistente;
    document.getElementById("modalSolucao").style.display = "flex";
}

function fecharModalSolucao() {
    chamadoAtualId = null;
    document.getElementById("modalSolucao").style.display = "none";
}

document.getElementById("btnSalvarSolucao").addEventListener("click", async () => {
    const solucao = document.getElementById("textoSolucao").value.trim();
    if (!solucao) {
        alert("Por favor, descreva a solução aplicada.");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/chamados/fechar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: chamadoAtualId,
                status: "Fechado",
                solucao: solucao
            })
        });

        if (!response.ok) throw new Error('Erro ao salvar solução');

        fecharModalSolucao();
        carregarChamados(); // Recarrega a tabela
    } catch (error) {
        console.error("Erro ao salvar solução:", error);
        alert("Erro ao registrar a solução.");
    }
});