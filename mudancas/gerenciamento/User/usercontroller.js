// membroController.js
const express = require('express');
const router = express.Router();



const contarNotificacoes = require("../middlewere/notificacao");

router.use(contarNotificacoes)

const Comunity = require("../comunity/Comunity");

const Utilizador = require("./User");


const status = require("./Status");


const utilizadorcomunity = require("../comunity/UserComunity");

const { Op } = require('sequelize');


const sequelize = require("sequelize");


const verificarStatusAprovado = require("../middlewere/userPendentes");

const isAdmin = require("../middlewere/isadmin");

// Rota para renderizar o formulário
router.get("/user-form", (req, res) => {
    res.render("entradas/user", { error: null }); // Passa um valor nulo para a mensagem de erro
});


const bcrypt = require('bcryptjs'); // Importa o bcryptjs







// Rota para cadastrar novos usuários
router.post('/usuarios/cadastrar', async (req, res) => {
    const { pnome, unome, pass } = req.body;

    // Verificar se a senha possui pelo menos 3 caracteres
    if (pass.length < 5) {
        return res.render("entradas/user", { error: 'A senha deve ter no mínimo 5 caracteres.' });
    }

    // Verificar se a comunidade está na sessão do utilizador
    const comunityId = req.session.utilizador?.comunityId;
    if (!comunityId) {
        return res.status(403).json({ message: 'Comunidade não especificada na sessão.' });
    }

    try {
        const usuariosExistentes = await Utilizador.findAll();

        // Verificar se a senha já está em uso
        for (const usuario of usuariosExistentes) {
            const senhaMatch = await bcrypt.compare(pass, usuario.pass);
            if (senhaMatch) {
                return res.render("entradas/user", { error: 'Já existe um usuário com esta senha.' });
            }
        }

        // Criptografar a nova senha
        const hashedPassword = await bcrypt.hash(pass, 10);

        // Inserir o novo usuário na tabela 'utilizadors' com o tipo 'normal'
        const novoUtilizador = await Utilizador.create({
            pnome: pnome,
            unome: unome,
            pass: hashedPassword,
            type_user: 'normal',
            ComunityId: comunityId // Associa o usuário à comunidade diretamente
        });

        // Inserir o novo status para o usuário com status padrão "pendente"
        await status.create({
            status: 'pendente',
            ComunityId: comunityId,
            usuario2Id: novoUtilizador.id
        });

        // Atualizar a sessão do usuário com mais detalhes
        req.session.utilizador = {
            ...req.session.utilizador,
            id: novoUtilizador.id,
            pnome: novoUtilizador.pnome,
            unome: novoUtilizador.unome,
            type_user: novoUtilizador.type_user
        };

        // Redirecionar o usuário para a página de conta pendente
        res.render("status/contaPendente");
    } catch (error) {
        console.error('Erro ao cadastrar o usuário:', error);
        return res.status(500).json({ message: 'Erro ao cadastrar o usuário' });
    }
});
 

// Rota para renderizar o formulário de login
router.get('/login', contarNotificacoes, (req, res) => {
    res.render('entradas/login', { error: null, notificacoes:  req.notificacoes }); // Inicializa a mensagem de erro como null
});








// Rota para promover usuário a admin
router.post('/admin/promover/:id', async (req, res) => {
    try {
        const utilizador = await Utilizador.findByPk(req.params.id); // Busca o usuário pelo ID
        if (utilizador) {
            utilizador.type_user = 'admin'; // Atualiza o tipo de usuário para 'admin'
            await utilizador.save(); // Salva no banco de dados
        }
        res.redirect('/admin/gerenciar-usuarios'); // Redireciona de volta para a página de gerenciamento
    } catch (error) {
        console.error('Erro ao promover usuário:', error);
        res.status(500).send('Erro ao promover usuário');
    }
});


// Rota para rebaixar admin a usuário comum
router.post('/admin/rebaixar/:id', async (req, res) => {
    try {
        const utilizador = await Utilizador.findByPk(req.params.id); // Busca o usuário pelo ID
        if (utilizador && utilizador.type_user === 'admin') { // Garante que só rebaixa admins
            utilizador.type_user = 'normal'; // Atualiza o tipo para 'normal'
            await utilizador.save(); // Salva no banco de dados
        }
        res.redirect('/admin/gerenciar-usuarios'); // Redireciona de volta à página de gerenciamento
    } catch (error) {
        console.error('Erro ao rebaixar usuário:', error);
        res.status(500).send('Erro ao rebaixar usuário');
    }
});










// Rota para gerenciar usuários
router.get('/admin/gerenciar-usuarios',isAdmin, async (req, res) => {
    // Acessa o comunityId direto do objeto utilizador na sessão
    const comunityId = req.session.utilizador?.comunityId;

    if (!comunityId) {
        return res.render('AcessoNegado/NoComunity');
    }

    const utilizadorSessao = req.session.utilizador;

    try {
        let utilizadores;
        let comunidades = [];

        // Carrega todas as comunidades e todos os usuários se for super_admin
        if (utilizadorSessao.type_user === 'super_admin') {
            comunidades = await Comunity.findAll(); // Busca todas as comunidades

            utilizadores = await Utilizador.findAll({
                where: {
                    id: { [Op.ne]: utilizadorSessao.id } // Exclui o usuário atual
                }
            });
        } else {
            // Busca apenas os usuários da mesma comunidade do usuário logado
            utilizadores = await Utilizador.findAll({
                where: {
                    ComunityId: comunityId,
                    id: { [Op.ne]: utilizadorSessao.id } // Exclui o usuário atual
                }
            });
        }

        res.render('admin/gerenciar-usuarios', { 
            usuarios: utilizadores,
            comunidades, // Envia a lista de comunidades para a view
            isSuperAdmin: utilizadorSessao.type_user === 'super_admin', // Verifica se é super_admin
        });
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).send('Erro ao buscar usuários');
    }
});


router.get('/admin/filtrar-usuarios/:comunityId', async (req, res) => {
    const comunityId = req.params.comunityId;

    try {
        let usuarios;

        if (comunityId === 'todos') {
            // Se o ID for 'todos', retorna todos os usuários
            usuarios = await Utilizador.findAll(); // Busca todos os usuários
        } else {
            // Filtra os usuários que pertencem à comunidade selecionada
            usuarios = await Utilizador.findAll({
                where: { ComunityId: comunityId } // Filtra diretamente no campo ComunityId
            });
        }

        // Retorna os usuários como JSON
        res.json({ usuarios });
    } catch (error) {
        console.error('Erro ao filtrar usuários:', error);
        res.status(500).json({ error: 'Erro ao filtrar usuários' });
    }
});


//--------------------- LOGIN -----------------------------------//

// Rota para autenticar usuários
router.post('/usuarios/login', async (req, res) => {
    const { pnome, pass } = req.body;
  
    try {
        // Buscar o usuário pelo primeiro nome
        const usuario = await Utilizador.findOne({ where: { pnome } });
  
        if (!usuario) {
            return res.render("entradas/login", { error: 'Usuário não encontrado.' });
        }
  
        // Verifica a senha
        const senhaCorreta = await bcrypt.compare(pass, usuario.pass);
        if (!senhaCorreta) {
            return res.render("entradas/login", { error: 'Senha incorreta.' });
        }
  
        // Verifica se o usuário possui um ComunityId associado
        if (!usuario.ComunityId) {
            return res.render("entradas/login", { error: 'Comunidade não associada ao usuário.' });
        }
  
        // Iniciar a sessão do usuário e da comunidade dentro do objeto utilizador
        req.session.utilizador = {
            id: usuario.id,
            pnome: usuario.pnome,
            unome: usuario.unome,
            type_user: usuario.type_user,
            comunityId: usuario.ComunityId
        };

        console.log(req.session.utilizador);
  
        res.redirect('/');
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        return res.render("entradas/login", { error: 'Erro ao fazer login. Tente novamente.' });
    }
});

  // -------------------------------------------------------------





// Rota para exibir os usuários pendentes
router.get('/usuarios-pendentes', isAdmin, async (req, res) => {
    try {
        const usuariosPendentes = await Utilizador.findAll({
            include: [{
                model: status,
                where: { status: 'pendente' },
                attributes: ['status', 'createdAt'],
            }],
            attributes: ['id', 'pnome', 'unome'],
        });

        res.render('status/usuariosPendentes', { usuarios: usuariosPendentes });
    } catch (error) {
        console.error('Erro ao buscar usuários pendentes:', error);
        return res.status(500).json({ message: 'Erro ao buscar usuários pendentes' });
    }
});








// Rota para aprovar o usuário
router.post('/aprovar-usuario',isAdmin, async (req, res) => {
    const { usuarioId } = req.body;

    // Verifique se o ID está sendo recebido
    console.log('ID do usuário para aprovar:', usuarioId);

    try {
        // Atualizar o status do usuário para "aprovado"
        await status.update(
            { status: 'aprovado' },
            { where: { usuario2Id: usuarioId, status: 'pendente' } }
        );

        // Redireciona de volta para a página de usuários pendentes
        res.redirect('/usuarios-pendentes');
    } catch (error) {
        console.error('Erro ao aprovar o usuário:', error);
        return res.status(500).json({ message: 'Erro ao aprovar o usuário' });
    }
});


const Oferta = require("../Financas/Ofertas");
const Dizimo = require("../Financas/Dizimos");
const Despesa = require("../Financas/Despesas")
const OfertaComunities = require("../comunity/OfertaComunity");
const DizimoComunities = require("../comunity/DizimoComunity")
const DespesaComunities = require("../comunity/DespesaComunity");




// Rota para obter o perfil do usuário
router.get('/perfil',contarNotificacoes, verificarStatusAprovado, async (req, res) => {
    if (!req.session.utilizador) {
        return res.status(401).send('Não autorizado'); // redirecionar para login se não estiver logado
    }

    const usuario = req.session.utilizador;

    try {
        // Obter informações do usuário
        const perfil = await Utilizador.findOne({
            where: { id: usuario.id },
            include: {
                model: Comunity,
                attributes: ['nome'], 
            }
        });

        if (!perfil) {
            return res.status(404).send('Usuário não encontrado');
        }

        // Dados do perfil
        const dadosPerfil = {
            nome: `${perfil.pnome} ${perfil.unome}`,
            dataCriacao: perfil.createdAt,
            comunidade: perfil.Comunity.nome, // Usar "nome" em vez de "name"
            type_user: perfil.type_user,
            usuarios: [], // Inicializa como um array vazio
            todasComunidades: [] // Inicializa como um array vazio
        };

        // Adicionar dados específicos para cada tipo de usuário
        if (perfil.type_user === 'admin') {
            dadosPerfil.usuarios = await obterMembrosComunidade(perfil.ComunityId);
        } else if (perfil.type_user === 'super_admin') {
            dadosPerfil.todasComunidades = await obterTodasComunidades();
        }

        res.render('admin/perfil', { perfil: dadosPerfil,  notificacoes:  req.notificacoes }); // renderizar a página de perfil
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao obter dados do perfil');
    }
});
   




// Função para obter todas as comunidades
const obterTodasComunidades = async () => {
    try {
        const comunidades = await Comunity.findAll();
        return comunidades;
    } catch (error) {
        console.error('Erro ao obter comunidades:', error);
        throw error;
    }
};

// Função para obter membros da comunidade
const obterMembrosComunidade = async (comunidadeId) => {
    try {
        const membros = await Utilizador.findAll({
            where: { ComunityId: comunidadeId }
        });
        return membros;
    } catch (error) {
        console.error('Erro ao obter membros da comunidade:', error);
        throw error;
    }
};



const perfilUsuario = async (req, res) => {
    try {
        const usuarioId = req.session.utilizador.id;
        const usuario = await Utilizador.findByPk(usuarioId);
        const membros = await obterMembrosComunidade(req.session.utilizador.ComunidadeId);
        const comunidades = await obterTodasComunidades();

        const perfil = {
            nome: `${usuario.pnome} ${usuario.unome}`,
            dataCriacao: usuario.createdAt,
            type_user: usuario.type_user,
            usuarios: membros // Lista de usuários na comunidade
        };

        // Para super_admin, não adicione a comunidade ao perfil
        if (usuario.type_user !== 'super_admin') {
            perfil.comunidade = req.session.utilizador.ComunidadeId; // Adicione a comunidade se não for super_admin
        }

        res.render('admin/perfil', { perfil, comunidades,  notificacoes:  req.notificacoes });
    } catch (error) {
        console.error('Erro ao carregar perfil do usuário:', error);
        res.status(500).send('Erro ao carregar perfil do usuário');
    }
};



// Rota para cadastrar novos usuários
router.get('/form-superAdmin', async (req, res) => {
   
        // Redirecionar o usuário para a página de conta pendente
        res.render("formSuperAdmin" , { error: null });
    
});
 



// Rota para cadastrar novos usuários
router.post('/create-superAdmin', async (req, res) => {
    const { pnome, unome, pass } = req.body;


    // Verificar se a comunidade está na sessão do utilizador
    const comunityId = req.session.utilizador?.comunityId;
    if (!comunityId) {
        return res.status(403).json({ message: 'Comunidade não especificada na sessão.' });
    }

    try {
        const usuariosExistentes = await Utilizador.findAll();

        // Verificar se a senha já está em uso
        for (const usuario of usuariosExistentes) {
            const senhaMatch = await bcrypt.compare(pass, usuario.pass);
            if (senhaMatch) {
                return res.render("entradas/user", { error: 'Já existe um usuário com esta senha.' });
            }
        }

        // Criptografar a nova senha
        const hashedPassword = await bcrypt.hash(pass, 10);

        // Inserir o novo usuário na tabela 'utilizadors' com o tipo 'normal'
        const novoUtilizador = await Utilizador.create({
            pnome: pnome,
            unome: unome,
            pass: hashedPassword,
            type_user: 'super_admin',
            ComunityId: comunityId // Associa o usuário à comunidade diretamente
        });

       

        // Atualizar a sessão do usuário com mais detalhes
        req.session.utilizador = {
            ...req.session.utilizador,
            id: novoUtilizador.id,
            pnome: novoUtilizador.pnome,
            unome: novoUtilizador.unome,
            type_user: novoUtilizador.type_user
        };

        // Redirecionar o usuário para a página de conta pendente
        res.render("status/contaPendente");
    } catch (error) {
        console.error('Erro ao cadastrar o usuário:', error);
        return res.status(500).json({ message: 'Erro ao cadastrar o usuário' });
    }
});
 








module.exports = router;
     