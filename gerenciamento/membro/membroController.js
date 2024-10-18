// membroController.js
const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');



// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Pasta onde as fotos serão armazenadas
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nome do arquivo
    }
});

const upload = multer({ storage: storage });









const Membro = require("./Membro");

const sequelize = require("sequelize");


const DadosEclesiais = require('../DadosMembros/Eclesiais');
const CursosTeologicos = require('../DadosMembros/CursoTeologico');
const Contatos = require('../DadosMembros/Contactos');
const Enderecos = require('../DadosMembros/Endereco');
const DadosAcademicos = require('../DadosMembros/DadosAcademicos');


const moment = require('moment'); // Adicione esta linha no topo do arquivo

// Exemplo de inserção de dados no seu código
const createdAt = moment().toDate();
const updatedAt = createdAt;





// Rota para renderizar o formulário de membros
router.get('/formulario-de-membros', async (req, res) => {
    try {
        // Obter o último membro cadastrado
        const ultimoMembro = await Membro.findOne({
            order: [['numero_membro', 'DESC']] // Ordena pelo número do membro de forma decrescente
        });

        // Gera o próximo número de membro
        let proximoNumeroMembro = '0000'; // Valor padrão

        if (ultimoMembro) {
            // Incrementa o número do último membro
            const ultimoNumero = parseInt(ultimoMembro.numero_membro, 10);
            proximoNumeroMembro = String(ultimoNumero + 1).padStart(4, '0'); // Preenche com zeros à esquerda
        }

        // Renderiza a página com o próximo número de membro
        res.render("entradas/membros", { proximoNumeroMembro });
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro ao carregar o formulário");
    }
});









router.post('/membros', upload.single('foto_membro'), async (req, res) => {
    try {
        const { numero_membro, nome, data_nascimento, estado_civil, nacionalidade, naturalidade, provincia, bi, data_admissao_bi, local_emissao_bi, genero } = req.body;
        let fotoPath = null;

        if (req.file) {
            fotoPath = path.join('uploads', req.file.filename);
        }

        const membro = await Membro.create({
            numero_membro,
            nome,
            data_nascimento,
            estado_civil,
            nacionalidade,
            naturalidade,
            provincia,
            bi,
            data_admissao_bi,
            local_emissao_bi,
            genero,
            foto_membro: fotoPath
        });

        // Redireciona para a página de cadastro de dados eclesiais
        res.redirect(`/dados-academicos/cadastrar/${membro.id}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao cadastrar membro.');
    }
});


router.get('/dados-academicos/cadastrar/:membroId', (req, res) => {
    const { membroId } = req.params;
    res.render('entradas/DadosAcademicos', { membroId });
});




router.post('/dados-academicos', async (req, res) => {
    try {
        const { membroId, habilitacoes_academicas, curso, especialidade, ano } = req.body;

        await DadosAcademicos.create({
            MembroId: membroId,
            habilitacoes_academicas,
            curso,
            especialidade,
            ano
        });

       // Redireciona para a página de cadastro de dados eclesiais
       res.redirect(`/dados-eclesiais/cadastrar/${membroId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao cadastrar dados acadêmicos.');
    }
});



const Departamentos = require("../DadosMembros/Departamento");




router.get('/dados-eclesiais/cadastrar/:membroId', async (req, res) => {
    const { membroId } = req.params;
    const departamentos = await Departamentos.findAll();
    res.render('entradas/DadosEclesiais', { membroId, departamentos });
});




router.get('/contatos/cadastrar/:membroId', (req, res) => {
    const { membroId } = req.params;
    res.render('entradas/Contatos', { membroId });
});



router.get('/Enderecos/cadastrar/:membroId', (req, res) => {
    const { membroId } = req.params;
    res.render('entradas/Enderecos', { membroId });
});


router.get('/cursos-teologicos/cadastrar/:membroId', (req, res) => {
    const { membroId } = req.params;
    res.render('entradas/CursosTeologicos', { membroId });
});



router.post('/dados-ensino-medio', async (req, res) => {
    try {
        const { membroId, curso_medio, instituicao_ensino, ano } = req.body;

        await CursosTeologicos.create({
            MembroId: membroId,
            curso_medio,
            instituicao_ensino,
            ano
        });

 // Redireciona para a página de cadastro de dados eclesiais
 res.redirect(`/Contatos/cadastrar/${membroId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao cadastrar dados de ensino médio.');
    }
});



router.post('/dados-contato', async (req, res) => {
    try {
        const { membroId, email, numero_telemovel } = req.body;

        await Contatos.create({
            MembroId: membroId,
            email,
            numero_telemovel
        });

        res.redirect(`/Enderecos/cadastrar/${membroId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao cadastrar dados de contato.');
    }
});

router.post('/dados-endereco', async (req, res) => {
    try {
        const { membroId, provincia, municipio, comuna, rua } = req.body;

        // Preenchendo os outros campos com "não é necessário"
        const enderecoData = {
            MembroId: membroId,
            provincia,
            municipio,
            comuna,
            rua,
            zona: 'não é necessário',
            quarteirao: 'não é necessário',
            bairro: 'não é necessário',
            bloco: 'não é necessário',
            predio: 'não é necessário',
            andar: 'não é necessário',
            apartamento: 'não é necessário'
        };

        await Enderecos.create(enderecoData);

        // Redireciona para o cartão do membro
        res.redirect(`/cartao/${membroId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao cadastrar dados de endereço.');
    }
});



router.get('/cartao/:id', async (req, res) => {
    const membroId = req.params.id;

    try {
        // Buscar dados do membro
        const membro = await Membro.findByPk(membroId);

        // Buscar dados eclesiais do membro
        const dadosEclesiais = await DadosEclesiais.findOne({
            where: { MembroId: membroId }
        });

        // Verifique se o membro e os dados eclesiais foram encontrados
        if (!membro || !dadosEclesiais) {
            return res.status(404).send('Membro ou dados eclesiais não encontrados.');
        }

        // Renderizar o cartão do membro
        res.render('Ver/cartao', { membro, dadosEclesiais });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao buscar dados do membro.');
    }
});






// Exemplo de rota no backend
router.get('/rota-para-buscar-membro/:id', async (req, res) => {
    const membroId = req.params.id;
    try {
        // Buscar o membro principal
        const membro = await Membro.findOne({ where: { id: membroId } });
        
        // Buscar dados eclesiais
        const dadosEclesiais = await DadosEclesiais.findOne({ where: { MembroId: membroId } });
        
        // Buscar endereço
        const endereco = await Enderecos.findOne({ where: { MembroId: membroId } });
        
        // Buscar dados acadêmicos
        const dadosAcademicos = await DadosAcademicos.findOne({ where: { MembroId: membroId } });
        
        // Retornar todos os dados em um único objeto
        res.json({ membro, dadosEclesiais, endereco, dadosAcademicos });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar os dados do membro' });
    }
});






const Sequelize = require("../database/database")



router.put('/rota-para-atualizar-membro/:id', upload.single('foto_membro'), async (req, res) => {
    const membroId = req.params.id;

    // Captura os dados do membro
    const {
        nome,
        funcao,
        categoria,
        situacao,
        dataBatismo,
        provincia,
        municipio,
        comuna,
    } = req.body;

    // Captura o arquivo da foto, se houver
    const fotoMembro = req.file ? req.file.filename : null;

    try {
        // Inicia uma transação
        await Sequelize.transaction(async (t) => {
            // Obtém os dados atuais do membro antes da atualização
            const membro = await Membro.findByPk(membroId);
            const fotoAtual = membro.foto_membro; // Armazena a foto atual

            // Atualiza a tabela do membro
            await Membro.update(
                {
                    nome,
                    foto_membro: fotoMembro || fotoAtual // Mantém a foto atual se nenhuma nova for enviada
                },
                { where: { id: membroId }, transaction: t }
            );

            // Atualiza a tabela DadoEclesial
            await DadosEclesiais.update(
                {
                    funcao,
                    categoria,
                    situacao,
                    dataBatismo
                },
                { where: { membroId: membroId }, transaction: t }
            );

            // Atualiza a tabela Endereco
            await Enderecos.update(
                {
                    provincia,
                    municipio,
                    comuna
                },
                { where: { membroId: membroId }, transaction: t }
            );
        });

        res.status(200).json({ message: 'Membro e dados relacionados atualizados com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar membro e dados relacionados:', error);
        res.status(500).json({ message: 'Erro ao atualizar membro e dados relacionados' });
    }
});


// Exporte o router
module.exports = router;












module.exports = router;
