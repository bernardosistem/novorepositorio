const { Op } = require('sequelize');
const Dizimo = require("../Financas/Dizimos");
const Despesas = require("../Financas/Despesas");
const Oferta = require("../Financas/Ofertas");
const Membro = require("../membro/Membro");
const OfertaComunity = require("../comunity/OfertaComunity");
const DizimoComunity = require("../comunity/DizimoComunity");
const DespesaComunity = require("../comunity/DespesaComunity");
const MembroComunity = require("../comunity/MembroComunity");

async function contarNotificacoes(req, res, next) {
    let notificacoes = 0;

    const comunityId = req.session.utilizador?.comunityId;

    // Se comunityId for undefined, setar notificações para 0 e retornar
    if (!comunityId) {
        req.notificacoes = notificacoes;
        return next(); // Seguir para o próximo middleware
    }

    // 1. Notificações para Ofertas
    const totalOfertas = await Oferta.sum('valor', {
        where: {
            id: {
                [Op.in]: await OfertaComunity.findAll({
                    where: { ComunityId: comunityId },
                    attributes: ['OfertaId']
                }).then(results => results.map(result => result.OfertaId))
            }
        }
    });

    const despesasOfertas = await Despesas.sum('valor', {
        where: {
            origem: 'ofertas',
            id: {
                [Op.in]: await DespesaComunity.findAll({
                    where: { ComunityId: comunityId },
                    attributes: ['gastoId']
                }).then(results => results.map(result => result.DespesaId))
            }
        }
    });

    if (despesasOfertas >= totalOfertas) {
        notificacoes++;
    } else if (despesasOfertas >= totalOfertas * 0.9) {
        notificacoes++;
    }

    // 2. Notificações para Dízimos
    const totalDizimos = await Dizimo.sum('valor', {
        where: {
            id: {
                [Op.in]: await DizimoComunity.findAll({
                    where: { ComunityId: comunityId },
                    attributes: ['DizimoId']
                }).then(results => results.map(result => result.DizimoId))
            }
        }
    });

    const despesasDizimos = await Despesas.sum('valor', {
        where: {
            origem: 'dizimos',
            id: {
                [Op.in]: await DespesaComunity.findAll({
                    where: { ComunityId: comunityId },
                    attributes: ['gastoId']
                }).then(results => results.map(result => result.DespesaId))
            }
        }
    });

    if (despesasDizimos >= totalDizimos) {
        notificacoes++;
    } else if (despesasDizimos >= totalDizimos * 0.9) {
        notificacoes++;
    }

    // 3. Notificação para a Caixa Mãe
    const totalCaixaMae = totalOfertas + totalDizimos; // Somar os totais já obtidos

    const despesasCaixaMae = await Despesas.sum('valor', {
        where: {
            origem: 'caixa_mae',
            id: {
                [Op.in]: await DespesaComunity.findAll({
                    where: { ComunityId: comunityId },
                    attributes: ['gastoId']
                }).then(results => results.map(result => result.DespesaId))
            }
        }
    });

    if (despesasCaixaMae >= totalCaixaMae) {
        notificacoes++;
    } else if (despesasCaixaMae >= totalCaixaMae * 0.9) {
        notificacoes++;
    }

    // 4. Notificações para Membros
    const membros = await Membro.findAll({
        include: [{
            model: MembroComunity,
            where: { ComunityId: comunityId }
        }]
    });

    for (const membro of membros) {
        const totalDizimosMembro = await Dizimo.count({
            where: {
                MembroId: membro.id,
                createdAt: {
                    [Op.gte]: new Date(new Date() - 4 * 30 * 24 * 60 * 60 * 1000) // últimos 4 meses
                },
            },
        });

        if (totalDizimosMembro === 0) {
            notificacoes++;
        }
    }

    // 5. Notificações para membros que dízimam regularmente
    const membrosAtivos = await Membro.findAll({
        include: [{
            model: MembroComunity,
            where: { ComunityId: comunityId }
        }]
    });

    for (const membro of membrosAtivos) {
        const dizimosRegulares = await Dizimo.count({
            where: {
                MembroId: membro.id,
                createdAt: {
                    [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) // últimos 30 dias
                },
            },
        });

        if (dizimosRegulares > 0) {
            notificacoes++;
        }
    }

    // Armazena o total de notificações na requisição
    req.notificacoes = notificacoes;

    next();
}

module.exports = contarNotificacoes;
