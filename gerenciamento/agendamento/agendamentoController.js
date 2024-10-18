// routes/agendamentosRoutes.js
const express = require('express');
const router = express.Router();
const Clientes = require('../clientes/Clientes');
const Agendamentos = require("./Agendamento");
const Procedimentos = require('../procedimentos/Procedimentos');

router.get('/total-vendas', async (req, res) => {
    try {
        const { clienteId, period } = req.query;

        // Lógica para calcular o total de vendas com base nos agendamentos e procedimentos
        const totalVendas = await Clientes.sum('preco', {
            where: {
                id: clienteId // Filtre por cliente específico, se necessário
            },
            include: [
                {
                    model: Agendamentos,
                    include: [{ model: Procedimentos }]
                }
            ]
        });

        res.json({ totalVendas });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao calcular o total de vendas.' });
    }
});

module.exports = router;
