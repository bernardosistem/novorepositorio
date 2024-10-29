// membroController.js
const express = require('express');
const router = express.Router();
const verificarStatusAprovado  = require("../middlewere/userPendentes");
const isAdmin = require("../middlewere/isadmin");
const mysql = require('mysql2/promise');

const contarNotificacoes = require("../middlewere/notificacao");


const  OfertaComunity  = require('../comunity/OfertaComunity'); // 

const MembroComunity = require("../comunity/MembroComunity");

const  DespesaComunity = require('../comunity/DespesaComunity'); // Certifique-se de importar corretamente os modelos

const  DizimoComunity  = require('../comunity/DizimoComunity'); 


const Enderecos =require("../DadosMembros/Endereco")
const Dizimos = require('./Dizimos');
const Ofertas = require('./Ofertas');

const Despesas = require('./Despesas');

const Cuotas = require("../Financas/Cuotas");

const Contatos =require("../DadosMembros/Contactos")
const Membros = require("../membro/Membro");

const DadosEclesiais = require("../DadosMembros/Eclesiais");



const { Op } = require('sequelize');


const sequelize = require("sequelize");

router.get('/dizimos-pagina', contarNotificacoes, verificarStatusAprovado, async (req, res) => {
    try {
        // Verificar se a comunidade está na sessão
        const comunidadeId = req.session.utilizador?.comunityId;
        
        if (!comunidadeId) {
            // Renderizar uma página informativa
            return res.render('AcessoNegado/NoComunity');
        }

        // Buscar membros que pertencem à comunidade da sessão
        const membros = await MembroComunity.findAll({
            where: { ComunityId: comunidadeId }, // Filtrar apenas pelos membros da comunidade
            attributes: ['MembroId'], // Obter apenas o ID do membro
            raw: true // Para retornar um objeto simples
        });

        // Extrair os IDs dos membros
        const membroIds = membros.map(membro => membro.MembroId);

        // Buscar os detalhes dos membros
        const membrosDetalhados = await Membros.findAll({
            where: { id: membroIds }, // Filtrar apenas pelos IDs dos membros encontrados
            attributes: ['id', 'nome'], // Obter apenas id e nome dos membros
        });

        // Renderizar a página com os membros filtrados
        res.render("entradas/Dizimos", { membros: membrosDetalhados, notificacoes:  req.notificacoes });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao buscar membros');
    }
});




// multerConfig.js
const multer = require('multer');


// Configuração do armazenamento do multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Pasta onde os arquivos serão salvos
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Nome único para o arquivo
    }
});

// Filtrar tipos de arquivos permitidos
const fileFilter = (req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png|gif/; // Tipos permitidos
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Apenas arquivos de imagem e PDF são permitidos.'));
};

// Configuração do multer
const upload = multer({ storage: storage, fileFilter: fileFilter });

module.exports = upload;



router.post('/criar-dizimo', async (req, res) => {
    try {
        const { valor, MembroId } = req.body; // Captura os dados do formulário

        // Verifica se o valor foi preenchido
        if (!valor) {
            throw new Error("Valor é obrigatório.");
        }

        // Cria um novo dízimo
        const dizimo = await Dizimos.create({
            valor: parseFloat(valor), // Certifique-se de que o valor é um número
            MembroId: MembroId // O ID do dizimista
        });

        // Pega o ComunityId da sessão
        const comunityId = req.session.utilizador?.comunityId; // Pega o ID da comunidade logada

        if (comunityId) {
            // Associa o dízimo à comunidade
            await DizimoComunity.create({
                DizimoId: dizimo.id,
                ComunityId: comunityId
            });
        } else {
            throw new Error("Comunidade não encontrada na sessão.");
        }

        // Busque todos os membros novamente para renderizar
        const membros = await Membros.findAll();

        // Renderiza a página de dízimos com sucesso
        res.render("entradas/dizimos", { membros });
    } catch (error) {
        console.error(error);
        // Busque todos os membros novamente para renderizar
        const membros = await Membros.findAll();
        res.status(400).json({ error: error.message, membros });
    }
});



// Rota para criar uma nova oferta
router.post('/criar-oferta', async (req, res) => {
    try {
        const { valor, data } = req.body;

        if (!valor) {
            throw new Error("Valor é obrigatório.");
        }

        // Cria a oferta
        const oferta = await Ofertas.create({
            valor: parseFloat(valor),
            data: data
        });

        // Pega o ComunityId da sessão
        const comunityId = req.session.utilizador?.comunityId; // Pega o ID da comunidade logada

        if (comunityId) {
            // Associa a oferta à comunidade
            await OfertaComunity.create({
                OfertaId: oferta.id,
                ComunityId: comunityId
            });
        } else {
            
        
            // Renderizar uma página informativa
            return res.render('AcessoNegado/NoComunity');
        
        }

        // Renderiza a página de sucesso
        res.render('entradas/sucesso', {
            success: 'Oferta cadastrada com sucesso!',
        });
    } catch (error) {
        console.error(error);
        res.render("entradas/Ofertas", {
            error: error.message,
        });
    }
});







router.get('/ofertas-pagina', contarNotificacoes, verificarStatusAprovado, (req, res) => {
   

    res.render("entradas/Ofertas", {notificacoes:  req.notificacoes});

    
});





router.get('/relatorios', contarNotificacoes, verificarStatusAprovado,isAdmin, async (req, res) => {
    try {
      
      const generos = await Membros.findAll({
        attributes: ['genero'],
        group: ['genero'],
      });
  
      const funcoes = await DadosEclesiais.findAll({
        attributes: ['funcao'],
        group: ['funcao'],
      });
      
      const categorias = await DadosEclesiais.findAll({
        attributes: ['categoria'],
        group: ['categoria'],
      });
      
  
      res.render('Relatorios/Membros', {
        funcoes: funcoes.map(f => f.funcao),
        generos: generos.map(g => g.genero),
        categorias: categorias.map(c => c.categoria),
        notificacoes:  req.notificacoes
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Erro ao carregar relatórios');
    }
  });




 
  
// Supondo que você use express-session
const session = require('express-session');

router.post('/gerar-relatorio', async (req, res) => {
    const { generos, funcoes, categorias } = req.body;

    try {
        // Buscar membros com base no gênero
        const membros = await Membros.findAll({
            where: {
                ...(generos.length > 0 && { genero: generos }),
            },
        });

        // Se houver funções ou categorias, filtrar os dados eclesiais
        const membrosFiltrados = await Promise.all(membros.map(async (membro) => {
            const dadosEclesiais = await DadosEclesiais.findAll({
                where: {
                    MembroId: membro.id,
                    ...(funcoes.length > 0 && { funcao: funcoes }),
                    ...(categorias.length > 0 && { categoria: categorias }),
                },
            });

            // Se houver dados eclesiais correspondentes, retorne o membro com as funções/categorias
            if (dadosEclesiais.length > 0) {
                return {
                    ...membro.get(),
                    funcao: dadosEclesiais.map(d => d.funcao),
                    categoria: dadosEclesiais.map(d => d.categoria),
                };
            }
            return null; // Retorna null se não houver dados correspondentes
        }));

        // Filtrar membros nulos
        const membrosResultados = membrosFiltrados.filter(m => m !== null);

        // Armazenar os resultados na sessão
        req.session.membrosResultados = membrosResultados;

        // Redirecionar para a página de relatório
        res.redirect('/relatorio-gerado');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao gerar relatório');
    }
});

// Rota para renderizar o relatório gerado
router.get('/relatorio-gerado',contarNotificacoes, (req, res) => {
    const membros = req.session.membrosResultados || [];
    res.render('Relatorios/relatorioGeradoMembros', { membros, notificacoes:  req.notificacoes });
});



// Rota para renderizar o relatório gerado
router.get('/financas-page', contarNotificacoes, verificarStatusAprovado, isAdmin, (req, res) => {
    
    res.render('layout/financapage', {notificacoes:  req.notificacoes});
});




// Rota para renderizar o relatório gerado
router.get('/ofertas-page', contarNotificacoes, async (req, res) => {
    try {
        // Verificar se a comunidade está na sessão
const comunityId = req.session.utilizador?.comunityId;
if (!comunityId) {
    // Renderizar uma página informativa
    return res.render('AcessoNegado/NoComunity');
}

        // Buscando todas as ofertas relacionadas à comunidade
        const ofertasComunity = await OfertaComunity.findAll({
            where: { ComunityId: comunityId }
        });

        // Extraindo IDs das ofertas
        const ofertaIds = ofertasComunity.map(oferta => oferta.OfertaId);
        const ofertas = await Ofertas.findAll({
            where: { id: ofertaIds }
        });

        // Calculando o total de ofertas
        const totalOfertas = ofertas.reduce((total, oferta) => total + oferta.valor, 0);

        // Buscando todas as despesas relacionadas à comunidade com origem 'ofertas'
        const despesasComunity = await DespesaComunity.findAll({
            where: { ComunityId: comunityId }
        });

        // Extraindo IDs das despesas
        const despesaIds = despesasComunity.map(despesa => despesa.gastoId);
        const despesas = await Despesas.findAll({
            where: { id: despesaIds, origem: 'ofertas' } // Filtra despesas cuja origem é 'ofertas'
        });  

        // Calculando o total de despesas
        const totalDespesasOfertas = despesas.reduce((total, despesa) => total + despesa.valor, 0);

        // Calculando o saldo entre ofertas e despesas
        const saldo = totalOfertas - totalDespesasOfertas;

        // Obtendo as ofertas por mês do ano corrente para a comunidade
        const ofertasPorMes = await OfertaComunity.findAll({
            attributes: [
                [sequelize.fn('MONTH', sequelize.col('createdAt')), 'mes'],
                [sequelize.fn('SUM', sequelize.col('OfertaId')), 'total'] // Supondo que 'OfertaId' seja um campo relevante
            ],
            where: { ComunityId: comunityId },
            group: [sequelize.fn('MONTH', sequelize.col('createdAt'))],
            order: [[sequelize.fn('MONTH', sequelize.col('createdAt')), 'ASC']]
        });

        // Preparando os dados para o gráfico
        const valoresPorMes = Array(12).fill(0);
        ofertasPorMes.forEach(oferta => {
            const mes = oferta.get('mes');
            const total = oferta.get('total');
            valoresPorMes[mes - 1] = total;
        });

        // Renderizando a página com os dados
        res.render('layout/ofertas', {
            totalOfertas,
            totalDespesasOfertas,
            saldo,
            valoresPorMes,
            notificacoes:  req.notificacoes
        });
    } catch (error) {
        console.error('Erro ao buscar as ofertas:', error);
        res.status(500).send('Erro ao buscar os dados das ofertas');
    }
});



router.post("/api/relatorios/estatisticos", async (req, res) => {
    const { options } = req.body;

    try {
        let resultados = {
            filiais: [],
            generos: [],
            funcoes: []
        };

        // Realizar as consultas conforme as opções selecionadas
        if (options.includes("membrosPorFiliais")) {
            const filialCounts = await DadosEclesiais.findAll({
                attributes: ['filiais', [sequelize.fn('COUNT', sequelize.col('MembroId')), 'total']],
                group: ['filiais']
            });
            resultados.filiais = filialCounts.map(f => f.toJSON());
        }

        if (options.includes("membrosPorGenero")) {
            const generos = await Membros.findAll({
                attributes: ['genero', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
                group: ['genero']
            });
            resultados.generos = generos.map(g => g.toJSON());
        }

        if (options.includes("membrosPorFuncao")) {
            const funcaoCounts = await DadosEclesiais.findAll({
                attributes: ['funcao', [sequelize.fn('COUNT', sequelize.col('MembroId')), 'total']],
                group: ['funcao']
            });
            resultados.funcoes = funcaoCounts.map(f => f.toJSON());
        }

        // Armazenar resultados na sessão e redirecionar
        req.session.resultadosEstatisticos = resultados;

        // Retornar sucesso
        return res.json({ success: true });
    } catch (error) {
        console.error("Erro ao buscar dados:", error);
        return res.status(500).json({ message: "Erro ao buscar dados." });
    }
});


router.get('/relatorio-estatistico', contarNotificacoes, async (req, res) => {
    const resultadosEstatisticos = req.session.resultadosEstatisticos || {};
    console.log(resultadosEstatisticos); // Verifique a estrutura do objeto aqui

    const generos = await Membros.findAll({
        attributes: ['genero', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
        group: 'genero',
    });

    const funcoes = await DadosEclesiais.findAll({
        attributes: ['funcao', [sequelize.fn('COUNT', sequelize.col('MembroId')), 'total']],
        group: 'funcao',
    });

    const categorias = await DadosEclesiais.findAll({
        attributes: ['categoria', [sequelize.fn('COUNT', sequelize.col('MembroId')), 'total']],
        group: 'categoria',
    });

    const filiais = await DadosEclesiais.findAll({
        attributes: ['filiais', [sequelize.fn('COUNT', sequelize.col('MembroId')), 'total']],
        group: 'filiais',
    });

    // Buscar todos os departamentos
    const departamentos = await Departamentos.findAll({
        attributes: ['id', 'nomeDepartamento']
    });

    // Calcular o total de membros em cada departamento
    const membrosPorDepartamento = await Promise.all(
        departamentos.map(async (departamento) => {
            const total = await DepartamentoMembros.count({
                where: { departamentoId: departamento.id }
            });
            return {
                nomeDepartamento: departamento.nomeDepartamento,
                total
            };
        })
    );

    console.log({
        generos,
        funcoes,
        categorias,
        filiais,
        membrosPorDepartamento, // Novo console para ver os resultados dos departamentos
    });

    res.render('Relatorios/total', { 
        resultadosEstatisticos,
        generos,
        funcoes,
        categorias,
        filiais,
        membrosPorDepartamento, 
        notificacoes:  req.notificacoes
        // Passar os resultados dos departamentos para o render
    });
});




// Importando os modelos (ajuste o caminho conforme necessário)
const Departamentos = require('../DadosMembros/Departamento');
const DepartamentoMembros = require('../DadosMembros/DepartamentoMembro');









router.post('/api/membros', async (req, res) => {
    const { tipo, valor } = req.body;

    try {
        let membros = [];

        if (tipo === 'filial') {
            const dadosEclesiais = await DadosEclesiais.findAll({
                where: { filiais: valor },
                attributes: ['MembroId']
            });
            const membroIds = dadosEclesiais.map(d => d.MembroId);
            membros = await Membros.findAll({ where: { id: membroIds } });
        } else if (tipo === 'genero') {
            membros = await Membros.findAll({ where: { genero: valor } });
        } else if (tipo === 'funcao') {
            const dadosEclesiais = await DadosEclesiais.findAll({
                where: { funcao: valor },
                attributes: ['MembroId']
            });
            const membroIds = dadosEclesiais.map(d => d.MembroId);
            membros = await Membros.findAll({ where: { id: membroIds } });
        } else if (tipo === 'departamento') {
            // Obter IDs dos membros associados ao departamento especificado
            const departamentoMembros = await DepartamentoMembros.findAll({
                where: { departamentoId: valor },
                attributes: ['MembroId']
            });
            const membroIds = departamentoMembros.map(d => d.MembroId);
            // Buscar os membros usando os IDs obtidos
            membros = await Membros.findAll({ where: { id: membroIds } });
        }

        return res.json(membros);
    } catch (error) {
        console.error("Erro ao buscar membros:", error);
        return res.status(500).json({ message: "Erro ao buscar membros." });
    }
});














router.post('/ofertas/total', contarNotificacoes, async (req, res) => {
    const { periodo, despesaInserida } = req.body;

    let startDate;
    let endDate = new Date(); // Data atual

    const comunityId = req.session.utilizador?.comunityId;
if (!comunityId) {
    // Renderizar uma página informativa
    return res.render('AcessoNegado/NoComunity');
}

    // Definindo a data inicial e final com base no período selecionado
    switch (periodo) {
        case 'dia':
            startDate = new Date(endDate);
            startDate.setHours(0, 0, 0, 0); // Início do dia de hoje
            endDate.setHours(23, 59, 59, 999); // Final do dia de hoje
            break;
        case 'semana':
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 7); // 7 dias atrás
            endDate.setHours(23, 59, 59, 999); // Final do último dia da semana
            break;
        case 'mes':
            startDate = new Date(endDate);
            startDate.setMonth(endDate.getMonth() - 1); // 1 mês atrás
            endDate.setHours(23, 59, 59, 999); // Final do mês atual
            break;
        case 'trimestre':
            startDate = new Date(endDate);
            startDate.setMonth(endDate.getMonth() - 3); // 3 meses atrás
            endDate.setHours(23, 59, 59, 999); // Final do trimestre atual
            break;
        case 'ano':
            startDate = new Date(endDate);
            startDate.setFullYear(endDate.getFullYear() - 1); // 1 ano atrás
            endDate.setHours(23, 59, 59, 999); // Final do ano atual
            break;
        default:
            return res.status(400).json({ message: 'Período inválido' });
    }

    try {
        // Buscar todas as associações na tabela intermediária "OfertaComunity" que correspondem à Comunidade logada
        const ofertaComunityEntries = await OfertaComunity.findAll({
            where: { ComunityId: comunityId }
        });

        // Extrair os IDs das ofertas relacionadas à comunidade
        const ofertaIds = ofertaComunityEntries.map(entry => entry.OfertaId);

        // Buscar as ofertas dentro do período especificado usando os IDs extraídos
        const totalOfertas = await Ofertas.sum('valor', {
            where: {
                id: ofertaIds,
                createdAt: {
                    [Op.gte]: startDate,
                    [Op.lt]: endDate
                }
            }
        });

        // Buscar o número total de ofertas
        const numeroTotalOfertas = await Ofertas.count({
            where: {
                id: ofertaIds,
                createdAt: {
                    [Op.gte]: startDate,
                    [Op.lt]: endDate
                }
            }
        });

        // Calculando a média de ofertas
        const mediaOfertas = numeroTotalOfertas > 0 ? (totalOfertas / numeroTotalOfertas) : 0;

        // Se o campo "despesaInserida" estiver preenchido, incluir as despesas filtradas pela comunidade via a tabela intermediária "DespesaComunity"
        let totalDespesas = 0;
        if (despesaInserida) {
            // Buscar todas as associações na tabela intermediária "DespesaComunity" que correspondem à Comunidade logada
            const despesaComunityEntries = await DespesaComunity.findAll({
                where: { ComunityId: comunityId }
            });

            // Extrair os IDs das despesas relacionadas à comunidade
            const despesaIds = despesaComunityEntries.map(entry => entry.gastoId);

            // Buscar as despesas dentro do período especificado usando os IDs extraídos
            totalDespesas = await Despesas.sum('valor', {
                where: {
                    id: despesaIds,
                    origem: 'ofertas', // Filtrando despesas cuja origem é 'ofertas'
                    createdAt: {
                        [Op.gte]: startDate,
                        [Op.lt]: endDate
                    }
                }
            });
        }

        // Calculando a variação em relação ao período anterior, se aplicável
        const periodoAnterior = new Date(startDate);
        periodoAnterior.setFullYear(periodoAnterior.getFullYear() - 1); // Ajustar conforme o período selecionado

        // Buscar ofertas do período anterior
        const totalOfertasAnterior = await Ofertas.sum('valor', {
            where: {
                id: ofertaIds,
                createdAt: {
                    [Op.gte]: periodoAnterior,
                    [Op.lt]: endDate // Ajustar para o mesmo final do período atual
                }
            }
        });

        const variacao = totalOfertasAnterior ? ((totalOfertas - totalOfertasAnterior) / totalOfertasAnterior) * 100 : null;

        // Calculando o total final subtraindo as despesas, se aplicável
        const totalFinal = (totalOfertas || 0) - (totalDespesas || 0);

        // Renderiza o template EJS com as variáveis
        res.render('Relatorios/ofertas', {
            totalOfertas, // Adicionando o total de ofertas para exibição
            totalFinal,
            numeroTotalOfertas,
            mediaOfertas,
            variacao,
            startDate,
            endDate,
            totalDespesas,
            periodo,
            notificacoes:  req.notificacoes
        });
    } catch (error) {
        console.error('Erro ao buscar ofertas:', error);
        return res.status(500).json({ message: 'Erro ao buscar ofertas' });
    }
});


  
 

  
const fs = require('fs');
const pdf = require('html-pdf');
const path = require('path');

// Rota para gerar e salvar o PDF
router.post('/generate-pdf', (req, res) => {
    const htmlContent = req.body.html; // HTML enviado do frontend
    const options = { format: 'Letter' };

    pdf.create(htmlContent, options).toFile(path.join(__dirname, 'public', 'relatorio_ofertas.pdf'), (err, result) => {
        if (err) return res.status(500).send(err);

        // Retorna a URL do PDF gerado
        res.json({ url: `/relatorio_ofertas.pdf` });
    });
});









router.get('/dizimos-tabela', contarNotificacoes, async (req, res) => {
    try {
        
        const comunidadeId = req.session.utilizador?.comunityId;

        if (!comunidadeId) {
            // Renderizar uma página informativa
            return res.render('AcessoNegado/NoComunity');
        }
        // Buscar os membros que pertencem à comunidade da sessão
        const membros = await MembroComunity.findAll({
            where: { ComunityId: comunidadeId }, // Filtrar apenas pelos membros da comunidade
            attributes: ['MembroId'], // Obter apenas o ID do membro
            raw: true // Para retornar um objeto simples
        });

        // Extrair os IDs dos membros
        const membroIds = membros.map(membro => membro.MembroId);

        // Buscar os 10 dízimos mais recentes dos membros filtrados, incluindo os nomes dos membros
        const dizimosRecentes = await Dizimos.findAll({
            where: { MembroId: membroIds }, // Filtrar dízimos pelos IDs dos membros encontrados
            limit: 10, // Limitar para os 10 dízimos mais recentes
            order: [['createdAt', 'DESC']], // Ordenar pela data de criação, do mais recente para o mais antigo
            include: [
                {
                    model: Membros, // Incluir dados do membro
                    attributes: ['nome'], // Selecionar apenas o nome do membro
                }
            ],
            raw: true // Para retornar um objeto simples
        });

        // Preparar dados para a tabela
        const recentDizimos = dizimosRecentes.map(dizimo => ({
            valor: dizimo.valor,
            data: new Date(dizimo.createdAt).toLocaleDateString('pt-BR'), // Formatar a data
            membro: dizimo['Membro.nome'] // Acessar o nome do membro através do include
        }));

        // Renderizar a página EJS com os dados
        res.render('layout/dizimosTabela', { recentDizimos, notificacoes:  req.notificacoes });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar dados dos dízimos');
    }
});



router.get('/grafico-dizimo-dizimista', contarNotificacoes, async (req, res) => {
    try {
        

        const comunidadeId = req.session.utilizador?.comunityId;

        if (!comunidadeId) {
            // Renderizar uma página informativa
            return res.render('AcessoNegado/NoComunity');
        }

        // Obter o ano atual
        const anoAtual = new Date().getFullYear();

        // Buscar todos os membros da comunidade
        const membrosDaComunidade = await MembroComunity.findAll({
            where: { ComunityId: comunidadeId },
            attributes: ['MembroId'],
            raw: true
        });

        // Extrair os IDs dos membros
        const membroIds = membrosDaComunidade.map(membro => membro.MembroId);

        // Obter os totais de dízimos por membro do ano corrente
        const dizimosTotais = await Dizimos.findAll({
            where: {
                MembroId: membroIds, // Filtrar pelos IDs dos membros
                createdAt: {
                    [Op.gte]: new Date(`${anoAtual}-01-01T00:00:00Z`), // A partir do primeiro dia do ano corrente
                    [Op.lt]: new Date(`${anoAtual + 1}-01-01T00:00:00Z`) // Até o último dia do ano corrente
                }
            },
            attributes: [
                'MembroId',
                [sequelize.fn('SUM', sequelize.col('valor')), 'totalDizimos']
            ],
            group: ['MembroId'],
            order: [[sequelize.literal('totalDizimos'), 'DESC']], // Ordenar pelo total
            limit: 10,
            raw: true // Para retornar um objeto simples
        });

        // Criar um objeto de totais de dízimos por membro
        const totalPorMembro = {};
        dizimosTotais.forEach(dizimo => {
            totalPorMembro[dizimo.MembroId] = dizimo.totalDizimos;
        });

        // Buscar os membros correspondentes aos que têm dízimos
        const membros = await Membros.findAll({
            where: { id: Object.keys(totalPorMembro) }, // Filtrar apenas os membros que têm dízimos
            attributes: ['id', 'nome'], // Obter apenas id e nome dos membros
        });

        // Mapear os membros para incluir o total de dízimos
        const membrosComDizimos = membros.map(membro => ({
            nome: membro.nome,
            totalDizimos: totalPorMembro[membro.id] || 0 // Se não houver dízimos, assume 0
        }));

        // Renderizar a página EJS com os dados
        res.render('layout/GraficoDizimoDizimista', { membros: membrosComDizimos, notificacoes:  req.notificacoes });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar dados dos dízimos');
    }
});





// Rota para exibir o gráfico de dízimos
router.get('/dizimos-dashboard', contarNotificacoes, async (req, res) => {
    try {
        

        const comunidadeId = req.session.utilizador?.comunityId;

        if (!comunidadeId) {
            // Renderizar uma página informativa
            return res.render('AcessoNegado/NoComunity');
        }

        // Buscar todos os registros de dízimos relacionados à comunidade atual
        const dizimosComunity = await DizimoComunity.findAll({
            where: { ComunityId: comunidadeId }
        });

        // Obter os IDs dos dízimos
        const dizimoIds = dizimosComunity.map(item => item.DizimoId);

        // Buscar os dízimos usando os IDs encontrados
        const dizimos = await Dizimos.findAll({
            where: {
                id: dizimoIds
            }
        });

        // Mapeamento dos meses
        const nomesDosMeses = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];

        // Pegar o ano atual
        const anoCorrente = new Date().getFullYear();

        // Agrupar os valores por mês apenas do ano corrente
        const valoresPorMes = Array(12).fill(0);

        dizimos.forEach(dizimo => {
            const dataDizimo = new Date(dizimo.createdAt);
            const anoDizimo = dataDizimo.getFullYear();
            const mes = dataDizimo.getMonth(); // Retorna o índice do mês (0-11)

            // Considerar apenas os dízimos do ano corrente
            if (anoDizimo === anoCorrente) {
                valoresPorMes[mes] += dizimo.valor;
            }
        });

        // Preparar os dados para o gráfico
        const labels = nomesDosMeses;
        const valores = valoresPorMes;

        // Renderizar a página com os dados do gráfico
        res.render('layout/dizimos', { labels, valores, notificacoes:  req.notificacoes });
    } catch (error) {
        console.error('Erro ao buscar os dízimos:', error);
        res.status(500).send('Erro ao carregar o dashboard');
    }
});




// Rota para visualizar os dízimos
router.get('/dizimos-choose-preview', contarNotificacoes, async (req, res) => {
    try {
        

        const comunidadeId = req.session.utilizador?.comunityId;

        if (!comunidadeId) {
            // Renderizar uma página informativa
            return res.render('AcessoNegado/NoComunity');
        }
        // Buscar todos os dízimos relacionados à comunidade atual
        const dizimosComunity = await DizimoComunity.findAll({
            where: { ComunityId: comunidadeId }
        });

        // Obter os IDs dos dízimos
        const dizimoIds = dizimosComunity.map(item => item.DizimoId);

        // Buscar os dízimos usando os IDs encontrados
        const dizimos = await Dizimos.findAll({
            where: {
                id: dizimoIds
            }
        });

        // Calcular o total de dízimos
        const totalDizimos = dizimos.reduce((total, item) => total + item.valor, 0);

        // Filtrar os dízimos do ano corrente
        const totalDizimosAno = dizimos
            .filter(item => new Date(item.createdAt).getFullYear() === new Date().getFullYear())
            .reduce((total, item) => total + item.valor, 0);

        // Buscar todas as despesas relacionadas à comunidade atual
        const despesasComunity = await DespesaComunity.findAll({
            where: { ComunityId: comunidadeId }
        });

        // Obter os IDs das despesas
        const gastoIds = despesasComunity.map(item => item.gastoId);

        // Buscar as despesas usando os IDs encontrados
        const despesas = await Despesas.findAll({
            where: {
                id: gastoIds
            }
        });

        // Calcular o total de despesas com origem "dízimos" do ano corrente
        const totalDespesasAno = despesas
            .filter(item => item.origem === 'dizimos' && new Date(item.createdAt).getFullYear() === new Date().getFullYear())
            .reduce((total, item) => total + item.valor, 0);

        // Calcular os dízimos restantes
        const dizimosRestantes = totalDizimosAno - totalDespesasAno;

        // Renderizar a página com os dados do total de dízimos e despesas
        res.render('layout/dizimospreview', {
            totalDizimos: totalDizimos || 0,
            totalDizimosAno: totalDizimosAno || 0,
            totalDespesasAno: totalDespesasAno || 0, // Define como 0 se não houver despesas
            dizimosRestantes,
            notificacoes:  req.notificacoes
        });
    } catch (error) {
        console.error('Erro ao buscar os dízimos:', error);
        res.status(500).send('Erro ao carregar o dashboard');
    }
});





router.post('/dizimos/total', calcularTempoMembresia, async (req, res) => {
    const { periodo, despesa_inserida } = req.body; // Captura o campo despesa_inserida

    let startDate;
    let endDate = new Date(); // Data atual
    
    // Definindo a data inicial e final com base no período selecionado
    switch (periodo) {
        case 'dia':
            startDate = new Date(endDate);
            endDate.setHours(23, 59, 59, 999);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'semana':
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 7);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'mes':
            startDate = new Date(endDate);
            startDate.setMonth(endDate.getMonth() - 1);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'trimestre':
            startDate = new Date(endDate);
            startDate.setMonth(endDate.getMonth() - 3);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'ano':
            startDate = new Date(endDate);
            startDate.setFullYear(endDate.getFullYear() - 1);
            endDate.setHours(23, 59, 59, 999);
            break;
        default:
            return res.status(400).json({ message: 'Período inválido' });
    }
    
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);

    try {
       
        const comunidadeId = req.session.utilizador?.comunityId;

        if (!comunidadeId) {
            // Renderizar uma página informativa
            return res.render('AcessoNegado/NoComunity', {notificacoes:  req.notificacoes});
        }

        // Buscar os membros que pertencem à comunidade da sessão
        const membros = await MembroComunity.findAll({
            where: { ComunityId: comunidadeId }, // Filtrar apenas pelos membros da comunidade
            attributes: ['MembroId'], // Obter apenas o ID do membro
            raw: true // Para retornar um objeto simples
        });

        // Extrair os IDs dos membros
        const membroIds = membros.map(membro => membro.MembroId);

        // Buscando os dízimos no período especificado e filtrando pelos IDs dos membros
        const dizimos = await Dizimos.findAll({
            where: {
                MembroId: {
                    [Op.in]: membroIds // Filtrando apenas os dízimos dos membros encontrados
                },
                createdAt: {
                    [Op.gte]: startDate,
                    [Op.lt]: endDate
                }
            }
        });

        // Calculando o total por membro
        const totalPorMembro = {};
        const membrosIds = [];

        dizimos.forEach(dizimo => {
            const membroId = dizimo.MembroId;
            if (!totalPorMembro[membroId]) {
                totalPorMembro[membroId] = { total: 0, quantidade: 0 };
            }
            totalPorMembro[membroId].total += dizimo.valor;
            totalPorMembro[membroId].quantidade += 1;
            membrosIds.push(membroId);
        });

        // Buscando os membros correspondentes
        const membrosDetalhados = await Membros.findAll({
            where: {
                id: {
                    [Op.in]: membrosIds
                }
            }
        });

        // Criando um objeto para armazenar os nomes dos membros
        const nomesPorMembro = {};
        membrosDetalhados.forEach(membro => {
            nomesPorMembro[membro.id] = membro.nome;
        });

        // Total geral de dízimos
        const totalGeral = dizimos.reduce((acc, dizimo) => acc + dizimo.valor, 0);

        let totalDespesas = 0;
        if (despesa_inserida === 'despesa inserida') {
            const despesas = await Despesas.findAll({
                where: {
                    origem: 'dizimos',
                    createdAt: {
                        [Op.gte]: startDate,
                        [Op.lt]: endDate
                    }
                }
            });

            totalDespesas = despesas.reduce((acc, despesa) => acc + despesa.valor, 0);
        }

        const totalRestante = totalGeral - totalDespesas;

        return res.render('Relatorios/dizimosTotal', { 
            totalGeral: totalGeral || 0, 
            totalDespesas: totalDespesas || 0, 
            totalRestante: totalRestante || 0, 
            totalPorMembro, 
            nomesPorMembro,
            startDate,
            endDate,
            notificacoes:  req.notificacoes
        });
    } catch (error) {
        console.error('Erro ao buscar dízimos:', error);
        return res.status(500).json({ message: 'Erro ao buscar dízimos' });
    }
});




// Rota para visualizar os dizimistas
router.get('/dizimistas-preview', contarNotificacoes, async (req, res) => {
    try {
        
        const comunidadeId = req.session.utilizador?.comunityId;

        if (!comunidadeId) {
            // Renderizar uma página informativa
            return res.render('AcessoNegado/NoComunity');
        }
        // Buscar os membros da comunidade usando a tabela MembroComunity
        const membrosDaComunidade = await MembroComunity.findAll({
            where: { ComunityId: comunidadeId }
        });

        // Extrair os IDs dos membros que pertencem à comunidade
        const idsMembrosDaComunidade = membrosDaComunidade.map(mc => mc.MembroId);

        // Buscar todos os membros da comunidade
        const membros = await Membros.findAll({
            where: {
                id: {
                    [Op.in]: idsMembrosDaComunidade // Filtrando pelos membros da comunidade
                }
            }
        });

        // Total de dizimistas ativos este ano
        const anoAtual = new Date().getFullYear();

        // Buscar os dízimos dos membros da comunidade para o ano atual
        const dizimistasAtivos = await Dizimos.findAll({
            where: {
                MembroId: {
                    [Op.in]: idsMembrosDaComunidade // Filtrando pelos membros da comunidade
                },
                createdAt: {
                    [Op.gte]: new Date(`${anoAtual}-01-01`), // Início do ano
                    [Op.lt]: new Date(`${anoAtual + 1}-01-01`) // Início do próximo ano
                }
            }
        });

        // Contar membros únicos que fizeram dízimos
        const totalDizimistasAtivos = new Set(dizimistasAtivos.map(dizimo => dizimo.MembroId)).size;

        // Renderizar a página com os dados
        res.render('layout/dizimistaPreview', {
            totalDizimistas: idsMembrosDaComunidade.length, // Total de membros na comunidade
            dizimistasAtivos: totalDizimistasAtivos,
            membros,
            notificacoes:  req.notificacoes
            // Passando todos os membros da comunidade
        });
    } catch (error) {
        console.error('Erro ao buscar os dizimistas:', error);
        res.status(500).send('Erro ao carregar o dashboard');
    }
});



// Rota para listar dízimos
router.get('/listas-dizimistas', contarNotificacoes, async (req, res) => {
    try {
       
        const comunidadeId = req.session.utilizador?.comunityId;

        if (!comunidadeId) {
            // Renderizar uma página informativa
            return res.render('AcessoNegado/NoComunity');
        }

        // Obter a data atual
        const agora = new Date();

        // Definir o início do mês corrente
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

        // Definir o fim do mês corrente
        const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);

        // Buscar os membros da comunidade usando a tabela MembroComunity
        const membrosDaComunidade = await MembroComunity.findAll({
            where: { ComunityId: comunidadeId } // Correção aqui
        });

        // Extrair os IDs dos membros que pertencem à comunidade
        const idsMembrosDaComunidade = membrosDaComunidade.map(mc => mc.MembroId);

        // Buscar todos os membros da comunidade
        const membros = await Membros.findAll({
            where: {
                id: {
                    [Op.in]: idsMembrosDaComunidade // Filtrando pelos membros da comunidade
                }
            }
        });

        // Buscar todos os dízimos do mês corrente, filtrando pelos membros da comunidade
        const dizimosDoMes = await Dizimos.findAll({
            where: {
                createdAt: {
                    [Op.between]: [inicioMes, fimMes],
                },
                MembroId: {
                    [Op.in]: idsMembrosDaComunidade // Filtrando pelos membros da comunidade
                }
            },
        });

        // Criar um mapa para associar os dízimos aos membros
        const membrosComDizimos = membros.map(membro => {
            // Filtrar os dízimos que pertencem ao membro atual
            const dizimosDoMembro = dizimosDoMes.filter(dizimo => dizimo.MembroId === membro.id);
            return {
                ...membro.toJSON(), // Converter o membro para um objeto simples
                dizimos: dizimosDoMembro, // Adicionar os dízimos relacionados ao membro
            };
        });

        // Separar os membros que dizimaram dos que não dizimaram
        const membrosQueDizimaram = membrosComDizimos.filter(membro => membro.dizimos.length > 0);
        const membrosQueNaoDizimaram = membrosComDizimos.filter(membro => membro.dizimos.length === 0);

        // Renderizar a página EJS e passar as variáveis
        return res.render('layout/listaDizimistas', {
            dizimaram: membrosQueDizimaram,
            naoDizimaram: membrosQueNaoDizimaram,
            notificacoes:  req.notificacoes
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar membros e dízimos' });
    }
});



// Rota para listar e classificar dizimistas
router.get('/classes-dizimistas', contarNotificacoes, async (req, res) => {
    try {
       

        const comunidadeId = req.session.utilizador?.comunityId;
        if (!comunidadeId) {
            // Renderizar uma página informativa
            return res.render('AcessoNegado/NoComunity');
        }

        // Buscar os membros da comunidade usando a tabela MembroComunity
        const membrosDaComunidade = await MembroComunity.findAll({
            where: { ComunityId: comunidadeId } // Correção aqui
        });

        // Extrair os IDs dos membros que pertencem à comunidade
        const idsMembrosDaComunidade = membrosDaComunidade.map(mc => mc.MembroId);

        // Buscar todos os membros da comunidade
        const membros = await Membros.findAll({
            where: {
                id: {
                    [Op.in]: idsMembrosDaComunidade // Filtrando pelos membros da comunidade
                }
            }
        });
     
        // Arrays para armazenar dizimistas classificados
        const regulares = [];
        const irregulares = [];
        const novos = [];
        
        // Data atual
        const dataAtual = new Date();

        // Iterar sobre cada membro para verificar suas contribuições e endereços
        for (const membro of membros) {
            // Buscar dízimos deste membro nos últimos 6 meses
            const dizimos = await Dizimos.findAll({
                where: {
                    MembroId: membro.id,
                    createdAt: {
                        [Op.gte]: sequelize.literal('DATE_SUB(NOW(), INTERVAL 6 MONTH)')
                    }
                }
            });
    
            // Buscar endereço completo do membro
            const endereco = await Enderecos.findOne({
                where: { MembroId: membro.id }
            });
    
            // Determinar o tempo de membresia
            const dataAdmissao = new Date(membro.createdAt);
            const anosDeMembresia = dataAtual.getFullYear() - dataAdmissao.getFullYear();
            let tempoDeMembresia;

            // Classificação por tempo de membresia
            if (anosDeMembresia < 1) {
                tempoDeMembresia = 'Novo Membro';
                novos.push({ membro, endereco, tempoDeMembresia, genero: membro.genero });
            } else if (anosDeMembresia >= 1 && anosDeMembresia <= 5) {
                tempoDeMembresia = '1 a 5 anos';
                // Irregulares: membros que doaram menos de 6 vezes ou não contribuíram
                if (dizimos.length < 6) {
                    irregulares.push({ membro, endereco, tempoDeMembresia, genero: membro.genero });
                } else {
                    regulares.push({ membro, endereco, tempoDeMembresia, genero: membro.genero });
                }
            } else {
                tempoDeMembresia = 'Mais de 5 anos';
                // Classificar como regulares ou irregulares com base nas contribuições
                if (dizimos.length >= 6) {
                    regulares.push({ membro, endereco, tempoDeMembresia, genero: membro.genero });
                } else {
                    irregulares.push({ membro, endereco, tempoDeMembresia, genero: membro.genero });
                }
            }
        }

        // Renderizar a página EJS com os dados dos dizimistas
        res.render('ver/classesDizimistas', { 
            regulares, 
            irregulares, 
            novos,
            notificacoes:  req.notificacoes
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao classificar os dizimistas');
    }
});






























// Rota para listar dizimistas
router.get('/gerir-dizimistas', contarNotificacoes, async (req, res) => {
    try {
        // Obter o ID da comunidade da sessão
        const comunidadeId = req.session.utilizador?.comunityId; // Correção aqui
        if (!comunidadeId) {
            // Renderizar uma página informativa
            return res.render('AcessoNegado/NoComunity');
        }

        // Buscar os membros da comunidade usando a tabela MembroComunity
        const membrosDaComunidade = await MembroComunity.findAll({
            where: { ComunityId: comunidadeId } // Correção aqui
        });

        // Extrair os IDs dos membros que pertencem à comunidade
        const idsMembrosDaComunidade = membrosDaComunidade.map(mc => mc.MembroId);

        // Buscar todos os dizimistas que pertencem à comunidade
        const dizimistas = await Membros.findAll({
            where: {
                id: {
                    [Op.in]: idsMembrosDaComunidade // Filtrando pelos membros da comunidade
                }
            },
            attributes: [
                'id',
                'nome',
                'genero',
                'provincia',
                'createdAt',
            ]
        });

        // Buscar total de contribuições para cada dizimista
        const dizimistasData = await Promise.all(dizimistas.map(async (dizimista) => {
            const totalContribuicoes = await Dizimos.sum('valor', {
                where: { MembroId: dizimista.id }
            });

            const ultimaContribuicao = await Dizimos.findOne({
                where: { MembroId: dizimista.id },
                order: [['createdAt', 'DESC']],
                attributes: ['createdAt']
            });

            return {
                id: dizimista.id,
                nome: dizimista.nome,
                genero: dizimista.genero,
                provincia: dizimista.provincia,
                tempo_membresia: calcularTempoMembresia(dizimista.createdAt),
                status: determinarStatus(ultimaContribuicao),
                ultima_contribuicao: ultimaContribuicao ? ultimaContribuicao.createdAt : null,
                valor_total_contribuicoes: totalContribuicoes || 0
            };
        }));

        // Renderizar a página EJS e passar os dados
        return res.render('Ver/gerirDizimistas', { dizimistas: dizimistasData, notificacoes:  req.notificacoes });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao listar dizimistas' });
    }
});




// Funções para calcular o tempo de membresia e determinar o status
function calcularTempoMembresia(dataAdmissao) {
    const agora = new Date();
    const tempo = Math.floor((agora - new Date(dataAdmissao)) / (1000 * 60 * 60 * 24 * 30)); // em meses
    return tempo;
}

function determinarStatus(ultimaContribuicao) {
    if (ultimaContribuicao) {
        const diasDesdeUltimaContribuicao = (new Date() - new Date(ultimaContribuicao)) / (1000 * 60 * 60 * 24);
        
        if (diasDesdeUltimaContribuicao <= 30) {
            return 'regular'; // Contribuições recentes
        } else if (diasDesdeUltimaContribuicao <= 90) {
            return 'irregular'; // Contribuições mais antigas
        } else {
            return 'novo'; // Se não houver contribuições
        }
    }
    
    return 'novo'; // Se não houver contribuições
}

  






router.post('/dizimistas/total', contarNotificacoes, async (req, res) => {
    const { periodo, membro } = req.body;

    const endDate = new Date();
    let startDate;

    switch (periodo) {
        case 'dia':
            startDate = new Date(endDate);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'semana':
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 7);
            break;
        case 'mes':
            startDate = new Date(endDate);
            startDate.setMonth(endDate.getMonth() - 1);
            break;
        case 'trimestre':
            startDate = new Date(endDate);
            startDate.setMonth(endDate.getMonth() - 3);
            break;
        case 'ano':
            startDate = new Date(endDate);
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
        default:
            return res.status(400).json({ message: 'Período inválido' });
    }

    try {
        const membroData = await Membros.findByPk(membro, {
            include: { model: Contatos, attributes: ['email', 'numero_telemovel'] }
        });

        if (!membroData) {
            return res.status(404).json({ message: 'Membro não encontrado' });
        }

        const dizimos = await Dizimos.findAll({
            where: {
                MembroId: membro,
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });

        if (dizimos.length === 0) {
            return res.render('Relatorios/dizimistasTotal', {
                nome: membroData.nome,
                numero_membro: membroData.numero_membro,
                data_nascimento: membroData.data_nascimento.toLocaleDateString('pt-BR'),
                contato: membroData.Contato ? membroData.Contato.numero_telemovel : 'Não disponível',
                total_dizimos: 0,
                numero_contribuicoes: 0,
                media_dizimos: 0,
                ultima_contribuicao_valor: 0,
                ultima_contribuicao_data: 'N/A',
                total_geral: 0,
                comparacao_anual: 'N/A',
                sem_dados: true,
                notificacoes:  req.notificacoes
                // Indicador para mostrar a mensagem de "sem dados"
            });
        }

        const totalDizimos = dizimos.reduce((acc, dizimo) => acc + dizimo.valor, 0);
        const numeroContribuicoes = dizimos.length;
        const mediaDizimos = numeroContribuicoes > 0 ? totalDizimos / numeroContribuicoes : 0;
        const ultimaContribuicao = dizimos[dizimos.length - 1];

        res.render('Relatorios/dizimistasTotal', {
            nome: membroData.nome,
            numero_membro: membroData.numero_membro,
            data_nascimento: membroData.data_nascimento.toLocaleDateString('pt-BR'),
            contato: membroData.Contato ? membroData.Contato.numero_telemovel : 'Não disponível',
            total_dizimos: totalDizimos,
            numero_contribuicoes: numeroContribuicoes,
            media_dizimos: mediaDizimos.toFixed(2),
            ultima_contribuicao_valor: ultimaContribuicao.valor,
            ultima_contribuicao_data: ultimaContribuicao.createdAt.toLocaleDateString('pt-BR'),
            total_geral: totalDizimos,
            comparacao_anual: 'Aumento de 10% em relação ao ano anterior.',
            sem_dados: false // Não há necessidade de mostrar a mensagem
        });
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        res.status(500).json({ message: 'Erro ao buscar dados do dízimo' });
    }
});





















































// Rota para buscar um membro e seus detalhes
router.get('/despesas-page', contarNotificacoes, verificarStatusAprovado,  async (req, res) => {
    try {
  

        res.render("entradas/despesas", {notificacoes:  req.notificacoes})
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar o membro' });
    }
});




// Rota para criar uma nova despesa
router.post('/criar-despesa', upload.single('comprovativo'), async (req, res) => {
    try {
        // Obter os dados do formulário
        const { valor, motivo, origem } = req.body;

        // Verifica se o arquivo foi enviado
        const comprovativo = req.file ? req.file.path : 'sem_comprovativo'; // Define um valor padrão se não houver arquivo

        // Criar uma nova despesa
        const novaDespesa = await Despesas.create({
            valor,
            motivo,
            comprovativo,
            origem // Adiciona a origem da despesa
        });

        // Pega o ComunityId da sessão
        const comunityId = req.session.utilizador?.comunityId;

        if (comunityId) {
            // Associa a despesa à comunidade
            await DespesaComunity.create({
                gastoId: novaDespesa.id, // ID da despesa recém-criada
                ComunityId: comunityId   // ID da comunidade da sessão
            });
        } else {
            
                // Renderizar uma página informativa
                return res.render('AcessoNegado/NoComunity');
            
        }

        // Retornar uma resposta de sucesso
        res.status(201).json({ message: 'Despesa cadastrada com sucesso!', despesa: novaDespesa });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao cadastrar despesa.', error });
    }
});
























































// Rota para obter as pré-visualizações de despesas
router.get('/despesas-previews', contarNotificacoes, async (req, res) => {
    try {
        // Obter o ID da comunidade da sessão
        const comunidadeId = req.session.utilizador?.comunityId;
        if (!comunidadeId) {
            // Renderizar uma página informativa
            return res.render('AcessoNegado/NoComunity');
        }

        // Buscar os IDs de todas as despesas relacionadas à comunidade
        const despesasDaComunidade = await DespesaComunity.findAll({
            where: { ComunityId: comunidadeId },
            attributes: ['gastoId']
        });

        // Extrair os IDs das despesas relacionadas à comunidade
        const idsDespesasDaComunidade = despesasDaComunidade.map(dc => dc.gastoId);

        // Obtendo os totais de despesas das origens
        const total_ofertas = await Despesas.sum('valor', { 
            where: { 
                origem: 'ofertas',
                id: { [Op.in]: idsDespesasDaComunidade } // Filtrar pelas despesas da comunidade
            } 
        }) || 0;

        const total_dizimos = await Despesas.sum('valor', { 
            where: { 
                origem: 'dizimos',
                id: { [Op.in]: idsDespesasDaComunidade } 
            } 
        }) || 0;

        const total_caixa_mae = await Despesas.sum('valor', { 
            where: { 
                origem: 'caixa_mae',
                id: { [Op.in]: idsDespesasDaComunidade }
            } 
        }) || 0; // Total da caixa mãe

        // Total de todas as despesas
        const total_geral = await Despesas.sum('valor', {
            where: {
                id: { [Op.in]: idsDespesasDaComunidade }
            }
        }) || 0;

        // Obtendo totais para o ano corrente
        const anoCorrente = new Date().getFullYear();
        const total_ofertas_ano_corrente = await Despesas.sum('valor', {
            where: {
                origem: 'ofertas',
                id: { [Op.in]: idsDespesasDaComunidade },
                createdAt: {
                    [Op.gte]: new Date(anoCorrente, 0, 1), // Primeiro dia do ano corrente
                    [Op.lt]: new Date(anoCorrente + 1, 0, 1), // Primeiro dia do próximo ano
                },
            },
        }) || 0;

        const total_dizimos_ano_corrente = await Despesas.sum('valor', {
            where: {
                origem: 'dizimos',
                id: { [Op.in]: idsDespesasDaComunidade },
                createdAt: {
                    [Op.gte]: new Date(anoCorrente, 0, 1),
                    [Op.lt]: new Date(anoCorrente + 1, 0, 1),
                },
            },
        }) || 0;

        const total_caixa_mae_ano_corrente = await Despesas.sum('valor', {
            where: {
                origem: 'caixa_mae',
                id: { [Op.in]: idsDespesasDaComunidade },
                createdAt: {
                    [Op.gte]: new Date(anoCorrente, 0, 1),
                    [Op.lt]: new Date(anoCorrente + 1, 0, 1),
                },
            },
        }) || 0;

        // Total de todas as despesas no ano corrente
        const total_geral_ano_corrente = await Despesas.sum('valor', {
            where: {
                id: { [Op.in]: idsDespesasDaComunidade },
                createdAt: {
                    [Op.gte]: new Date(anoCorrente, 0, 1),
                    [Op.lt]: new Date(anoCorrente + 1, 0, 1),
                },
            },
        }) || 0;

        // Renderizando a página de cartões com os totais
        res.render('layout/DespesasPreview', {
            total_ofertas,
            total_dizimos,
            total_caixa_mae,
            total_geral,
            total_ofertas_ano_corrente,
            total_dizimos_ano_corrente,
            total_caixa_mae_ano_corrente,
            total_geral_ano_corrente,
            notificacoes:  req.notificacoes
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar dados' });
    }
});
























// Rota para buscar os totais de despesas por origem e exibir o gráfico
router.get('/grafico-despezas', contarNotificacoes, async (req, res) => {
    try {
        // Obter o ID da comunidade da sessão
        const comunidadeId = req.session.utilizador?.comunityId;
        if (!comunidadeId) {
            // Renderizar uma página informativa
            return res.render('AcessoNegado/NoComunity');
        }

        // Buscar os IDs de todas as despesas relacionadas à comunidade
        const despesasDaComunidade = await DespesaComunity.findAll({
            where: { ComunityId: comunidadeId },
            attributes: ['gastoId']
        });

        // Extrair os IDs das despesas relacionadas à comunidade
        const idsDespesasDaComunidade = despesasDaComunidade.map(dc => dc.gastoId);

        // Obtendo o período a partir da query string
        const periodo = req.query.periodo || 'ano'; // 'ano' é o padrão
        const inicioAno = new Date(new Date().getFullYear(), 0, 1);
        const fimAno = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);
        let whereCondition;

        // Definindo o intervalo baseado no período selecionado
        switch (periodo) {
            case 'dia':
                const hoje = new Date();
                whereCondition = {
                    createdAt: {
                        [sequelize.Op.between]: [hoje.setHours(0, 0, 0, 0), hoje.setHours(23, 59, 59, 999)]
                    },
                    id: { [Op.in]: idsDespesasDaComunidade } // Filtrar pelas despesas da comunidade
                };
                break;
            case 'semana':
                const inicioSemana = new Date();
                inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
                whereCondition = {
                    createdAt: {
                        [sequelize.Op.between]: [inicioSemana.setHours(0, 0, 0, 0), new Date()]
                    },
                    id: { [Op.in]: idsDespesasDaComunidade }
                };
                break;
            case 'mes':
                const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                whereCondition = {
                    createdAt: {
                        [sequelize.Op.between]: [inicioMes, new Date()]
                    },
                    id: { [Op.in]: idsDespesasDaComunidade }
                };
                break;
            case 'trimestre':
                const trimestre = Math.floor(new Date().getMonth() / 3);
                const inicioTrimestre = new Date(new Date().getFullYear(), trimestre * 3, 1);
                whereCondition = {
                    createdAt: {
                        [sequelize.Op.between]: [inicioTrimestre, new Date()]
                    },
                    id: { [Op.in]: idsDespesasDaComunidade }
                };
                break;
            case 'ano':
            default:
                whereCondition = {
                    createdAt: {
                        [sequelize.Op.between]: [inicioAno, fimAno]
                    },
                    id: { [Op.in]: idsDespesasDaComunidade }
                };
                break;
        }

        // Buscar todas as origens únicas na tabela de despesas para o período selecionado
        const despesasPorOrigem = await Despesas.findAll({
            attributes: ['origem', [sequelize.fn('SUM', sequelize.col('valor')), 'total']],
            where: whereCondition,
            group: ['origem']
        });

        // Transformar os resultados em um formato utilizável
        const labels = despesasPorOrigem.map(despesa => despesa.origem);
        const valores = despesasPorOrigem.map(despesa => parseFloat(despesa.dataValues.total));

        // Renderizar a página com as labels e os valores para o gráfico
        res.render('ver/graficoDespezas', { labels, valores, periodo, notificacoes:  req.notificacoes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar as despesas' });
    }
});




















// Rota para buscar despesas e gerar gráfico de despesas por mês, filtradas por comunidade
router.get('/grafico-de-despeza-por-mes', contarNotificacoes, async (req, res) => {
    try {
        // Obter o ID da comunidade da sessão
        const comunidadeId = req.session.utilizador?.comunityId;
        if (!comunidadeId) {
            // Renderizar uma página informativa
            return res.render('AcessoNegado/NoComunity');
        }

        // Buscar os IDs de todas as despesas relacionadas à comunidade
        const despesasDaComunidade = await DespesaComunity.findAll({
            where: { ComunityId: comunidadeId },
            attributes: ['gastoId']
        });

        // Extrair os IDs das despesas relacionadas à comunidade
        const idsDespesasDaComunidade = despesasDaComunidade.map(dc => dc.gastoId);

        // Buscar despesas agrupadas por mês, somando os valores das despesas da comunidade
        const despesas = await Despesas.findAll({
            attributes: [
                [sequelize.fn('MONTH', sequelize.col('createdAt')), 'mes'], // Agrupa pelo mês
                [sequelize.fn('SUM', sequelize.col('valor')), 'total'] // Soma os valores
            ],
            where: {
                id: { [Op.in]: idsDespesasDaComunidade } // Filtra pelas despesas da comunidade
            },
            group: ['mes'],
            order: [[sequelize.fn('MONTH', sequelize.col('createdAt')), 'ASC']] // Ordena por mês
        });

        // Converte os dados para um formato que pode ser usado pelo gráfico
        const dadosGrafico = despesas.map(d => ({
            mes: d.dataValues.mes,
            total: d.dataValues.total
        }));

        // Renderizar a página com os dados para o gráfico
        res.render("Ver/GraficoDespezaMes", { dadosGrafico, notificacoes:  req.notificacoes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar despesas' });
    }
});










// Rota para gerar o relatório de despesas filtrado por comunidade
router.post('/despesas/relatorio', contarNotificacoes, async (req, res) => {
    const { periodo, origem } = req.body;
    const endDate = new Date();
    let startDate;

    // Lógica para definir a data de início com base no período selecionado
    switch (periodo) {
        case 'dia':
            startDate = new Date(endDate);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'semana':
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 7);
            break;
        case 'mes':
            startDate = new Date(endDate);
            startDate.setMonth(endDate.getMonth() - 1);
            break;
        case 'trimestre':
            startDate = new Date(endDate);
            startDate.setMonth(endDate.getMonth() - 3);
            break;
        case 'ano':
            startDate = new Date(endDate);
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
        default:
            return res.status(400).json({ message: 'Período inválido' });
    }

    try {
        // Verificar se a comunidade está especificada na sessão
        const comunidadeId = req.session.utilizador?.comunityId;
        if (!comunidadeId) {
            // Renderizar uma página informativa
            return res.render('AcessoNegado/NoComunity');
        }

        // Buscar os IDs das despesas relacionadas à comunidade
        const despesasDaComunidade = await DespesaComunity.findAll({
            where: { ComunityId: comunidadeId },
            attributes: ['gastoId']
        });

        // Extrair os IDs das despesas da comunidade
        const idsDespesasDaComunidade = despesasDaComunidade.map(dc => dc.gastoId);

        // Construir a condição da consulta, filtrando pelas datas e IDs das despesas da comunidade
        const whereCondition = {
            id: { [Op.in]: idsDespesasDaComunidade }, // Filtra as despesas da comunidade
            createdAt: {
                [Op.between]: [startDate, endDate] // Filtrar entre startDate e endDate
            }
        };

        // Adicionar condição de origem se não for "todas as origens"
        if (origem && origem !== 'todas') {
            whereCondition.origem = origem;
        }

        // Buscar as despesas com as condições definidas
        const despesas = await Despesas.findAll({ where: whereCondition });

        // Calcular o total de despesas
        const totalDespesas = despesas.reduce((total, despesa) => total + despesa.valor, 0);

        // Renderizar a página com as despesas, total e variáveis
        res.render('Relatorios/RelatorioDespesas', { despesas, totalDespesas, periodo, origem, notificacoes:  req.notificacoes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao gerar o relatório' });
    }
});



















































































router.get('/relatorio-geral-page', contarNotificacoes, async (req, res) => {
    try {
        const comunityId = req.session.utilizador?.comunityId;// Correção: obtendo comunityId da sessão

        if (!comunityId) {
            // Renderizar uma página informativa
            return res.render('AcessoNegado/NoComunity');
        }

        // Fazendo o JOIN nas tabelas intermediárias para filtrar pela comunidade correta
        const ofertas = await Ofertas.findAll({
            include: [{
                model: OfertaComunity,
                where: { ComunityId: comunityId }  // Correção: filtrando pelo campo ComunityId
            }]
        });

        const dizimos = await Dizimos.findAll({
            include: [{
                model: DizimoComunity,
                where: { ComunityId: comunityId }  // Correção: filtrando pelo campo ComunityId
            }]
        });

        const despesas = await Despesas.findAll({
            include: [{
                model: DespesaComunity,
                where: { ComunityId: comunityId }  // Correção: filtrando pelo campo ComunityId
            }]
        });

        // Cálculos dos totais
        const totalOfertas = ofertas.map(o => o.valor).reduce((acc, valor) => acc + valor, 0) || 0;
        const totalDizimos = dizimos.map(d => d.valor).reduce((acc, valor) => acc + valor, 0) || 0;
        const totalDespesas = despesas.map(d => d.valor).reduce((acc, valor) => acc + valor, 0) || 0;

        const saldo = totalOfertas + totalDizimos - totalDespesas;

        // Desempenho Anual
        const currentYear = new Date().getFullYear();
        const lastYear = currentYear - 1;

        const ofertasAnoAtual = ofertas
            .filter(oferta => new Date(oferta.createdAt).getFullYear() === currentYear)
            .map(oferta => oferta.valor)
            .reduce((acc, valor) => acc + valor, 0) || 0;

        const ofertasAnoAnterior = ofertas
            .filter(oferta => new Date(oferta.createdAt).getFullYear() === lastYear)
            .map(oferta => oferta.valor)
            .reduce((acc, valor) => acc + valor, 0) || 0;

        const dizimosAnoAtual = dizimos
            .filter(dizimo => new Date(dizimo.createdAt).getFullYear() === currentYear)
            .map(dizimo => dizimo.valor)
            .reduce((acc, valor) => acc + valor, 0) || 0;

        const dizimosAnoAnterior = dizimos
            .filter(dizimo => new Date(dizimo.createdAt).getFullYear() === lastYear)
            .map(dizimo => dizimo.valor)
            .reduce((acc, valor) => acc + valor, 0) || 0;

        const despesasAnoAtual = despesas
            .filter(despesa => new Date(despesa.createdAt).getFullYear() === currentYear)
            .map(despesa => despesa.valor)
            .reduce((acc, valor) => acc + valor, 0) || 0;

        const despesasAnoAnterior = despesas
            .filter(despesa => new Date(despesa.createdAt).getFullYear() === lastYear)
            .map(despesa => despesa.valor)
            .reduce((acc, valor) => acc + valor, 0) || 0;

        const crescimentoOfertas = ofertasAnoAnterior
            ? ((ofertasAnoAtual - ofertasAnoAnterior) / ofertasAnoAnterior) * 100
            : 0;

        const crescimentoDizimos = dizimosAnoAnterior
            ? ((dizimosAnoAtual - dizimosAnoAnterior) / dizimosAnoAnterior) * 100
            : 0;

        const crescimentoDespesas = despesasAnoAnterior
            ? ((despesasAnoAtual - despesasAnoAnterior) / despesasAnoAnterior) * 100
            : 0;

        const crescimentoContribuicoes = [
            { tipo: 'Ofertas', crescimento: crescimentoOfertas },
            { tipo: 'Dízimos', crescimento: crescimentoDizimos },
            { tipo: 'Despesas', crescimento: crescimentoDespesas }
        ];

        const maiorCrescimento = crescimentoContribuicoes.reduce((prev, current) => {
            return current.crescimento > prev.crescimento ? current : prev;
        });

        const metaArrecadacao = 500000.00;  // Meta de arrecadação
        const metaDespesas = 10000000.00;   // Meta de despesas
        const totalArrecadado = totalOfertas + totalDizimos;

        const porcentagemArrecadacao = (totalArrecadado > 0)
            ? Number(((totalArrecadado / metaArrecadacao) * 100).toFixed(2))
            : 0;

        const porcentagemDespesas = (totalDespesas > 0)
            ? Number(((totalDespesas / metaDespesas) * 100).toFixed(2))
            : 0;

        const notificacoes = [];
        const receitasTotais = totalOfertas + totalDizimos;

        if (totalDespesas > receitasTotais) {
            notificacoes.push('Alerta: As despesas superaram as receitas.');
        }
        if (totalDespesas >= receitasTotais * 0.9) {
            notificacoes.push('Alerta: As despesas estão perto de superar as receitas.');
        }

        res.render('layout/geral_prev', {
            totalOfertas,
            totalDizimos,
            totalDespesas,
            saldo,
            desempenhoAnual: {
                anoAtual: ofertasAnoAtual,
                anoAnterior: ofertasAnoAnterior,
                desempenhoPorcentagem: crescimentoOfertas
            },
            notificacoes,
            metaArrecadacao,
            metaDespesas,
            porcentagemArrecadacao,
            porcentagemDespesas,
            maiorCrescimento,
            notificacoes:  req.notificacoes
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar dados do relatório geral.' });
    }
});




router.get('/api/relatorio-geral-grafico', async (req, res) => {
    try {
        const periodo = req.query.periodo;
        let startDate;
        let endDate = new Date(); // Data atual
// Verificar se a comunidade está na sessão
const comunityId = req.session.utilizador?.comunityId;
if (!comunityId) {
    // Renderizar uma página informativa
    return res.render('AcessoNegado/NoComunity');
}


        // Definindo a data inicial e final com base no período selecionado
        switch (periodo) {
            case 'dia':
                startDate = new Date(endDate);
                endDate.setHours(23, 59, 59, 999); // Final do dia de hoje
                startDate.setHours(0, 0, 0, 0); // Início do dia de hoje
                break;
            case 'semana':
                startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - 7); // 7 dias atrás
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'mes':
                startDate = new Date(endDate);
                startDate.setMonth(endDate.getMonth() - 1); // 1 mês atrás
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'trimestre':
                startDate = new Date(endDate);
                startDate.setMonth(endDate.getMonth() - 3); // 3 meses atrás
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'ano':
                startDate = new Date(endDate);
                startDate.setFullYear(endDate.getFullYear() - 1); // 1 ano atrás
                endDate.setHours(23, 59, 59, 999);
                break;
            default:
                return res.status(400).json({ message: 'Período inválido' });
        }

        // Obtendo os IDs das ofertas, dízimos e despesas associados à comunidade
        const ofertasComunity = await OfertaComunity.findAll({ where: { ComunityId: comunityId } });
        const dizimosComunity = await DizimoComunity.findAll({ where: { ComunityId: comunityId } });
        const despesasComunity = await DespesaComunity.findAll({ where: { ComunityId: comunityId } });

        const ofertaIds = ofertasComunity.map(item => item.OfertaId);
        const dizimoIds = dizimosComunity.map(item => item.DizimoId);
        const despesaIds = despesasComunity.map(item => item.gastoId);

        // Obtendo os valores filtrados com base no período
        const totalOfertas = await Ofertas.sum('valor', {
            where: {
                createdAt: {
                    [Op.between]: [startDate, endDate]
                },
                id: ofertaIds // Filtra ofertas pela Comunidade
            }
        }) || 0;

        const totalDizimos = await Dizimos.sum('valor', {
            where: {
                createdAt: {
                    [Op.between]: [startDate, endDate]
                },
                id: dizimoIds // Filtra dízimos pela Comunidade
            }
        }) || 0;

        const totalDespesas = await Despesas.sum('valor', {
            where: {
                createdAt: {
                    [Op.between]: [startDate, endDate]
                },
                id: despesaIds // Filtra despesas pela Comunidade
            }
        }) || 0;

        // Enviando os dados filtrados como resposta
        res.json({ totalOfertas, totalDizimos, totalDespesas });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar dados do relatório geral.' });
    }
});

module.exports = router;




// Rota para gerar o relatório geral
router.post('/api/relatorio-geral', async (req, res) => {
    try {
        const { periodo, itensSelecionados } = req.body;
        let startDate;
        let endDate = new Date(); // Data atual

        // Definindo a data inicial e final com base no período selecionado
        switch (periodo) {
            case 'dia':
                startDate = new Date(endDate);
                endDate.setHours(23, 59, 59, 999); // Final do dia de hoje
                startDate.setHours(0, 0, 0, 0); // Início do dia de hoje
                break;
            case 'semana':
                startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - 7); // 7 dias atrás
                break;
            case 'mes':
                startDate = new Date(endDate);
                startDate.setMonth(endDate.getMonth() - 1); // 1 mês atrás
                break;
            case 'trimestre':
                startDate = new Date(endDate);
                startDate.setMonth(endDate.getMonth() - 3); // 3 meses atrás
                break;
            case 'ano':
                startDate = new Date(endDate);
                startDate.setFullYear(endDate.getFullYear() - 1); // 1 ano atrás
                break;
            default:
                return res.status(400).json({ message: 'Período inválido' });
        }

        const comunityId = req.session.utilizador?.comunityId; // ID da comunidade na sessão
        
        if (!comunityId) {
            // Renderizar uma página informativa
            return res.render('AcessoNegado/NoComunity');
        }

        // Variáveis para armazenar resultados de cada busca e totais
        let dizimosResultado = [];
        let ofertasResultado = [];
        let despesasResultado = [];
        let totalDizimos = 0;
        let totalOfertas = 0;
        let totalDespesas = 0;

        // Buscas para cada item selecionado usando Sequelize
        if (itensSelecionados.includes('dizimos') || itensSelecionados.includes('geral')) {
            const dizimosComunidad = await DizimoComunity.findAll({
                where: {
                    ComunityId: comunityId,
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            });

            // IDs dos dízimos relacionados aos membros
            const dizimoIds = dizimosComunidad.map(dizimo => dizimo.DizimoId);

            const dizimos = await Dizimos.findAll({
                where: {
                    id: dizimoIds // Buscando os dízimos reais
                }
            });

            const membrosIds = await MembroComunity.findAll({
                where: {
                    ComunityId: comunityId,
                    MembroId: dizimos.map(dizimo => dizimo.MembroId) // IDs dos membros dos dízimos
                }
            });

            // Processando resultados usando map
            dizimosResultado = dizimos.map(dizimo => {
                const membro = membrosIds.find(m => m.MembroId === dizimo.MembroId);
                return {
                    dizimistaNome: membro ? membro.nome : 'Desconhecido',
                    totalValor: dizimo.valor // Supondo que a tabela de dízimos tem um campo valor
                };
            });

            // Calculando o total de dízimos
            totalDizimos = dizimosResultado.reduce((acc, dizimo) => acc + dizimo.totalValor, 0);
        }

        if (itensSelecionados.includes('ofertas') || itensSelecionados.includes('geral')) {
            const ofertasComunidad = await OfertaComunity.findAll({
                where: {
                    ComunityId: comunityId,
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            });

            const ofertaIds = ofertasComunidad.map(oferta => oferta.OfertaId);

            const ofertas = await Ofertas.findAll({
                where: {
                    id: ofertaIds // Buscando as ofertas reais
                }
            });

            // Processando resultados de ofertas sem incluir nomes de membros
            ofertasResultado = ofertas.map(oferta => ({
                totalValor: oferta.valor, // Acesso correto ao valor
                createdAt: oferta.createdAt // Incluindo a data de criação
            }));

            // Calculando o total de ofertas
            totalOfertas = ofertasResultado.reduce((acc, oferta) => acc + oferta.totalValor, 0);
        }

        if (itensSelecionados.includes('despesas') || itensSelecionados.includes('geral')) {
            const despesasComunidad = await DespesaComunity.findAll({
                where: {
                    ComunityId: comunityId,
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            });

            const despesaIds = despesasComunidad.map(despesa => despesa.gastoId);

            const despesas = await Despesas.findAll({
                where: {
                    id: despesaIds // Buscando as despesas reais
                }
            });

            despesasResultado = despesas.map(despesa => ({
                totalValor: despesa.valor, // Supondo que a tabela de despesas tem um campo valor
                createdAt: despesa.createdAt // Incluindo a data de criação
            }));

            // Calculando o total de despesas
            totalDespesas = despesasResultado.reduce((acc, despesa) => acc + despesa.totalValor, 0);
        }

        // Armazenando dados na sessão
        req.session.dizimosResultado = dizimosResultado;
        req.session.ofertasResultado = ofertasResultado;
        req.session.despesasResultado = despesasResultado;
        req.session.totalDizimos = totalDizimos;
        req.session.totalOfertas = totalOfertas;
        req.session.totalDespesas = totalDespesas;

        // Exibindo os resultados em formato JSON
        res.json({
            dizimos: dizimosResultado,
            ofertas: ofertasResultado,
            despesas: despesasResultado,
            totalDizimos,
            totalOfertas,
            totalDespesas
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao gerar relatório. Tente novamente.' });
    }
});










// Rota para renderizar a página Geral.ejs com os dados do relatório
router.get('/Geral', contarNotificacoes, (req, res) => {
    // Acessa os resultados armazenados na sessão
    const dizimosResultado = req.session.dizimosResultado;
    const ofertasResultado = req.session.ofertasResultado;
    const despesasResultado = req.session.despesasResultado;
    const dizimistasResultado = req.session.dizimistasResultado;
     totalDizimos =req.session.totalDizimos;
      totalOfertas =req.session.totalOfertas;
       totalDespesas =req.session.totalDespesas;

    // Verifica se há dados na sessão
    if (!dizimosResultado && !ofertasResultado && !despesasResultado && !dizimistasResultado) {
        return res.status(400).send('Nenhum dado encontrado para o relatório.');
    }

    // Renderiza a página passando os resultados
    res.render('Relatorios/Geral2', {
        dizimosResultado,
        ofertasResultado,
        despesasResultado,
        dizimistasResultado,
        totalDizimos,
        totalOfertas,
        totalDespesas,
        notificacoes:  req.notificacoes
    });
});


























const Notificacoes = require("../Nota/Notificacao");
const { Connection } = require('puppeteer');


 connection = require("../database/database");













// Rota para renderizar a página de quotas
router.get('/quotas-pagina', contarNotificacoes, async (req, res) => {
    try {
        // Supondo que você tenha um modelo de Departamento para buscar os departamentos
        const departamentos = await Departamentos.findAll();
        
        // Renderizando a página e passando os departamentos
        res.render("entradas/quotas", { departamentos, notificacoes:  req.notificacoes });
    } catch (error) {
        console.error("Erro ao buscar departamentos:", error);
        res.status(500).send("Erro ao carregar a página.");
    }
});





// Rota para renderizar a página de quotas
router.get('/departamento-pagina', contarNotificacoes, verificarStatusAprovado,  async (req, res) => {
    try {
       
        // Renderizando a página e passando os departamentos
        res.render("entradas/Departamentos" , {notificacoes:  req.notificacoes});
    } catch (error) {
        console.error("Erro ao buscar departamentos:", error);
        res.status(500).send("Erro ao carregar a página.");
    }
});







// Rota para renderizar a página de descritivos
router.get('/descritivos', contarNotificacoes, async (req, res) => {
    try {
        // Buscar todos os membros
        const membros = await Membros.findAll();
        // Buscar dados eclesiais associados
        const dadosEclesiais = await DadosEclesiais.findAll();

        // Extrair informações necessárias
        const generos = new Set();
        const idades = new Set();
        const estadosCivil = new Set();
        const bis = new Set();
        const naturalidades = new Set();
        const provincias = new Set();
        const situacoes = new Set();
        const categorias = new Set();
        const funcoes = new Set();
        const datasConsagracao = new Set();
        const datasBatismo = new Set();

        membros.forEach(membro => {
            // Gêneros
            if (membro.genero) generos.add(membro.genero);
            // Idades
            if (membro.data_nascimento) {
                const idade = new Date().getFullYear() - new Date(membro.data_nascimento).getFullYear();
                idades.add(idade);
            }
            // Estado Civil
            if (membro.estado_civil) estadosCivil.add(membro.estado_civil);
            // Bilhete de Identidade
            if (membro.bi) bis.add(membro.bi);
            // Naturalidade
            if (membro.naturalidade) naturalidades.add(membro.naturalidade);
            // Província
            if (membro.provincia) provincias.add(membro.provincia);
        });

        // Extraindo dados eclesiais
        dadosEclesiais.forEach(dado => {
            // Situação
            if (dado.situacao) situacoes.add(dado.situacao);
            // Categoria
            if (dado.categoria) categorias.add(dado.categoria);
            // Função
            if (dado.funcao) funcoes.add(dado.funcao);
            // Data de Consagração
            if (dado.dataConsagracao) {
                const dataConsagracaoFormatada = new Date(dado.dataConsagracao).toLocaleDateString('pt-BR');
                datasConsagracao.add(dataConsagracaoFormatada);
            }
            // Data de Batismo
            if (dado.dataBatismo) {
                const dataBatismoFormatada = new Date(dado.dataBatismo).toLocaleDateString('pt-BR');
                datasBatismo.add(dataBatismoFormatada);
            }
        });

        // Passar os dados para a página EJS
        res.render("Relatorios/descritivos", {
            generos: Array.from(generos),
            idades: Array.from(idades),
            estadosCivil: Array.from(estadosCivil),
            bis: Array.from(bis),
            naturalidades: Array.from(naturalidades),
            provincias: Array.from(provincias),
            situacoes: Array.from(situacoes),
            categorias: Array.from(categorias),
            funcoes: Array.from(funcoes),
            datasConsagracao: Array.from(datasConsagracao),
            datasBatismo: Array.from(datasBatismo),
            notificacoes:  req.notificacoes
        });
    } catch (error) {
        console.error("Erro ao carregar a página:", error);
        res.status(500).send("Erro ao carregar a página.");
    }
});



// Rota para mostrar o relatório descritivo
router.get('/mostrar-relatorio-descritivo', contarNotificacoes, async (req, res) => {
    try {
        // Recebe e decodifica os itens selecionados
        const itensSelecionados = JSON.parse(decodeURIComponent(req.query.itens));

        // Verifica se itensSelecionados é um array válido
        if (!Array.isArray(itensSelecionados) || itensSelecionados.length === 0) {
            return res.status(400).json({ error: 'Nenhum item selecionado.' });
        }

        // Inicializa as condições de where
        const whereConditions = {
            [sequelize.Op.and]: []
        };

        // Define um objeto de mapeamento para estados civis
        const estadosCivis = ['Solteiro', 'Casado', 'Divorciado', 'Viúvo'];

        // Adicione verificações dinâmicas para todos os campos
        itensSelecionados.forEach(item => {
            if (/^\d+$/.test(item)) {
                // Item é um BI
                whereConditions[sequelize.Op.and].push({ bi: item });
            } else if (typeof item === 'string' && item.trim() !== '') {
                // Item é uma província ou naturalidade
                if (item.includes("naturalidade")) {
                    whereConditions[sequelize.Op.and].push({ naturalidade: item });
                } else if (estadosCivis.includes(item)) {
                    // Item é um estado civil
                    whereConditions[sequelize.Op.and].push({ estado_civil: item });
                } else {
                    // Item é uma província
                    whereConditions[sequelize.Op.and].push({ provincia: item });
                }
            } else if (item.includes("situacao")) {
                whereConditions[sequelize.Op.and].push({ '$Eclesiais.situacao$': item });
            } else if (item.includes("categoria")) {
                whereConditions[sequelize.Op.and].push({ '$Eclesiais.categoria$': item });
            } else if (item.includes("funcao")) {
                whereConditions[sequelize.Op.and].push({ '$Eclesiais.funcao$': item });
            }
        });

        // Execute a consulta com as condições dinâmicas
        const membrosEncontrados = await Membros.findAll({
            include: [{
                model: DadosEclesiais,
                required: false // Se você quiser apenas membros que têm dados eclesiais, defina como true
            }],
            where: whereConditions
        });

        // Renderiza a página do relatório com os membros encontrados
        res.json({ membros: membrosEncontrados, notificacoes:  req.notificacoes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao gerar o relatório' });
    }
});









router.post('/criar-quota', contarNotificacoes, async (req, res) => {
    console.log('Corpo da requisição:', req.body); // Adicione esta linha para debugar
    const { valor, descricao, departamentoId } = req.body;

    // Verifique se os dados estão definidos
    console.log('Dados recebidos:', { valor, descricao, departamentoId });

    try {
        const novaQuota = await Cuotas.create({
            valor,
            descricao,
            departamentoId,
        });

        const departamentos = await Departamentos.findAll();

        res.render("entradas/quotas", {departamentos, notificacoes:  req.notificacoes})
    } catch (error) {
        console.error("Erro ao cadastrar a quota:", error);
        res.status(500).json({ message: "Erro ao cadastrar a quota." });
    }
});




router.post('/criar-departamento', contarNotificacoes, async (req, res) => {
    console.log('Corpo da requisição:', req.body); // Adicione esta linha para debugar
    const { nomeDepartamento } = req.body;


    try {
        const novaQuota = await Departamentos.create({
            nomeDepartamento
        });

        
        res.render("entradas/Departamentos", {notificacoes:  req.notificacoes});


    } catch (error) {
        console.error("Erro ao cadastrar a quota:", error);
        res.status(500).json({ message: "Erro ao cadastrar a quota." });
    }
});









// Rota para renderizar a página de quotas
router.get('/quotas-previews', contarNotificacoes, async (req, res) => {
    try {
        // Buscar IDs únicos dos departamentos que possuem quotas associadas
        const departamentosContribuintes = await Cuotas.findAll({
            attributes: ['departamentoId'],
            group: ['departamentoId'],
            raw: true,
        });

        // Contar o número de departamentos contribuindo
        const totalDepartamentos = departamentosContribuintes.length;

        // Calcular o total de quotas arrecadadas
        const totalQuotas = await Cuotas.sum('valor');

        // Calcular o total de quotas pagas no trimestre (últimos 3 meses) usando o campo createdAt
        const dataAtual = new Date();
        const dataTrimestrePassado = new Date();
        dataTrimestrePassado.setMonth(dataAtual.getMonth() - 3);

        const quotasPagasTrimestre = await Cuotas.count({
            where: {
                createdAt: {
                    [Op.between]: [dataTrimestrePassado, dataAtual]
                }
            }
        });

        // Renderizando a página e passando os dados para o template
        res.render("layout/quotasPreviwes", {
            totalDepartamentos,
            totalQuotas,
            quotasPagasTrimestre,
            notificacoes:  req.notificacoes
        });
    } catch (error) {
        console.error("Erro ao buscar departamentos:", error);
        res.status(500).send("Erro ao carregar a página.");
    }
});


// Rota para buscar quotas pagas e não pagas neste trimestre
router.get('/quotas-status', contarNotificacoes, async (req, res) => {
    try {
        // Data atual e data do trimestre passado
        const dataAtual = new Date();
        const dataTrimestrePassado = new Date();
        dataTrimestrePassado.setMonth(dataAtual.getMonth() - 3);

        // Buscar quotas pagas neste trimestre com detalhes dos departamentos
        const quotasPagas = await Cuotas.findAll({
            where: {
                createdAt: {
                    [Op.between]: [dataTrimestrePassado, dataAtual]
                }
            },
            include: [{
                model: Departamentos,
                as: 'departamento'
            }],
            raw: true,
            nest: true
        });

        // Buscar todos os departamentos
        const departamentos = await Departamentos.findAll({ raw: true });

        // Agrupar os pagamentos por departamento
        const quotasAgrupadas = {};
        quotasPagas.forEach(quota => {
            const deptId = quota.departamento.id;
            const nomeDept = quota.departamento.nomeDepartamento;

            if (!quotasAgrupadas[deptId]) {
                quotasAgrupadas[deptId] = {
                    nomeDepartamento: nomeDept,
                    totalPago: 0,
                    ultimaDataPagamento: new Date(0)
                };
            }

            quotasAgrupadas[deptId].totalPago += parseFloat(quota.valor);
            if (new Date(quota.createdAt) > quotasAgrupadas[deptId].ultimaDataPagamento) {
                quotasAgrupadas[deptId].ultimaDataPagamento = new Date(quota.createdAt);
            }
        });

        // Converter o objeto agrupado para uma lista
        const quotasPagasAgrupadas = Object.values(quotasAgrupadas);

        // Filtrar os departamentos que ainda não pagaram neste trimestre
        const quotasPagasIds = quotasPagasAgrupadas.map(quota => quota.departamentoId);
        const departamentosNaoPagos = departamentos.filter(dept => !quotasAgrupadas[dept.id]);

        // Renderizar a página e passar os dados
        res.render("Relatorios/quotasStatus", {
            quotasPagas: quotasPagasAgrupadas,
            quotasNaoPagas: departamentosNaoPagos,
            notificacoes:  req.notificacoes
        });
    } catch (error) {
        console.error("Erro ao buscar quotas:", error);
        res.status(500).send("Erro ao carregar a página.");
    }
});




// Rota para mostrar o gráfico de contribuições por departamento
router.get('/grafico-quotas', async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();

        // Buscando as contribuições por departamento no ano corrente
        const quotas = await Cuotas.findAll({
            attributes: [
                'departamentoId',
                [sequelize.fn('SUM', sequelize.col('valor')), 'totalValor'], // Soma dos valores
            ],
            where: {
                createdAt: {
                    [Op.gte]: new Date(currentYear, 0, 1), // A partir de 1º de janeiro do ano atual
                    [Op.lt]: new Date(currentYear + 1, 0, 1) // Até 31 de dezembro do ano atual
                }
            },
            group: ['departamentoId'], // Agrupando por departamento
        });

        // Buscando todos os departamentos
        const departamentos = await Departamentos.findAll({
            attributes: ['id', 'nomeDepartamento']
        });

        // Mapeando os totais por departamento
        const totaisPorDepartamento = {};
        quotas.forEach(quota => {
            const departamentoId = quota.departamentoId;
            const totalValor = parseFloat(quota.getDataValue('totalValor')) || 0;
            totaisPorDepartamento[departamentoId] = totalValor;
        });

        // Formatando os dados para renderização
        const dadosGrafico = departamentos.map(departamento => ({
            nome: departamento.nomeDepartamento,
            total: totaisPorDepartamento[departamento.id] || 0
        }));

        // Renderizando a página com os dados dos departamentos
        res.render('Relatorios/graficoquotas', { departamentos: dadosGrafico });
    } catch (error) {
        console.error('Erro ao buscar dados de contribuições:', error);
        res.status(500).send('Erro ao buscar dados de contribuições');
    }
});




router.get('/notificacoes', async (req, res) => {
    const mensagens = [];
    const comunityId = req.session.utilizador?.comunityId;

    if (!comunityId) {
        return res.render('AcessoNegado/NoComunity');
    }

    // 1. Notificações para Ofertas
    const totalOfertas = await Ofertas.sum('valor', {
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
        mensagens.push("🎉 Ótimas notícias! Todas as ofertas arrecadadas foram cobertas pelas despesas, garantindo que todos os recursos estão sendo utilizados adequadamente.");
    } else if (despesasOfertas >= totalOfertas * 0.9) {
        mensagens.push("⚠️ Atenção: As despesas estão muito próximas do total das ofertas, o que pode impactar o orçamento se não for monitorado.");
    }

    // 2. Notificações para Dízimos
    const totalDizimos = await Dizimos.sum('valor', {
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
        mensagens.push("🎉 Excelente! Todos os dízimos recebidos foram utilizados para cobrir as despesas, mantendo a saúde financeira da comunidade.");
    } else if (despesasDizimos >= totalDizimos * 0.9) {
        mensagens.push("⚠️ Atenção: As despesas estão quase iguais ao total dos dízimos, o que exige atenção para evitar déficits futuros.");
    }

    // 3. Notificação para a Caixa Mãe
    const totalCaixaMae = totalOfertas + totalDizimos;

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
        mensagens.push("🎉 Boa notícia! A Caixa Mãe está com as despesas equilibradas, assegurando a continuidade dos projetos.");
    } else if (despesasCaixaMae >= totalCaixaMae * 0.9) {
        mensagens.push("⚠️ Importante: As despesas da Caixa Mãe estão quase equilibradas com os recursos disponíveis, e uma revisão pode ser necessária.");
    }

    // 4. Notificações para Membros
    const membros = await Membros.findAll({
        include: [{
            model: MembroComunity,
            where: { ComunityId: comunityId }
        }]
    });

    for (const membro of membros) {
        const totalDizimosMembro = await Dizimos.count({
            where: {
                MembroId: membro.id,
                createdAt: {
                    [Op.gte]: new Date(new Date() - 4 * 30 * 24 * 60 * 60 * 1000)
                },
            },
        });

        if (totalDizimosMembro === 0) {
            mensagens.push(`⚠️ Alerta: O membro ${membro.nome} não fez dízimos nos últimos 4 meses. É importante incentivá-lo a participar.`);
        }
    }

    // 5. Notificações para membros que dízimam regularmente
    const membrosAtivos = await Membros.findAll({
        include: [{
            model: MembroComunity,
            where: { ComunityId: comunityId }
        }]
    });

    for (const membro of membrosAtivos) {
        const dizimosRegulares = await Dizimos.count({
            where: {
                MembroId: membro.id,
                createdAt: {
                    [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
                },
            },
        });

        if (dizimosRegulares > 0) {
            mensagens.push(`🎉 Bom trabalho! O membro ${membro.nome} tem contribuído com dízimos regularmente, ajudando a comunidade a prosperar.`);
        }
    }

    // Renderiza a página com as mensagens de notificação
    res.render('Ver/notificacoes', { mensagens });
});

module.exports = router;



// Exporte o router
module.exports = router;
