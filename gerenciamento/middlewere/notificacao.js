const { Op } = require('sequelize');
const { Sequelize } = require("sequelize");
const Dizimo = require("../Financas/Dizimos");
const Gasto = require("../Financas/Despesas");
const Oferta = require("../Financas/Ofertas");
const Membro = require("../membro/Membro");
const { Connection } = require('puppeteer');

Connectionn = require("../database/database")

const contarNotificacoes = async (req, res, next) => {
    try {
        // 1. Total de Ofertas
        const totalOfertas = await Oferta.sum('valor') || 0;

        // 2. Total de Gastos com origem 'Ofertas'
        const totalGastosOfertas = await Gasto.sum('valor', {
            where: { origem: 'Ofertas' },
        }) || 0;

        // 3. Total de Dízimos
        const totalDizimos = await Dizimo.sum('valor') || 0;

        // 4. Total de Gastos com origem 'Dízimos'
        const totalGastosDizimos = await Gasto.sum('valor', {
            where: { origem: 'Dízimos' },
        }) || 0;

        // 5. Total de Gastos com origem 'Caixa Mãe'
        const totalGastosCaixaMae = await Gasto.sum('valor', {
            where: { origem: 'caixa_mae' },
        }) || 0;

        // 6. Total de Membros que não dizimaram por um mês ou mais
        const dataLimite = new Date(new Date() - 30 * 24 * 60 * 60 * 1000);
        const membrosSemDizimo = await Membro.findAll({
            where: {
                id: {
                    [Op.notIn]: Sequelize.literal(`(SELECT MembroId FROM Dizimos WHERE createdAt >= '${dataLimite.toISOString()}')`)
                }
            }
        });

        // Inicializa o contador de notificações
        let contadorNotificacoes = 0;

        // Lógica para incrementar o contador baseado nas condições
        if (totalGastosOfertas >= totalOfertas - 3000) {
            contadorNotificacoes++;
        }

        if (totalGastosDizimos >= totalDizimos - 3000) {
            contadorNotificacoes++;
        }

        if (totalGastosCaixaMae >= (totalOfertas + totalDizimos) - 3000) {
            contadorNotificacoes++;
        }

        // Conta os membros que não dizimaram
        if (membrosSemDizimo.length > 0) {
            contadorNotificacoes++;
        }

        // 7. Membros que mais estão dizimando (limitando a 5 membros)
        const membrosMaisDizimistas = await Connectionn.query(`
            SELECT Membros.nome, SUM(Dizimos.valor) AS totalDizimos
            FROM Membros
            LEFT JOIN Dizimos ON Membros.id = Dizimos.MembroId
            GROUP BY Membros.id
            ORDER BY totalDizimos DESC
            LIMIT 5;
        `);

        if (membrosMaisDizimistas[0].length > 0) {
            contadorNotificacoes++; // Notificação sobre membros que mais estão dizimando
        }

        // 8. Lembrete de Dízimos - apenas se estamos nos últimos dias do mês
        const diaAtual = new Date().getDate();
        if (diaAtual >= 25) {
            contadorNotificacoes++; // Lembrete de dízimos
        }

        // 9. Dízimos em Declínio
        const membrosDizimosDeclinados = await Membro.findAll({
            where: {
                id: {
                    [Op.notIn]: Sequelize.literal(`(SELECT MembroId FROM Dizimos WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 3 MONTH))`)
                }
            }
        });

        if (membrosDizimosDeclinados.length > 0) {
            contadorNotificacoes++; // Notificação sobre membros que não contribuíram
        }

        // Total de gastos versus total de contribuições (ofertas e dízimos)
        const totalContribuicoes = totalOfertas + totalDizimos;
        const totalGastos = totalGastosOfertas + totalGastosDizimos + totalGastosCaixaMae;

        if (totalGastos >= totalContribuicoes) {
            contadorNotificacoes++; // Notificação sobre gastos totais
        }

        // Armazene o contador no objeto `req` para uso posterior
        req.contadorNotificacoes = contadorNotificacoes;

        // Chame o próximo middleware
        next();
    } catch (error) {
        console.error('Erro ao contar notificações:', error);
        res.status(500).send('Erro ao contar notificações');
    }
};

module.exports = contarNotificacoes;
