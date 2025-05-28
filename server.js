const express = require('express');
const mssql = require('mssql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Configuração da conexão
const dbConfig = {
    user: 'sa',
    password: 'Master@123',
    server: '172.16.0.171\\sqlexpress',
    database: 'PortalPerfipar',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

// POST: Inserir nova reserva
app.post('/api/reservas', async (req, res) => {
    const { nome, setor, descricao, data, horaInicio, horaTermino, sala } = req.body;

    function parseHora(horaStr) {
        // Se hora estiver no formato 'HH:mm:ss' ou 'HH:mm'
        const [h, m, s = 0] = horaStr.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m, s, 0);
        return date.toTimeString().substring(0, 8); // 'HH:mm:ss'
    }

    const horaInicioFormatada = parseHora(horaInicio);
    const horaTerminoFormatada = parseHora(horaTermino);

    console.log({ nome, setor, descricao, data, horaInicio, horaTermino, sala });
    console.log("Hora formatada:", parseHora(horaInicio), parseHora(horaTermino));

    try {
        const pool = await mssql.connect(dbConfig);

        const conflito = await pool.request()
            .input('data_reserva', mssql.Date, data)
            .input('sala', mssql.NVarChar, sala)
            .input('hora_inicio', mssql.VarChar, horaInicioFormatada)
            .input('hora_termino', mssql.VarChar, horaTerminoFormatada)
            .query(`
                SELECT * FROM Reservas
                WHERE sala = @sala
                  AND data_reserva = @data_reserva
                  AND (
                      (hora_inicio < @hora_termino AND hora_termino > @hora_inicio)
                  )
            `);

        if (conflito.recordset.length > 0) {
            return res.status(409).json({ error: 'Já existe uma reserva nesse horário.' });
        }

        await pool.request()
            .input('nome', mssql.NVarChar, nome)
            .input('setor', mssql.NVarChar, setor)
            .input('descricao', mssql.NVarChar, descricao)
            .input('data_reserva', mssql.Date, data)
            .input('hora_inicio', mssql.VarChar, horaInicioFormatada)
            .input('hora_termino', mssql.VarChar, horaTerminoFormatada)
            .input('sala', mssql.NVarChar, sala)
            .query(`
                INSERT INTO Reservas (nome, setor, descricao, data_reserva, hora_inicio, hora_termino, sala)
                VALUES (@nome, @setor, @descricao, @data_reserva, @hora_inicio, @hora_termino, @sala)
            `);

        res.status(201).json({ message: 'Reserva salva com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao salvar a reserva.' });
    }
});

// GET: Buscar reservas por sala
app.get('/api/reservas', async (req, res) => {
    const { sala } = req.query;
    
    if (!sala) {
        return res.status(400).json({ error: 'Parâmetro "sala" é obrigatório.' });
    }

    try {
        const pool = await mssql.connect(dbConfig);
        const result = await pool.request()
            .input('sala', mssql.NVarChar, sala)
            .query(`SELECT * FROM Reservas WHERE sala = @sala ORDER BY data_reserva, hora_inicio`);
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar reservas.' });
    }
});


// POST: Excluir reserva específica
app.post('/api/reservas/delete', async (req, res) => {
    const { nome, data, horaInicio, sala } = req.body;
    try {
        const pool = await mssql.connect(dbConfig);
        await pool.request()
            .input('nome', mssql.NVarChar, nome)
            .input('data_reserva', mssql.Date, data)
            .input('hora_inicio', mssql.Time, horaInicio)
            .input('sala', mssql.NVarChar, sala)
            .query(`
                DELETE FROM Reservas
                WHERE nome = @nome
                AND data_reserva = @data_reserva
                AND hora_inicio = @hora_inicio
                AND sala = @sala
            `);
        res.status(200).json({ message: 'Reserva excluída com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir reserva.' });
    }
});


// POST: Criar novo chamado
app.post('/api/chamados', async (req, res) => {
    const { nome, email, setor, descricao } = req.body;
    try {
        const pool = await mssql.connect(dbConfig);
        await pool.request()
            .input('nome', mssql.NVarChar, nome)
            .input('email', mssql.NVarChar, email)
            .input('setor', mssql.NVarChar, setor)
            .input('descricao', mssql.NVarChar, descricao)
            .input('_status', mssql.NVarChar, 'Aberto') // <- corrigido
            .query(`
                INSERT INTO Chamados (nome, email, setor, descricao, _status)
                VALUES (@nome, @email, @setor, @descricao, @_status)
            `);
        res.status(201).json({ message: 'Chamado enviado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao registrar chamado.' });
    }
});

// GET: Listar chamados
app.get('/api/chamados', async (req, res) => {
    try {
        const pool = await mssql.connect(dbConfig);
        const result = await pool.request().query(`SELECT * FROM Chamados ORDER BY id DESC`);
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar chamados.' });
    }
});

// POST: Atualizar status
app.post('/api/chamados/status', async (req, res) => {
    const { id, status } = req.body;
    try {
        const pool = await mssql.connect(dbConfig);
        await pool.request()
            .input('id', mssql.Int, id)
            .input('_status', mssql.NVarChar, status) // <- corrigido
            .query(`UPDATE Chamados SET _status = @_status WHERE id = @id`);
        res.status(200).json({ message: 'Status atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar status.' });
    }
});

// POST: Limpar chamados - Arquivar Fechados e Excluir Cancelados
app.post('/api/chamados/limpar', async (req, res) => {
    try {
        const pool = await mssql.connect(dbConfig);
        
        // 1. Arquivar apenas os Fechados
        await pool.request().query(`
            UPDATE Chamados
            SET _status = 'Arquivado'
            WHERE _status = 'Fechado'
        `);
        
        // 2. Excluir permanentemente os Cancelados
        await pool.request().query(`
            DELETE FROM Chamados
            WHERE _status = 'Cancelado'
        `);
        
        res.status(200).json({ 
            message: 'Operação concluída: Fechados arquivados e Cancelados excluídos.' 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao processar chamados.' });
    }
});

app.post('/api/chamados/fechar', async (req, res) => {
    const { id, status, solucao } = req.body;
    try {
        const pool = await mssql.connect(dbConfig);
        await pool.request()
            .input('id', mssql.Int, id)
            .input('status', mssql.NVarChar, status)
            .input('solucao', mssql.NVarChar, solucao)
            .query(`
                UPDATE Chamados
                SET _status = @status, solucao = @solucao
                WHERE id = @id
            `);
        res.status(200).json({ message: 'Chamado fechado com solução registrada.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao fechar chamado.' });
    }
});

// INICIAR SERVIDOR
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});