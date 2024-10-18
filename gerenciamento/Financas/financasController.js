// membroController.js
const express = require('express');
const router = express.Router();

const Enderecos =require("../DadosMembros/Endereco")
const Dizimos = require('./Dizimos');
const Ofertas = require('./Ofertas');

const Despesas = require('./Despesas');

const Cuotas = require("../Financas/Cuotas");

const Contatos =require("../DadosMembros/Contactos")
const Membros = require("../membro/Membro");

const DadosEclesiais = require("../DadosMembros/Eclesiais");

const loading = require("../middlewere/loading")

const { Op } = require('sequelize');


const sequelize = require("sequelize");


router.get('/dizimos-pagina', async (req, res) => {
    try {
        // Busca todos os membros
        const membros = await Membros.findAll();
        res.render("entradas/Dizimos", { membros });
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
        await Dizimos.create({
            valor: parseFloat(valor), // Certifique-se de que o valor é um número
            MembroId: MembroId // O ID do dizimista
        });

        // Retorna um JSON para indicar sucesso
        res.json({ success: true });
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

        await Ofertas.create({
            valor: parseFloat(valor),
            data: data
        });

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






router.get('/ofertas-pagina', (req, res) => {
   

    res.render("entradas/Ofertas");

    
});





router.get('/relatorios', async (req, res) => {
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
router.get('/relatorio-gerado', (req, res) => {
    const membros = req.session.membrosResultados || [];
    res.render('Relatorios/relatorioGeradoMembros', { membros });
});



// Rota para renderizar o relatório gerado
router.get('/financas-page',  (req, res) => {
    
    res.render('layout/financapage');
});



// Rota para renderizar o relatório gerado
router.get('/ofertas-page', async (req, res) => {
    try {
        // Calculando o total de ofertas
        const totalOfertas = await Ofertas.sum('valor');

        // Calculando o total de despesas cuja origem é 'ofertas'
        const totalDespesasOfertas = await Despesas.sum('valor', {
            where: {
                origem: 'ofertas' // Filtra as despesas cuja origem é 'ofertas'
            }
        });

        // Calculando o saldo entre ofertas e despesas
        const saldo = totalOfertas - (totalDespesasOfertas || 0); // Se não houver despesas, considera 0

        // Obtendo as ofertas por mês do ano corrente
        const ofertasPorMes = await Ofertas.findAll({
            attributes: [
                [sequelize.fn('MONTH', sequelize.col('createdAt')), 'mes'],
                [sequelize.fn('SUM', sequelize.col('valor')), 'total']
            ],
            where: sequelize.where(sequelize.fn('YEAR', sequelize.col('createdAt')), sequelize.fn('YEAR', sequelize.fn('NOW'))),
            group: [sequelize.fn('MONTH', sequelize.col('createdAt'))],
            order: [[sequelize.fn('MONTH', sequelize.col('createdAt')), 'ASC']]
        });

        // Preparando os dados para o gráfico
        const meses = Array(12).fill(0);
        ofertasPorMes.forEach(oferta => {
            const mes = oferta.get('mes');
            const total = oferta.get('total');
            meses[mes - 1] = total;
        });

        // Renderizando a página com os dados
        res.render('layout/ofertas', {
            totalOfertas,
            totalDespesasOfertas, // Passando o total de despesas
            saldo, // Passando o saldo
            meses
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


router.get('/relatorio-estatistico', async (req, res) => {
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
        membrosPorDepartamento, // Passar os resultados dos departamentos para o render
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















router.post('/ofertas/total', async (req, res) => {
    const { periodo, despesaInserida } = req.body; // Incluindo despesaInserida

    let startDate;
    let endDate = new Date(); // Data atual

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
        // Buscando as ofertas no período especificado
        const totalOfertas = await Ofertas.sum('valor', {
            where: {
                createdAt: {
                    [Op.gte]: startDate,
                    [Op.lt]: endDate
                }
            }
        });

        // Buscando o número total de ofertas
        const numeroTotalOfertas = await Ofertas.count({
            where: {
                createdAt: {
                    [Op.gte]: startDate,
                    [Op.lt]: endDate
                }
            }
        });

        // Calculando a média de ofertas
        const mediaOfertas = numeroTotalOfertas > 0 ? (totalOfertas / numeroTotalOfertas) : 0;

        // Se o campo "despesaInserida" estiver preenchido, incluir as despesas
        let totalDespesas = 0;
        if (despesaInserida) {
            totalDespesas = await Despesas.sum('valor', {
                where: {
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
        const totalOfertasAnterior = await Ofertas.sum('valor', {
            where: {
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
            periodo
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











router.get('/dizimos-tabela', async (req, res) => {
    try {
        // Buscar os 10 dízimos mais recentes
        const dizimosRecentes = await Dizimos.findAll({
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
        res.render('layout/dizimosTabela', { recentDizimos });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar dados dos dízimos');
    }
});





router.get('/grafico-dizimo-dizimista', async (req, res) => {
    try {
        // Obter o ano atual
        const anoAtual = new Date().getFullYear();

        // Obter os totais de dízimos por membro do ano corrente
        const dizimosTotais = await Dizimos.findAll({
            attributes: [
                'MembroId', 
                [sequelize.fn('SUM', sequelize.col('valor')), 'totalDizimos']
            ],
            where: {
                createdAt: {
                    [Op.gte]: new Date(`${anoAtual}-01-01T00:00:00Z`), // A partir do primeiro dia do ano corrente
                    [Op.lt]: new Date(`${anoAtual + 1}-01-01T00:00:00Z`) // Até o último dia do ano corrente
                }
            },
            group: ['MembroId'],
            order: [[sequelize.literal('totalDizimos'), 'DESC']], // Ordenar pelo total
            limit: 10, // Limitar para os 10 principais membros
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
        res.render('layout/GraficoDizimoDizimista', { membros: membrosComDizimos });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar dados dos dízimos');
    }
});









router.get('/dizimos-dashboard', async (req, res) => {
    try {
        // Buscar todos os registros de dízimos
        const dizimos = await Dizimos.findAll();

        // Mapeamento dos meses
        const nomesDosMeses = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];

        // Pegar o ano atual
        const anoCorrente = new Date().getFullYear();

        // Agrupar os valores por mês apenas do ano corrente
        const valoresPorMes = {};

        dizimos.forEach(dizimo => {
            const dataDizimo = new Date(dizimo.createdAt);
            const anoDizimo = dataDizimo.getFullYear();
            const mes = dataDizimo.getMonth(); // Retorna o índice do mês (0-11)

            // Considerar apenas os dizimos do ano corrente
            if (anoDizimo === anoCorrente) {
                if (valoresPorMes[mes]) {
                    valoresPorMes[mes] += dizimo.valor;
                } else {
                    valoresPorMes[mes] = dizimo.valor;
                }
            }
        });

        // Preparar os dados para o gráfico
        const labels = Object.keys(valoresPorMes).map(mes => nomesDosMeses[mes]);
        const valores = Object.values(valoresPorMes);

        // Renderizar a página com os dados do gráfico
        res.render('layout/dizimos', { labels, valores });
    } catch (error) {
        console.error('Erro ao buscar os dízimos:', error);
        res.status(500).send('Erro ao carregar o dashboard');
    }
});







// Rota para visualizar os dízimos
router.get('/dizimos-choose-preview', async (req, res) => {
    try {
        // Buscar o total de todos os dízimos
        const totalDizimos = await Dizimos.sum('valor');

        // Buscar o total de dízimos apenas do ano corrente
        const totalDizimosAno = await Dizimos.sum('valor', {
            where: sequelize.where(sequelize.fn('YEAR', sequelize.col('createdAt')), new Date().getFullYear())
        });

        // Calcular o total de despesas com origem "dízimos" do ano corrente
        const totalDespesasAno = await Despesas.sum('valor', {
            where: {
                origem: 'dizimos', // Filtra apenas despesas de origem "dízimos"
                [sequelize.Op.and]: sequelize.where(sequelize.fn('YEAR', sequelize.col('createdAt')), new Date().getFullYear())
            }
        });

        // Calcular os dízimos restantes
        const dizimosRestantes = totalDizimosAno - (totalDespesasAno || 0);

        // Renderizar a página com os dados do total de dízimos e despesas
        res.render('layout/dizimospreview', {
            totalDizimos: totalDizimos || 0,
            totalDizimosAno: totalDizimosAno || 0,
            totalDespesasAno: totalDespesasAno || 0, // Define como 0 se não houver despesas
            dizimosRestantes
        });
    } catch (error) {
        console.error('Erro ao buscar os dízimos:', error);
        res.status(500).send('Erro ao carregar o dashboard');
    }
});










router.post('/dizimos/total', async (req, res) => {
    const { periodo, despesa_inserida } = req.body; // Captura o campo despesa_inserida

    let startDate;
    let endDate = new Date(); // Data atual
    
    // Definindo a data inicial e final com base no período selecionado
    switch (periodo) {
        case 'dia':
            // Para o período "dia", consideramos apenas hoje
            startDate = new Date(endDate); // Começa hoje
            endDate.setHours(23, 59, 59, 999); // Final do dia de hoje
            startDate.setHours(0, 0, 0, 0); // Início do dia de hoje
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
    
    // Agora, você pode usar startDate e endDate para buscar os dados no intervalo correto
    
    // Debugging: Exibir as datas
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);

    try {
        // Buscando os dízimos no período especificado
        const dizimos = await Dizimos.findAll({
            where: {
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
            const membroId = dizimo.MembroId; // Assumindo que você tem MembroId na tabela Dízimos
            if (!totalPorMembro[membroId]) {
                totalPorMembro[membroId] = { total: 0, quantidade: 0 };
            }
            totalPorMembro[membroId].total += dizimo.valor;
            totalPorMembro[membroId].quantidade += 1; // Contando o número de dízimos
            membrosIds.push(membroId); // Armazenando o ID do membro
        });

        // Buscando os membros correspondentes
        const membros = await Membros.findAll({
            where: {
                id: {
                    [Op.in]: membrosIds // Filtrando os membros com base nos IDs coletados
                }
            }
        });

        // Criando um objeto para armazenar os nomes dos membros
        const nomesPorMembro = {};
        membros.forEach(membro => {
            nomesPorMembro[membro.id] = membro.nome; // Armazenando os nomes dos membros pelo ID
        });

        // Total geral de dízimos
        const totalGeral = dizimos.reduce((acc, dizimo) => acc + dizimo.valor, 0);

        let totalDespesas = 0;
        if (despesa_inserida === 'despesa inserida') {
            // Aqui você deve implementar a lógica para buscar o total de despesas
            const despesas = await Despesas.findAll({
                where: {
                    origem: 'dizimos',
                    createdAt: {
                        [Op.gte]: startDate,
                        [Op.lt]: endDate
                    }
                }
            });

            // Total geral de despesas
            totalDespesas = despesas.reduce((acc, despesa) => acc + despesa.valor, 0);
        }

        const totalRestante = totalGeral - totalDespesas; // Calcula a oferta restante

        // Renderizando a página de relatórios com o total de dízimos, despesas e o período
        return res.render('Relatorios/dizimosTotal', { 
            totalGeral: totalGeral || 0, 
            totalDespesas: totalDespesas || 0, // Adicionando total de despesas à renderização
            totalRestante: totalRestante || 0, // Passando o total restante
            totalPorMembro, 
            nomesPorMembro,
            startDate,
            endDate
        });
    } catch (error) {
        console.error('Erro ao buscar dízimos:', error);
        return res.status(500).json({ message: 'Erro ao buscar dízimos' });
    }
});








// Rota para visualizar os dizimistas
router.get('/dizimistas-preview', async (req, res) => {
    try {
        // Total de dizimistas
        const totalDizimistas = await Membros.count();

        const membros = await Membros.findAll();

        // Total de dizimistas ativos este ano
        const anoAtual = new Date().getFullYear();

        // Buscar IDs dos membros que fizeram dízimos no ano corrente
        const dizimistasAtivos = await Dizimos.findAll({
            where: sequelize.where(sequelize.fn('YEAR', sequelize.col('createdAt')), anoAtual)
        });

        // Extrair os IDs dos membros
        const membroIds = dizimistasAtivos.map(dizimo => dizimo.MembroId);

        // Contar membros únicos
        const totalDizimistasAtivos = new Set(membroIds).size;

        // Renderizar a página com os dados
        res.render('layout/dizimistaPreview', {
            totalDizimistas,
            dizimistasAtivos: totalDizimistasAtivos,
            membros
        });
    } catch (error) {
        console.error('Erro ao buscar os dizimistas:', error);
        res.status(500).send('Erro ao carregar o dashboard');
    }
});



router.get('/listas-dizimistas', async (req, res) => {
    try {
      // Obter a data atual
      const agora = new Date();
      
      // Definir o início do mês corrente
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
      
      // Definir o fim do mês corrente
      const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);
  
      // Buscar todos os membros
      const membros = await Membros.findAll();
  
      // Buscar todos os dízimos do mês corrente
      const dizimosDoMes = await Dizimos.findAll({
        where: {
          createdAt: {
            [Op.between]: [inicioMes, fimMes],
          },
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
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar membros e dízimos' });
    }
  });
  




// Rota para listar e classificar dizimistas
router.get('/classes-dizimistas', async (req, res) => {
    try {
        // Buscar todos os membros
        const membros = await Membros.findAll();
    
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
            novos 
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao classificar os dizimistas');
    }
});































// Rota para listar dizimistas
router.get('/gerir-dizimistas', async (req, res) => {
    try {
        // Buscar todos os dizimistas
        const dizimistas = await Membros.findAll({
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
    return res.render('Ver/gerirDizimistas', { dizimistas: dizimistasData });
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

  






router.post('/dizimistas/total', async (req, res) => {
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
                sem_dados: true // Indicador para mostrar a mensagem de "sem dados"
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
router.get('/despesas-page', async (req, res) => {
    try {
  

        res.render("entradas/despesas")
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
        const novaDespesa = new Despesas({
            valor,
            motivo,
            comprovativo,
            origem // Adiciona a origem da despesa
        });

        // Salvar a despesa no banco de dados
        await novaDespesa.save();

        // Retornar uma resposta de sucesso
        res.status(201).json({ message: 'Despesa cadastrada com sucesso!', despesa: novaDespesa });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao cadastrar despesa.', error });
    }
});




























































// Rota para obter as pré-visualizações de despesas
router.get('/despesas-previews', async (req, res) => {
    try {
        // Obtendo os totais de despesas das origens
        const total_ofertas = await Despesas.sum('valor', { where: { origem: 'ofertas' } }) || 0;
        const total_dizimos = await Despesas.sum('valor', { where: { origem: 'dizimos' } }) || 0;
        const total_caixa_mae = await Despesas.sum('valor', { where: { origem: 'caixa_mae' } }) || 0; // Total da caixa mãe

        // Total de todas as despesas
        const total_geral = await Despesas.sum('valor') || 0;

        // Obtendo totais para o ano corrente (usando corretamente o campo createdAt)
        const anoCorrente = new Date().getFullYear();
        const total_ofertas_ano_corrente = await Despesas.sum('valor', {
            where: {
                origem: 'ofertas',
                createdAt: {
                    [Op.gte]: new Date(anoCorrente, 0, 1), // Primeiro dia do ano corrente
                    [Op.lt]: new Date(anoCorrente + 1, 0, 1), // Primeiro dia do próximo ano
                },
            },
        }) || 0;

        const total_dizimos_ano_corrente = await Despesas.sum('valor', {
            where: {
                origem: 'dizimos',
                createdAt: {
                    [Op.gte]: new Date(anoCorrente, 0, 1),
                    [Op.lt]: new Date(anoCorrente + 1, 0, 1),
                },
            },
        }) || 0;

        const total_caixa_mae_ano_corrente = await Despesas.sum('valor', {
            where: {
                origem: 'caixa_mae',
                createdAt: {
                    [Op.gte]: new Date(anoCorrente, 0, 1),
                    [Op.lt]: new Date(anoCorrente + 1, 0, 1),
                },
            },
        }) || 0;

        // Total de todas as despesas no ano corrente
        const total_geral_ano_corrente = await Despesas.sum('valor', {
            where: {
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
            total_geral_ano_corrente, // Adicionando o total de despesas no ano corrente
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar dados' });
    }
});





























// Rota para buscar os totais de despesas por origem e exibir o gráfico
router.get('/grafico-despezas', async (req, res) => {
    try {
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
                    }
                };
                break;
            case 'semana':
                const inicioSemana = new Date();
                inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
                whereCondition = {
                    createdAt: {
                        [sequelize.Op.between]: [inicioSemana.setHours(0, 0, 0, 0), new Date()]
                    }
                };
                break;
            case 'mes':
                const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                whereCondition = {
                    createdAt: {
                        [sequelize.Op.between]: [inicioMes, new Date()]
                    }
                };
                break;
            case 'trimestre':
                const trimestre = Math.floor(new Date().getMonth() / 3);
                const inicioTrimestre = new Date(new Date().getFullYear(), trimestre * 3, 1);
                whereCondition = {
                    createdAt: {
                        [sequelize.Op.between]: [inicioTrimestre, new Date()]
                    }
                };
                break;
            case 'ano':
            default:
                whereCondition = {
                    createdAt: {
                        [sequelize.Op.between]: [inicioAno, fimAno]
                    }
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
        res.render('ver/graficoDespezas', { labels, valores, periodo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar as despesas' });
    }
});

























// Rota para buscar despesas e gerar gráfico de despesas por mês
router.get('/grafico-de-despeza-por-mes', async (req, res) => {
    try {
        // Supondo que você tenha um modelo de Despesa configurado com Sequelize
        const despesas = await Despesas.findAll({
            attributes: [
                [sequelize.fn('MONTH', sequelize.col('createdAt')), 'mes'], // Agrupa pelo mês
                [sequelize.fn('SUM', sequelize.col('valor')), 'total'] // Soma os valores
            ],
            group: ['mes'],
            order: [[sequelize.fn('MONTH', sequelize.col('createdAt')), 'ASC']] // Ordena por mês
        });

        // Converte os dados para um formato que pode ser usado pelo gráfico
        const dadosGrafico = despesas.map(d => ({
            mes: d.dataValues.mes,
            total: d.dataValues.total
        }));

        res.render("Ver/GraficoDespezaMes", { dadosGrafico });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar despesas' });
    }
});










// Rota para gerar o relatório de despesas
router.post('/despesas/relatorio', async (req, res) => {
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
        // Construir a condição da consulta
        const whereCondition = {
            createdAt: {
                [Op.between]: [startDate, endDate] // Filtrar entre startDate e endDate
            }
        };

        // Adicionar condição de origem se não for "todas as origens"
        if (origem && origem !== 'todas') {
            whereCondition.origem = origem;
        }

        // Buscar os gastos com as condições definidas
        const despesas = await Despesas.findAll({ where: whereCondition });

        // Calcular o total de despesas
        const totalDespesas = despesas.reduce((total, despesa) => total + despesa.valor, 0);

        // Renderizar a página com as despesas, total, e variáveis
        res.render('Relatorios/RelatorioDespesas', { despesas, totalDespesas, periodo, origem });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao gerar o relatório' });
    }
});






















































































  

router.get('/relatorio-geral-page', async (req, res) => {
    try {
        // Cálculos
        const totalOfertas = await Ofertas.sum('valor') || 0;
        const totalDizimos = await Dizimos.sum('valor') || 0;
        const totalDespesas = await Despesas.sum('valor') || 0;
        const saldo = totalOfertas + totalDizimos - totalDespesas;

        // Desempenho Anual
        const currentYear = new Date().getFullYear();
        const lastYear = currentYear - 1;

        const ofertasAnoAtual = await Ofertas.sum('valor', {
            where: {
                createdAt: {
                    [Op.gte]: new Date(currentYear, 0, 1),
                    [Op.lt]: new Date(currentYear + 1, 0, 1)
                }
            }
        }) || 0;

        const ofertasAnoAnterior = await Ofertas.sum('valor', {
            where: {
                createdAt: {
                    [Op.gte]: new Date(lastYear, 0, 1),
                    [Op.lt]: new Date(currentYear, 0, 1)
                }
            }
        }) || 0;

        const dizimosAnoAtual = await Dizimos.sum('valor', {
            where: {
                createdAt: {
                    [Op.gte]: new Date(currentYear, 0, 1),
                    [Op.lt]: new Date(currentYear + 1, 0, 1)
                }
            }
        }) || 0;

        const dizimosAnoAnterior = await Dizimos.sum('valor', {
            where: {
                createdAt: {
                    [Op.gte]: new Date(lastYear, 0, 1),
                    [Op.lt]: new Date(currentYear, 0, 1)
                }
            }
        }) || 0;

        const despesasAnoAtual = await Despesas.sum('valor', {
            where: {
                createdAt: {
                    [Op.gte]: new Date(currentYear, 0, 1),
                    [Op.lt]: new Date(currentYear + 1, 0, 1)
                }
            }
        }) || 0;

        const despesasAnoAnterior = await Despesas.sum('valor', {
            where: {
                createdAt: {
                    [Op.gte]: new Date(lastYear, 0, 1),
                    [Op.lt]: new Date(currentYear, 0, 1)
                }
            }
        }) || 0;

        const crescimentoOfertas = ofertasAnoAnterior
            ? ((ofertasAnoAtual - ofertasAnoAnterior) / ofertasAnoAnterior) * 100
            : 0;

        const crescimentoDizimos = dizimosAnoAnterior
            ? ((dizimosAnoAtual - dizimosAnoAnterior) / dizimosAnoAnterior) * 100
            : 0;

        const crescimentoDespesas = despesasAnoAnterior
            ? ((despesasAnoAtual - despesasAnoAnterior) / despesasAnoAnterior) * 100
            : 0;

        // Identificando a contribuição com maior crescimento
        const crescimentoContribuicoes = [
            { tipo: 'Ofertas', crescimento: crescimentoOfertas },
            { tipo: 'Dízimos', crescimento: crescimentoDizimos },
            { tipo: 'Despesas', crescimento: crescimentoDespesas }
        ];

        const maiorCrescimento = crescimentoContribuicoes.reduce((prev, current) => {
            return current.crescimento > prev.crescimento ? current : prev;
        });

        // Metas de arrecadação e despesas
        const metaArrecadacao = 500000.00; // Defina sua meta de arrecadação aqui
        const metaDespesas = 10000000.00;   // Defina sua meta de despesas aqui
        const totalArrecadado = totalOfertas + totalDizimos;

        const porcentagemArrecadacao = (totalArrecadado > 0)
        ? Number(((totalArrecadado / metaArrecadacao) * 100).toFixed(2))
        : 0;
    
    const porcentagemDespesas = (totalDespesas > 0)
        ? Number(((totalDespesas / metaDespesas) * 100).toFixed(2))
        : 0;
    

        // Log para verificar valores
        console.log('Total Arrecadado:', totalArrecadado);
        console.log('Total Despesas:', totalDespesas);
        console.log('Porcentagem Arrecadação:', porcentagemArrecadacao);
        console.log('Porcentagem Despesas:', porcentagemDespesas);

        // Notificações
        const notificacoes = [];
        const receitasTotais = totalOfertas + totalDizimos;

        if (totalDespesas > receitasTotais) {
            notificacoes.push('Alerta: As despesas superaram as receitas.');
        }
        if (totalDespesas >= receitasTotais * 0.9) {
            notificacoes.push('Alerta: As despesas estão perto de superar as receitas.');
        }

        // Renderizar a página
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
            maiorCrescimento // Passando o maior crescimento para a página
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar dados do relatório geral.' });
    }
});




router.get('/api/relatorio-geral', async (req, res) => {
    try {
        const periodo = req.query.periodo;
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

        // Obtendo os valores filtrados com base no período
        const totalOfertas = await Ofertas.sum('valor', {
            where: {
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            }
        }) || 0;

        const totalDizimos = await Dizimos.sum('valor', {
            where: {
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            }
        }) || 0;

        const totalDespesas = await Despesas.sum('valor', {
            where: {
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            }
        }) || 0;

        // Enviando os dados filtrados como resposta
        res.json({ totalOfertas, totalDizimos, totalDespesas });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar dados do relatório geral.' });
    }
});










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

        // Variáveis para armazenar resultados de cada busca e totais
        let dizimosResultado = null;
        let ofertasResultado = null;
        let despesasResultado = null;
        let totalDizimos = 0;
        let totalOfertas = 0;
        let totalDespesas = 0;

        // Buscas para cada item selecionado usando Sequelize
        if (itensSelecionados.includes('dizimos') || itensSelecionados.includes('geral')) {
            // Buscando dízimos com nomes dos dizimistas
            dizimosResultado = await connection.query(
                `SELECT membros.nome AS dizimistaNome, SUM(dizimos.valor) AS totalValor
                 FROM dizimos
                 JOIN membros ON dizimos.MembroId = membros.id
                 WHERE dizimos.createdAt BETWEEN :startDate AND :endDate
                 GROUP BY membros.nome`,
            {
                replacements: { startDate, endDate },
                type: sequelize.QueryTypes.SELECT
            });

            // Calculando o total de dízimos
            totalDizimos = dizimosResultado.reduce((acc, dizimo) => acc + dizimo.totalValor, 0);
        }

        if (itensSelecionados.includes('ofertas') || itensSelecionados.includes('geral')) {
            // Buscando ofertas
            ofertasResultado = await Ofertas.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            });

            // Calculando o total de ofertas
            totalOfertas = ofertasResultado.reduce((acc, oferta) => acc + oferta.valor, 0);
        }

        if (itensSelecionados.includes('despesas') || itensSelecionados.includes('geral')) {
            // Buscando despesas
            despesasResultado = await Despesas.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            });

            // Calculando o total de despesas
            totalDespesas = despesasResultado.reduce((acc, despesa) => acc + despesa.valor, 0);
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
router.get('/Geral', (req, res) => {
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
        totalDespesas
    });
});


























const Notificacoes = require("../Nota/Notificacao");
const { Connection } = require('puppeteer');


 connection = require("../database/database");



// Rota para exibir notificações
router.get('/notificacoes', async (req, res) => {
    try {
        // 1. Total de Ofertas
        const totalOfertas = await Ofertas.sum('valor') || 0;

        // 2. Total de Gastos com origem 'Ofertas'
        const totalGastosOfertas = await Despesas.sum('valor', {
            where: { origem: 'Ofertas' },
        }) || 0;

        // 3. Total de Dízimos
        const totalDizimos = await Dizimos.sum('valor') || 0;

        // 4. Total de Gastos com origem 'Dízimos'
        const totalGastosDizimos = await Despesas.sum('valor', {
            where: { origem: 'Dízimos' },
        }) || 0;

        // 5. Total de Gastos com origem 'Caixa Mãe'
        const totalGastosCaixaMae = await Despesas.sum('valor', {
            where: { origem: 'caixa_mae' },
        }) || 0;

        // 6. Total de Membros que não dizimaram por um mês ou mais
        const dataLimite = new Date(new Date() - 30 * 24 * 60 * 60 * 1000);
        const membrosSemDizimo = await Membros.findAll({
            where: {
                id: {
                    [Op.notIn]: connection.literal(`(SELECT MembroId FROM Dizimos WHERE createdAt >= '${dataLimite.toISOString()}')`)
                }
            }
        });

        // Lista para armazenar as notificações detalhadas
        let mensagensNotificacoes = [];

        // Função para adicionar notificações com tipo
        function adicionarNotificacao(tipo, mensagem) {
            mensagensNotificacoes.push({ tipo, mensagem });
        }

        // Lógica para gerar mensagens específicas
        if (totalGastosOfertas >= totalOfertas - 3000) {
            adicionarNotificacao("ma", "Os gastos com ofertas estão se aproximando ou já superaram o total arrecadado em ofertas.");
        }

        if (totalGastosDizimos >= totalDizimos - 3000) {
            adicionarNotificacao("ma", "Os gastos com dízimos estão se aproximando ou já superaram o total arrecadado em dízimos.");
        }

        if (totalGastosCaixaMae >= (totalOfertas + totalDizimos) - 3000) {
            adicionarNotificacao("ma", "Os gastos do caixa mãe estão se aproximando ou já superaram o total combinado de ofertas e dízimos.");
        }

        // Verifica se há membros que não dizimaram no último mês
        if (membrosSemDizimo.length > 0) {
            const nomesMembros = membrosSemDizimo.map(membro => membro.nome).join(', ');
            adicionarNotificacao("ma", `Os seguintes membros não contribuíram com dízimos nos últimos 30 dias: ${nomesMembros}.`);
        }

        // 7. Membros que mais estão dizimando (limitando a 5 membros)
        const membrosMaisDizimistas = await connection.query(`
            SELECT Membros.nome, SUM(Dizimos.valor) AS totalDizimos
            FROM Membros
            LEFT JOIN Dizimos ON Membros.id = Dizimos.MembroId
            GROUP BY Membros.id
            ORDER BY totalDizimos DESC
            LIMIT 5;
        `);

        if (membrosMaisDizimistas[0].length > 0) {
            const nomesDizimistas = membrosMaisDizimistas[0].map(membro => membro.nome).join(', ');
            adicionarNotificacao("boa", `Os seguintes membros estão contribuindo mais com dízimos: ${nomesDizimistas}.`);
        }

        // 8. Lembrete de Dízimos - apenas se estamos nos últimos dias do mês
        const diaAtual = new Date().getDate();
        if (diaAtual >= 25) {
            adicionarNotificacao("ma", "Lembrete: O prazo para a contribuição do dízimo deste mês se encerra em breve.");
        }

        // 9. Dízimos em Declínio
        const membrosDizimosDeclinados = await Membros.findAll({
            where: {
                id: {
                    [Op.notIn]: connection.literal(`(SELECT MembroId FROM Dizimos WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 3 MONTH))`)
                }
            }
        });

        if (membrosDizimosDeclinados.length > 0) {
            const nomesDeclinados = membrosDizimosDeclinados.map(membro => membro.nome).join(', ');
            adicionarNotificacao("ma", `Os seguintes membros não contribuíram com dízimos nos últimos três meses: ${nomesDeclinados}.`);
        }

        const totalContribuicoes = totalOfertas + totalDizimos;
        const totalGastos = totalGastosOfertas + totalGastosDizimos + totalGastosCaixaMae;

        if (totalGastos >= totalContribuicoes) {
            adicionarNotificacao("ma", "Os gastos totais agora são iguais ou superiores ao total de contribuições recebidas de ofertas e dízimos.");
        }

        // Renderiza a página EJS com as notificações
        res.render('Ver/notificacoes', { notificacoes: mensagensNotificacoes });
    } catch (error) {
        console.error('Erro ao buscar notificações:', error);
        res.status(500).send('Erro ao buscar notificações');
    }
});

module.exports = router;












router.get('/notificacoes', async (req, res) => {
    try {
        // 1. Total de Ofertas
        const totalOfertas = await Ofertas.sum('valor');

        // 2. Total de Gastos com origem 'Ofertas'
        const totalGastosOfertas = await Despesas.sum('valor', {
            where: { origem: 'Ofertas' },
        });

        // 3. Total de Dízimos
        const totalDizimos = await Dizimos.sum('valor');

        // 4. Total de Gastos com origem 'Dízimos'
        const totalGastosDizimos = await Despesas.sum('valor', {
            where: { origem: 'Dízimos' },
        });

        // 5. Total de Gastos com origem 'Caixa Mãe'
        const totalGastosCaixaMae = await Despesas.sum('valor', {
            where: { origem: 'caixa_mae' },
        });

        // 6. Total de Membros que não dizimaram por um mês ou mais
        const dataLimite = new Date(new Date() - 30 * 24 * 60 * 60 * 1000);
        const membrosSemDizimo = await Membros.findAll({
            where: {
                id: {
                    [Op.notIn]: sequelize.literal(`(SELECT MembroId FROM Dizimos WHERE createdAt >= '${dataLimite.toISOString()}')`)
                }
            }
        });

        // Lista para armazenar as notificações detalhadas
        let mensagensNotificacoes = [];

        // Lógica para gerar mensagens específicas
        if (totalGastosOfertas >= totalOfertas - 3000) {
            mensagensNotificacoes.push("Os gastos provenientes das ofertas estão próximos ou excederam o valor total arrecadado em ofertas.");
        }

        if (totalGastosDizimos >= totalDizimos - 3000) {
            mensagensNotificacoes.push("Os gastos provenientes dos dízimos estão próximos ou excederam o valor total arrecadado em dízimos.");
        }

        if (totalGastosCaixaMae >= (totalOfertas + totalDizimos) - 3000) {
            mensagensNotificacoes.push("Os gastos provenientes do caixa mãe estão próximos ou excederam o valor total de ofertas e dízimos combinados.");
        }

        // Verifica se há membros que não dizimaram no último mês
        if (membrosSemDizimo.length > 0) {
            const nomesMembros = membrosSemDizimo.map(membro => membro.nome).join(', ');
            mensagensNotificacoes.push(`Os seguintes membros não contribuíram com dízimos nos últimos 30 dias: ${nomesMembros}.`);
        }

        const totalContribuicoes = totalOfertas + totalDizimos;
        const totalGastos = totalGastosOfertas + totalGastosDizimos + totalGastosCaixaMae;

        if (totalGastos >= totalContribuicoes) {
            mensagensNotificacoes.push("O total de gastos superou ou igualou o total de contribuições (ofertas e dízimos).");
        }

        // Renderiza a página EJS com as notificações
        res.render('Ver/notificacoes', { notificacoes: mensagensNotificacoes });
    } catch (error) {
        console.error('Erro ao buscar notificações:', error);
        res.status(500).send('Erro ao buscar notificações');
    }
});





// Rota para renderizar a página de quotas
router.get('/quotas-pagina', async (req, res) => {
    try {
        // Supondo que você tenha um modelo de Departamento para buscar os departamentos
        const departamentos = await Departamentos.findAll();
        
        // Renderizando a página e passando os departamentos
        res.render("entradas/quotas", { departamentos });
    } catch (error) {
        console.error("Erro ao buscar departamentos:", error);
        res.status(500).send("Erro ao carregar a página.");
    }
});





// Rota para renderizar a página de quotas
router.get('/departamento-pagina', async (req, res) => {
    try {
       
        // Renderizando a página e passando os departamentos
        res.render("entradas/Departamentos");
    } catch (error) {
        console.error("Erro ao buscar departamentos:", error);
        res.status(500).send("Erro ao carregar a página.");
    }
});




router.post('/criar-quota', async (req, res) => {
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

        res.render("entradas/quotas", {departamentos})
    } catch (error) {
        console.error("Erro ao cadastrar a quota:", error);
        res.status(500).json({ message: "Erro ao cadastrar a quota." });
    }
});




router.post('/criar-departamento', async (req, res) => {
    console.log('Corpo da requisição:', req.body); // Adicione esta linha para debugar
    const { nomeDepartamento } = req.body;


    try {
        const novaQuota = await Departamentos.create({
            nomeDepartamento
        });

        
        res.render("entradas/Departamentos");


    } catch (error) {
        console.error("Erro ao cadastrar a quota:", error);
        res.status(500).json({ message: "Erro ao cadastrar a quota." });
    }
});









// Rota para renderizar a página de quotas
router.get('/quotas-previews', async (req, res) => {
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
            quotasPagasTrimestre
        });
    } catch (error) {
        console.error("Erro ao buscar departamentos:", error);
        res.status(500).send("Erro ao carregar a página.");
    }
});


// Rota para buscar quotas pagas e não pagas neste trimestre
router.get('/quotas-status', async (req, res) => {
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
            quotasNaoPagas: departamentosNaoPagos
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







// Exporte o router
module.exports = router;
