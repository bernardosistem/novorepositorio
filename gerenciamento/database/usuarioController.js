//Rotas de usuarios;


const express = require('express');
const router = express.Router();
const UserTable = require("./User");
const Sell = require("../registro/Venda");
const AdminTable = require("./AdminTable");
const ProcedimentTable = require("../procedimentos/Servicos");
const adminauth = require("../middlewere/adminauth");
const Clientes = require('../clientes/Cliente2');
const Vendas = require("../registro/Venda");

const Despesas = require("../clientes/Despesas");

const VendaProdutos = require("../clientes/VenderProduto");

const FotoUser = require("./Foto");

const FotoAdmin = require("./FotoAdmin");

const Formacao = require("./Formacao");

const Formandos = require("./Formandos");

const VendasFormacao = require("./VendaFormacao");

const Atividades = require("./acoes");

const administrador= require("../middlewere/Admin");


const { Op } = require("sequelize");

const Sequelize = require("sequelize");

const multer = require('multer');
const path = require('path');

const calcularNumeroClientesAgendados = require('../middlewere/NumeroAgendas');





  

const bcrypt = require("bcryptjs");
const Produtos = require('../clientes/Produtos');


router.post("/cadastro", async (req, res)=>{
    
    var nome = req.body.nome;
    var telefone = req.body.telefone;
    var senha = req.body.senha;

    if(!isNaN(telefone)){
        if(nome !== undefined && telefone !== undefined && senha !== undefined){
            console.log("Cadastrando um usuário");

            salt = bcrypt.genSaltSync(10);
            has = bcrypt.hashSync(senha, salt);

         var user = await UserTable.create({
                nome : nome,
                telefone : telefone,
                senha : has
            });

            req.session.user = {
                nome : user.nome,
                id : user.id
            }
            console.log("usuario cadastrado com sucesso", req.session.user);
            res.redirect("/perfil")
        }
    }

})





router.post("/cadastro-admin", calcularNumeroClientesAgendados, async (req, res) => {
    var nome = req.body.nome;
    var telefone = req.body.telefone;
    var senha = req.body.senha;

    if (!isNaN(telefone)) {
        if (nome !== undefined && telefone !== undefined && senha !== undefined) {
            console.log("Cadastrando um administrador");

            // Verificar o número atual de administradores
            const currentAdminCount = await AdminTable.count();  
            const maxAdminCount = 3; // Limite de 3 administradores

            if (currentAdminCount >= maxAdminCount) {
                // Se o limite de administradores for atingido, mostrar uma mensagem de erro
                console.log("Número máximo de administradores atingido.");
                res.render("admin/MaxNumber",{numeroClientesAgendados : req.numeroClientesAgendados});      
            
            }  else {

                 // Se ainda houver espaço para um novo administrador, continuar com o cadastro
            salt = bcrypt.genSaltSync(10);
            has = bcrypt.hashSync(senha, salt);

            var admin = await AdminTable.create({
                nome: nome,
                telefone: telefone,
                senha: has
            });

            req.session.admin = {
                nome: admin.nome,
                id: admin.id
            }


            console.log("Administrador cadastrado com sucesso", req.session.admin);
            res.redirect("/");
            }

           
           
        }
    }
});



router.get("/dashboard-admin", administrador, calcularNumeroClientesAgendados, async (req, res) => {
    try {
        const userAdminId = req.session.admin.id;

        // Obter dados existentes
        const procedimentos = await ProcedimentTable.findAll({ order: [['id', 'DESC']] });
        const totalClientes = await Clientes.count();
        
        // Total de vendas de serviços
        const totalVendasServicos = await Vendas.sum('valor');

        // Total de vendas de produtos
        const totalVendasProdutos = await VendaProdutos.sum('quantidade');
        const produtos = await Produtos.findAll();
        const totalVendasProdutosValor = produtos.reduce((acc, produto) => {
            const vendasProduto = produto.preco * totalVendasProdutos;
            return acc + vendasProduto;
        }, 0);

        // Total de vendas de formações
        const totalVendasFormacoes = await VendasFormacao.count();
        const formacoes = await Formacao.findAll();
        const totalVendasFormacoesValor = formacoes.reduce((acc, formacao) => {
            const vendasFormacao = formacao.valor * totalVendasFormacoes;
            return acc + vendasFormacao;
        }, 0);

        // Total geral de vendas (serviços, produtos e formações)
        const totalVendas = totalVendasServicos + totalVendasProdutosValor + totalVendasFormacoesValor;

        // Calcular total de despesas
        const totalDespesas = await Despesas.sum('valor');

        // Lucro líquido
        const lucroLiquido = totalVendas - totalDespesas;

        const totalServicos = await ProcedimentTable.count();
        const totalProdutos = await Produtos.count();
        const totalFormacoes = await Formacao.count();

        const ultimasVendas = await Vendas.findAll({ limit: 3, order: [['date', 'DESC']] });
        const ultimosClientes = await Clientes.findAll({ limit: 3, order: [['createdAt', 'DESC']] });
        const ultimosServicos = await ProcedimentTable.findAll({ limit: 3, order: [['updatedAt', 'DESC']] });
        const ultimosProdutos = await Produtos.findAll({ limit: 3, order: [['updatedAt', 'DESC']] });
        const ultimasFormacoes = await Formacao.findAll({ limit: 3, order: [['updatedAt', 'DESC']] });

        // Buscar todas as atividades
        const atividades = await Atividades.findAll();

        // Obter todos os IDs de usuários envolvidos nas atividades
        const userIds = atividades.map(atividade => atividade.UserId);

        // Buscar todos os usuários correspondentes
        const usuarios = await UserTable.findAll({ where: { id: userIds } });

        // Criar um mapa para rápida busca de usuário pelo ID
        const usuarioMap = new Map(usuarios.map(usuario => [usuario.id, usuario.nome]));

        // Adicionar os nomes dos usuários às atividades
        const atividadesComUsuarios = atividades.map(atividade => ({
            ...atividade.toJSON(),
            usuarioNome: usuarioMap.get(atividade.UserId) || 'Desconhecido'
        }));

        res.render("admin/dashboard", {
            proced: procedimentos,
            numeroClientesAgendados: req.numeroClientesAgendados,
            totalClientes: totalClientes,
            totalVendas: totalVendas,
            totalDespesas: totalDespesas,
            lucroLiquido: lucroLiquido,
            totalServicos: totalServicos,
            totalProdutos: totalProdutos,
            totalFormacoes: totalFormacoes,
            ultimasVendas: ultimasVendas,
            ultimosClientes: ultimosClientes,
            ultimosServicos: ultimosServicos,
            ultimosProdutos: ultimosProdutos,
            ultimasFormacoes: ultimasFormacoes,
            atividades: atividadesComUsuarios
        });
    } catch (err) {
        console.error("Erro ao carregar dashboard do administrador:", err);
        res.status(500).send("Erro ao carregar dashboard do administrador");
    }
});






router.get('/admin/grafico-vendas', async (req, res) => {
    try {
        const periodo = req.query.periodo || 'dia';
        const tipo = req.query.tipo || 'servico'; // Valor padrão é 'servico'

        let whereCondition = {};
        let groupBy = '';
        let attributes = [];
        let model;

        // Ajusta a condição de acordo com o filtro
        const agora = new Date();
        if (periodo === 'dia') {
            whereCondition = {
                createdAt: {
                    [Sequelize.Op.between]: [
                        new Date(agora.setHours(0, 0, 0, 0)),
                        new Date(agora.setHours(23, 59, 59, 999))
                    ]
                }
            };
        } else if (periodo === 'semana') {
            const primeiroDiaSemana = new Date(agora);
            primeiroDiaSemana.setDate(agora.getDate() - agora.getDay() + 1); // Segunda-feira
            primeiroDiaSemana.setHours(0, 0, 0, 0);

            const ultimoDiaSemana = new Date(primeiroDiaSemana);
            ultimoDiaSemana.setDate(primeiroDiaSemana.getDate() + 6); // Domingo
            ultimoDiaSemana.setHours(23, 59, 59, 999);

            whereCondition = {
                createdAt: {
                    [Sequelize.Op.between]: [
                        primeiroDiaSemana,
                        ultimoDiaSemana
                    ]
                }
            };
        } else if (periodo === 'mes') {
            const primeiroDiaMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
            const ultimoDiaMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
            whereCondition = {
                createdAt: {
                    [Sequelize.Op.between]: [
                        primeiroDiaMes,
                        ultimoDiaMes
                    ]
                }
            };
        } else if (periodo === 'trimestre') {
            const trimestre = Math.floor(agora.getMonth() / 3) * 3;
            const primeiroDiaTrimestre = new Date(agora.getFullYear(), trimestre, 1);
            const ultimoDiaTrimestre = new Date(agora.getFullYear(), trimestre + 3, 0);
            whereCondition = {
                createdAt: {
                    [Sequelize.Op.between]: [
                        primeiroDiaTrimestre,
                        ultimoDiaTrimestre
                    ]
                }
            };
        } else if (periodo === 'ano') {
            const primeiroDiaAno = new Date(agora.getFullYear(), 0, 1);
            const ultimoDiaAno = new Date(agora.getFullYear(), 11, 31);
            whereCondition = {
                createdAt: {
                    [Sequelize.Op.between]: [
                        primeiroDiaAno,
                        ultimoDiaAno
                    ]
                }
            };
        }

        // Seleciona o modelo e atributos com base no tipo
        if (tipo === 'produto') {
            model = VendaProdutos; // Tabela de vendas de produtos
            groupBy = 'ProdutoId'; // Agrupamento por ID do produto
            attributes = [
                'ProdutoId',
                [Sequelize.fn('SUM', Sequelize.col('quantidade')), 'total']
            ];
        } else if (tipo === 'formacao') {
            model = VendasFormacao; // Tabela de vendas de formações
            groupBy = 'FormacoId'; // Agrupamento por ID da formação
            attributes = [
                'FormacoId',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'total']
            ];
        } else {
            model = Vendas; // Tabela de vendas de serviços
            groupBy = 'typeService'; // Agrupamento por tipo de serviço
            attributes = [
                'typeService',
                [Sequelize.fn('SUM', Sequelize.col('valor')), 'total']
            ];
        }

        const vendas = await model.findAll({
            attributes: attributes,
            group: [groupBy],
            where: whereCondition,
            raw: true
        });

        let labels = [];
        let data = [];

        // Processa os dados conforme o tipo
        if (tipo === 'produto') {
            // Busca nomes dos produtos
            const produtos = await Produtos.findAll({
                attributes: ['id', 'nome'],
                where: {
                    id: vendas.map(venda => venda.ProdutoId)
                },
                raw: true
            });
            const produtoMap = produtos.reduce((map, produto) => {
                map[produto.id] = produto.nome;
                return map;
            }, {});
            
            labels = vendas.map(venda => produtoMap[venda.ProdutoId]);
            data = await Promise.all(vendas.map(async venda => {
                const produto = await Produtos.findByPk(venda.ProdutoId);
                return produto ? parseFloat(venda.total) * produto.preco : 0;
            }));
        } else if (tipo === 'formacao') {
            // Busca nomes das formações
            const formacoes = await Formacao.findAll({
                attributes: ['id', 'nome'],
                where: {
                    id: vendas.map(venda => venda.FormacoId)
                },
                raw: true
            });
            const formacaoMap = formacoes.reduce((map, formacao) => {
                map[formacao.id] = formacao.nome;
                return map;
            }, {});
            
            labels = vendas.map(venda => formacaoMap[venda.FormacoId]);
            data = await Promise.all(vendas.map(async venda => {
                const formacao = await Formacao.findByPk(venda.FormacoId);
                return formacao ? formacao.valor : 0;
            }));
        } else {
            // Serviços
            labels = vendas.map(venda => venda.typeService);
            data = vendas.map(venda => parseFloat(venda.total));
        }

        res.json({ labels, data });
    } catch (error) {
        console.error('Erro ao obter dados do gráfico:', error);
        res.status(500).json({ error: 'Erro ao obter dados do gráfico' });
    }
});








// Configuração do multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });
  
  const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Tipo de arquivo não permitido'), false);
      }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
  });
  
 


  

  router.post('/perfil/upload-foto', upload.single('fotoPerfil'), async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : req.session.admin.id;
        const filePath = req.file.path.replace(/\\/g, '/');

        if (req.session.user) {
            let fotoUser = await FotoUser.findOne({ where: { UserId: userId } });

            if (fotoUser) {
                fotoUser.caminho = filePath;
                fotoUser.updatedAt = new Date();
                await fotoUser.save();
            } else {
                await FotoUser.create({ caminho: filePath, UserId: userId });
            }
        } else if (req.session.admin) {
            let fotoAdmin = await FotoAdmin.findOne({ where: { adminId: userId } });

            if (fotoAdmin) {
                fotoAdmin.caminho = filePath;
                fotoAdmin.updatedAt = new Date();
                await fotoAdmin.save();
            } else {
                await FotoAdmin.create({ caminho: filePath, adminId: userId });
            }
        }

        res.redirect('/perfil');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao atualizar foto de perfil');
    }
});



// routes/userRoutes.js (ou o nome do seu arquivo de rotas)
router.get('/perfil', adminauth, calcularNumeroClientesAgendados, async (req, res) => {
    try {
        let userId;
        let isAdmin = false;

        if (req.session.admin) {
            // Se for administrador
            userId = req.session.admin.id;
            isAdmin = true;
        } else if (req.session.user) {
            // Se for usuário normal
            userId = req.session.user.id;
        } else {
            return res.status(403).send('Acesso negado');
        }

        // Buscar informações do usuário
        const user = isAdmin ? await AdminTable.findByPk(userId) : await UserTable.findByPk(userId);

        if (!user) {
            return res.status(404).send('Usuário não encontrado');
        }

        // Buscar foto do usuário
        const fotoUser = isAdmin ? await FotoAdmin.findOne({ where: { adminId: userId } }) : await FotoUser.findOne({ where: { UserId: userId } });

        // Buscar procedimentos
        const proced = await ProcedimentTable.findAll({ order: [['id', 'DESC']] });

        // Renderizar a página com as informações do usuário e a foto
        res.render("admin/perfil", {
            user,
            numeroClientesAgendados: req.numeroClientesAgendados,
            proced,
            fotoUser,
            isAdmin // Passar a variável isAdmin para a view
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar perfil');
    }
});


  

router.get("/perfil-admin" ,calcularNumeroClientesAgendados, (req, res) => {
   
          
                res.render("admin/PerfilAdmin", {
                  
                    numeroClientesAgendados: req.numeroClientesAgendados 
                });
     
});


router.get("/perfil-user",calcularNumeroClientesAgendados, (req, res) => {
   
          
    res.render("admin/PerfilUser", {
      
        numeroClientesAgendados: req.numeroClientesAgendados 
    });

});




router.get("/admin/user/ficha", adminauth ,calcularNumeroClientesAgendados, (req, res) => {
    var userId = req.session.usuario.id;

    UserTable.findByPk(userId).then((user) => {
        if (user) {
            ProcedimentTable.findAll({
                order: [
                    ['id', 'DESC']
                ]
            }).then(proced => {
                res.render("admin/ficha", {
                    user: user,
                    proced: proced,
                    numeroClientesAgendados: req.numeroClientesAgendados 
                });
            });
        } else {
            res.status(500).send("Usuário não encontrado");
        }
    }).catch((err) => {
        console.error("Erro ao obter perfil do usuário:", err);
        res.status(500).send("Erro ao obter perfil do usuário");
    });
});




router.post("/login-user", async (req, res) => {
    console.log("Iniciando a rota de login do usuário");
    const { nome, senha } = req.body;

    if (nome && senha) {
        try {
            const User = await UserTable.findOne({ where: { nome: nome } });

            if (!User) {
                return res.status(401).send("Usuário não encontrado");
            }

            const correct = bcrypt.compareSync(senha, User.senha);
            if (correct) {
                req.session.user = {
                    nome: User.nome,
                    id: User.id
                };
                console.log("Sessão de usuário iniciada com sucesso", req.session.user);
                return res.redirect("/perfil");
            } else {
                return res.status(401).send("Senha incorreta");
            }
        } catch (err) {
            console.error("Erro ao autenticar usuário:", err);
            return res.status(500).send("Erro ao autenticar usuário");
        }
    }
});










router.post("/login-admin", async (req, res) => {
    console.log("Iniciando a rota de login do administrador");
    const { nome, senha } = req.body;

    if (nome && senha) {
        try {
            const UserAdmin = await AdminTable.findOne({ where: { nome: nome } });

            if (!UserAdmin) {
                return res.status(400).send("Administrador não encontrado");
            }

            const correct = bcrypt.compareSync(senha, UserAdmin.senha);
            if (correct) {
                req.session.admin = {
                    nome: UserAdmin.nome,
                    id: UserAdmin.id
                };
                console.log("Sessão de administrador iniciada com sucesso", req.session.admin);
                return res.redirect("/perfil");
            } else {
                return res.status(401).send("Senha incorreta");
            }
        } catch (err) {
            console.error("Erro ao autenticar administrador:", err);
            return res.status(500).send("Erro ao autenticar administrador");
        }
    }
});













router.post("/loginUser",  async (req, res) => {
    console.log("Iniciando rota de login");
    var nome = req.body.nome;
    var senha = req.body.senha;

    if (nome !== undefined && senha !== undefined) {
        try {
            console.log("Antes da consulta ao banco de dados");
            const user = await UserTable.findOne({ where: { nome: nome } });
            console.log("Após a consulta ao banco de dados");

            if (user !== null) {
                var correct = bcrypt.compareSync(senha, user.senha);
                if (correct) {
                    req.session.user = {
                        nome: user.nome,
                        id: user.id
                    };
                    console.log("Sessão iniciada com sucesso:", req.session.user);
                    res.redirect("/perfil");
                } else {
                    console.log("Credenciais inválidas");
                    res.status(401).send("Credenciais inválidas");
                }
            } else {
                console.log("Usuário não encontrado");
                res.status(401).send("Credenciais inválidas");
            }
        } catch (err) {
            console.error("Erro ao autenticar usuário:", err);
            res.status(500).send("Erro ao autenticar usuário");
        }
    } else {
        console.log("Parâmetros inválidos");
        res.status(400).send("Parâmetros inválidos");
    }
});





router.get("/admin/user/edit/:id",adminauth , calcularNumeroClientesAgendados,(req, res)=>{
    var id = req.params.id;
    UserTable.findByPk(id).then(user=>{
        ProcedimentTable.findAll({order:[
            ['id','DESC']
        ]}).then(proced=>{
            res.render("admin/edit",{
                user : user,
                proced: proced,
                numeroClientesAgendados: req.numeroClientesAgendados 
            })
    
        })
    })
})




  
router.get("/verRelatorio",administrador , calcularNumeroClientesAgendados, async(req, res)=>{

    res.render("VerRelatorios", {numeroClientesAgendados: req.numeroClientesAgendados });
   
})



  
router.get("/verRelatorio-pagamento",administrador, calcularNumeroClientesAgendados, async(req, res)=>{

    const proced = await ProcedimentTable.findAll({order:[
        ['id','DESC']
    ]});

    res.render("admin/relatorioPagamento", {numeroClientesAgendados: req.numeroClientesAgendados, proced });
   
})




router.post("/editar", (req, res)=>{
    id = req.body.id;
    nome = req.body.nome;
    telefone = req.body.telefone;
    senha = req.body.senha;
  


if(nome !== undefined && telefone !== undefined && senha !== undefined){

    var salt = bcrypt.genSaltSync(10);
    var has = bcrypt.hashSync(senha, salt);


    UserTable.update({
        nome : nome,
        telefone : telefone,
        senha : has
    }, {
        where : {id : id}
    }).then(()=>{
        res.redirect("/perfil")
    })
    
 } else {
    console.log("parametros invalidos");
    res.status(400).send("parametros inválidos")
 }
})

router.get("/logout",(req, res)=>{
    req.session.user = undefined;
    req.session.admin = undefined;
    res.redirect("/");
})


























// Função para calcular a data com base no período selecionado

const calcularData = (periodo) => {
    let dataAtual = new Date();
    let dataInicio, dataFim;

    switch (periodo) {
        case 'dia':
            // Para o período de um dia, o intervalo será do início ao fim do dia atual
            dataInicio = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate());
            dataFim = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate() + 1);
            break;
        case 'semana':
            // Para o período de uma semana, o intervalo será do início ao fim da semana atual
            let diaSemana = dataAtual.getDay();
            let diasAteInicioSemana = diaSemana === 0 ? 6 : diaSemana - 1;
            dataInicio = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate() - diasAteInicioSemana);
            dataFim = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), dataInicio.getDate() + 7);
            break;
        case 'mes':
            // Para o período de um mês, o intervalo será do início ao fim do mês atual
            dataInicio = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
            dataFim = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0);
            break;
        case 'trimestre':
            // Para o período de um trimestre, o intervalo será do início ao fim do trimestre atual
            let trimestre = Math.floor((dataAtual.getMonth() / 3));
            dataInicio = new Date(dataAtual.getFullYear(), trimestre * 3, 1);
            dataFim = new Date(dataInicio.getFullYear(), dataInicio.getMonth() + 3, 0);
            break;
        case 'ano':
            // Para o período de um ano, o intervalo será do início ao fim do ano atual
            dataInicio = new Date(dataAtual.getFullYear(), 0, 1);
            dataFim = new Date(dataAtual.getFullYear(), 11, 31);
            break;
        default:
            // Caso padrão para o período de um dia
            dataInicio = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate());
            dataFim = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate() + 1);
            break;
    }
    

    // Definição do intervalo de datas

    return { dataInicio, dataFim };
};




// Rota para gerar relatório por procedimento
router.post('/admin/report/procedure', async (req, res) => {
    try {
        const { period, procedure } = req.body;
        const { dataInicio, dataFim } = calcularData(period);

        const resultado = await Sell.findAll({
            where: {
                typeService: procedure,
                date: { [Op.between]: [dataInicio, dataFim] }
            }
        });

        let totalVendas = 0;
        resultado.forEach(venda => {
            totalVendas += parseFloat(venda.valor); // Convertendo para número e somando corretamente
        });

        res.json({ totalVendas });
    } catch (error) {
        console.error('Erro ao gerar relatório por procedimento:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório por procedimento.' });
    }
});

// Rota para gerar relatório geral
router.post('/admin/report/overall', async (req, res) => {
    try {
        const { period } = req.body;
        const { dataInicio, dataFim } = calcularData(period);

        const resultado = await Sell.findAll({
            where: {
                date: { [Op.between]: [dataInicio, dataFim] }
            }
        });

        let totalVendas = 0;
        resultado.forEach(venda => {
            totalVendas += parseFloat(venda.valor); // Convertendo para número e somando corretamente
        });

        res.json({ totalVendas });
    } catch (error) {
        console.error('Erro ao gerar relatório geral:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório geral.' });
    }
});

//  ----------------------------------Rotas para os relatorios de metodo de pagamento------------------------



// Rota para gerar relatório por método de pagamento selecionado
router.post('/admin/report/payment', async (req, res) => {
    try {
        const { period, paymentMethod } = req.body;
        const { dataInicio, dataFim } = calcularData(period);

        const resultado = await Sell.findAll({
            where: {
                metodoPagamento: paymentMethod,
                date: { [Op.between]: [dataInicio, dataFim] }
            }
        });

        let totalVendas = 0;
        resultado.forEach(venda => {
            totalVendas += parseFloat(venda.valor);
        });

        res.json({ totalVendas });
    } catch (error) {
        console.error('Erro ao gerar relatório por método de pagamento:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório por método de pagamento.' });
    }
});

// Rota para gerar relatório geral
router.post('/admin/report/overallpayment', async (req, res) => {
    try {
        const { period } = req.body;
        const { dataInicio, dataFim } = calcularData(period);

        const resultado = await Sell.findAll({
            where: {
                date: { [Op.between]: [dataInicio, dataFim] }
            }
        });

        let totalVendas = 0;
        resultado.forEach(venda => {
            totalVendas += parseFloat(venda.valor);
        });

        res.json({ totalVendas });
    } catch (error) {
        console.error('Erro ao gerar relatório geral:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório geral.' });
    }
});






//--------------------------------- Rotas para as fichas dos relatorios de vendas -----------------------------------------


// Rota para gerar relatório por método de pagamento selecionado
router.post('/admin/report/paymentDetail', administrador, calcularNumeroClientesAgendados, async (req, res) => {
    try {
        const { period, paymentMethod } = req.body;
        const { dataInicio, dataFim } = calcularData(period);

        // Função para formatar a data no formato "d/m/y"
        function formatarData(data) {
            const dia = data.getDate().toString().padStart(2, '0');
            const mes = (data.getMonth() + 1).toString().padStart(2, '0');
            const ano = data.getFullYear().toString().padStart(4, '0');
            return `${dia}/${mes}/${ano}`;
        }

        // Calcular o total de vendas durante o período selecionado
        const vendasTotaisPeriodo = await Sell.sum('valor', {
            where: {
                date: { [Op.between]: [dataInicio, dataFim] }
            }
        });

        const resultado = await Sell.findAll({
            where: {
                metodoPagamento: paymentMethod,
                date: { [Op.between]: [dataInicio, dataFim] }
            }
        });

        // Calcular o total de vendas para o método de pagamento selecionado
        const totalVendas = resultado.reduce((total, venda) => total + parseFloat(venda.valor), 0);

        // Calcular o número de vendas
        const numeroVendas = resultado.length;

        // Obter datas das vendas
        const datasVendas = resultado.map(venda => formatarData(venda.date)); // Adicionando formatação de datas

        // Calcular o valor médio de vendas (arredondado para o número inteiro mais próximo)
        const valorMedioVendas = Math.round(totalVendas / numeroVendas);

        // Calcular a porcentagem de vendas para o método de pagamento selecionado
        const porcentagemVendas = ((totalVendas / vendasTotaisPeriodo) * 100).toFixed(2);

        res.render('admin/FichaPagamento', {numeroClientesAgendados: req.numeroClientesAgendados, totalVendas, numeroVendas, datasVendas, valorMedioVendas, porcentagemVendas, paymentMethod });
    } catch (error) {
        console.error('Erro ao gerar relatório por método de pagamento:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório por método de pagamento.' });
    }
});





// Rota para gerar relatório geral
router.post('/admin/report/overallpaymentDetail',administrador, calcularNumeroClientesAgendados, async (req, res) => {
    try {
        const { period } = req.body;
        const { dataInicio, dataFim } = calcularData(period);

        const resultado = await Sell.findAll({
            where: {
                date: { [Op.between]: [dataInicio, dataFim] }
            }
        });

        // Calcular o total de vendas
        const totalVendas = resultado.reduce((total, venda) => total + parseFloat(venda.valor), 0);

        // Obter métodos de pagamento únicos
        const metodosPagamento = [...new Set(resultado.map(venda => venda.metodoPagamento))];

        // Calcular ganho por método de pagamento
        const ganhoPorMetodo = {};
        metodosPagamento.forEach(metodo => {
            const vendasPorMetodo = resultado.filter(venda => venda.metodoPagamento === metodo);
            ganhoPorMetodo[metodo] = vendasPorMetodo.reduce((total, venda) => total + parseFloat(venda.valor), 0);
        });

        res.render('admin/FichaGeralPagamento', { vendas: resultado, totalVendas, metodosPagamento, ganhoPorMetodo, numeroClientesAgendados: req.numeroClientesAgendados });
    } catch (error) {
        console.error('Erro ao gerar relatório geral:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório geral.' });
    }
});










//-------------------------------- Ficha de relatorio por procedimento --------------------------------



// Rota para gerar relatório por serviço selecionado
router.post('/admin/report/procedureDetail', administrador, calcularNumeroClientesAgendados, async (req, res) => {
    try {
        // Extrair período e nome do serviço do corpo da requisição
        const { period, procedure } = req.body;

        // Calcular datas de início e fim do período
        const { dataInicio, dataFim } = calcularData(period);

        console.log('Período selecionado:', period);
        console.log('Nome do serviço:', procedure);

        // Consultar vendas para o serviço específico no período selecionado
        const resultado = await Sell.findAll({
            where: {
                typeService: procedure,
                date: { [Op.between]: [dataInicio, dataFim] }
            }
        });

        console.log('Resultados da consulta:', resultado);

        // Verificar se há vendas para o serviço selecionado
        if (resultado.length === 0) {
            console.log('Nenhuma venda encontrada para o serviço selecionado.');
            // Renderizar a página com valores padrão se não houver vendas
            res.render('admin/FichaServico', { totalVendas: 0, numeroVendas: 0, datasVendas: [], valorMedioVendas: 0, porcentagemVendas: 0, procedure, numeroClientesAgendados: req.numeroClientesAgendados });
            return;
        }

        // Calcular o total de vendas para o serviço selecionado
        const totalVendas = resultado.reduce((total, venda) => total + parseFloat(venda.valor), 0);

        // Calcular o número de vendas
        const numeroVendas = resultado.length;

        // Obter datas das vendas
        const datasVendas = resultado.map(venda => formatarData(venda.date)); // Adicionando formatação de datas

        // Calcular o valor médio de vendas (arredondado para o número inteiro mais próximo)
        const valorMedioVendas = Math.round(totalVendas / numeroVendas);

        // Calcular a porcentagem de vendas para o serviço selecionado em relação ao total no período
        const vendasTotaisPeriodo = await Sell.sum('valor', {
            where: {
                date: { [Op.between]: [dataInicio, dataFim] }
            }
        });

        const porcentagemVendas = ((totalVendas / vendasTotaisPeriodo) * 100).toFixed(2);

        // Renderizar a página com os dados do relatório
        res.render('admin/FichaServico', { totalVendas, numeroVendas, datasVendas, valorMedioVendas, porcentagemVendas, procedure, numeroClientesAgendados: req.numeroClientesAgendados });
    } catch (error) {
        console.error('Erro ao gerar relatório por serviço:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório por serviço.' });
    }
});




// Definindo a função para formatar a data como "d/m/y"
function formatarData(data) {
    const dia = data.getDate();
    const mes = data.getMonth() + 1; // Lembrando que janeiro é 0
    const ano = data.getFullYear();

    // Formatando a data como "d/m/y"
    return `${dia}/${mes}/${ano}`;
}












router.post('/admin/report/overallProcedureDetail', administrador, calcularNumeroClientesAgendados, async (req, res) => {
    try {
        const { period } = req.body;
        const { dataInicio, dataFim } = calcularData(period);

        const resultado = await Sell.findAll({
            where: {
                date: { [Op.between]: [dataInicio, dataFim] }
            }
        });

        // Calcular o total de vendas
        const totalVendas = resultado.reduce((total, venda) => total + parseFloat(venda.valor), 0);

        // Obter procedimentos únicos (IDs de serviço)
        const procedimentosIds = resultado.map(venda => venda.ServicoId);
        const procedimentosUnicosIds = [...new Set(procedimentosIds)];

        // Obter dados dos serviços para os IDs de serviço encontrados
        const procedimentos = {};
        for (const ServicoId of procedimentosUnicosIds) {
            const servico = await ProcedimentTable.findByPk(ServicoId);
            if (servico) {
                procedimentos[ServicoId] = {
                    title: servico.title
                };
            }  
        }   

        // Calcular ganho por procedimento e porcentagem de vendas para cada serviço
        const ganhoPorProcedimento = {};
        const porcentagemVendasPorProcedimento = {};
        procedimentosUnicosIds.forEach(ServicoId => {
            const vendasPorProcedimento = resultado.filter(venda => venda.ServicoId === ServicoId);
            ganhoPorProcedimento[ServicoId] = vendasPorProcedimento.reduce((total, venda) => total + parseFloat(venda.valor), 0);
            porcentagemVendasPorProcedimento[ServicoId] = ((ganhoPorProcedimento[ServicoId] / totalVendas) * 100).toFixed(2);
        });

        res.render('admin/FichaGeralServico', { vendas: resultado, totalVendas, procedimentos, ganhoPorProcedimento, porcentagemVendasPorProcedimento, numeroClientesAgendados: req.numeroClientesAgendados });
    } catch (error) {
        console.error('Erro ao gerar relatório geral de serviços:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório geral de serviços.' });
    }
});




router.get("/formacao", calcularNumeroClientesAgendados, async (req, res)=>{
   

    const produtos = await Produtos.findAll();

    const proced = await ProcedimentTable.findAll();

    const formacao = await Formacao.findAll();

    res.render("admin/Cadastros/formandos", {
        produtos,
        proced,
        numeroClientesAgendados : req.numeroClientesAgendados,
        formacao
    });

  })
  


  // Rota para criar uma nova formação
router.post('/criar-formacao', async (req, res) => {
    try {
        const { nome, valor } = req.body;

        // Validação simples (pode ser melhorada)
        if (!nome || !valor) {
            return res.status(400).json({ error: 'Nome e valor são obrigatórios.' });
        }

        // Criar nova formação
        const novaFormacao = await Formacao.create({ nome, valor });

        res.redirect("/")
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar a formação.' });
    }
});


router.post('/criar-formando', async (req, res) => {
    try {
        const { nome, telefone, formacaoId } = req.body;

        console.log('Dados recebidos:', { nome, telefone, formacaoId }); // Adicionado para diagnóstico

        if (!nome || !telefone || !formacaoId) {
            return res.status(400).json({ error: 'Nome, telefone e formação são obrigatórios.' });
        }

        const formacao = await Formacao.findByPk(formacaoId);
        if (!formacao) {
            return res.status(404).json({ error: 'Formação não encontrada.' });
        }

        const novoFormando = await Formandos.create({ nome, telefone });

        await VendasFormacao.create({
            FormacoId: formacaoId,
            FormandoId: novoFormando.id
        });

        // Redireciona para a página de ficha do formando
        res.redirect(`/ficha-formando/${novoFormando.id}`);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar o formando e registrar a venda.' });
    }
});





// Rota para exibir a ficha do formando
router.get('/ficha-formando/:id', calcularNumeroClientesAgendados, async (req, res) => {
    try {
        const formandoId = req.params.id;

        // Busca os dados do formando
        const formando = await Formandos.findByPk(formandoId);
        if (!formando) {
            return res.status(404).send('Formando não encontrado.');
        }

        // Busca a formação associada ao formando
        const vendaFormacao = await VendasFormacao.findOne({
            where: { FormandoId: formandoId }
        });

        if (!vendaFormacao) {
            return res.status(404).send('Formação não encontrada para este formando.');
        }

        // Busca a formação detalhada
        const formacao = await Formacao.findByPk(vendaFormacao.FormacoId);
        if (!formacao) {
            return res.status(404).send('Formação não encontrada.');
        }

        // Renderiza a página com os dados do formando e da formação
        res.render('admin/fichas/ficha-formando', { formando, formacao, numeroClientesAgendados: req.numeroClientesAgendados });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar a ficha do formando.');
    }
});





router.get('/ver-relatorios-despesas', calcularNumeroClientesAgendados, async (req, res) => {
    try {


        const despesas = await Despesas.findAll({
          order: [['createdAt', 'DESC']]
        });

        const produtos = await Produtos.findAll();
        const proced = await ProcedimentTable.findAll();
    
        // Converta valores para números
        despesas.forEach(despesa => {
          despesa.valor = parseFloat(despesa.valor);
        });
      // Renderiza o relatório com EJS
      res.render('admin/Relatorios/despesas', { despesas, produtos, proced, numeroClientesAgendados: req.numeroClientesAgendados  });
    } catch (error) {
      console.error('Erro ao gerar relatório de despesas:', error);
      res.status(500).send('Erro ao gerar relatório de despesas.');
    }
  });
  
  router.get('/despesa/:id',  async (req, res) => {
    try {
      const despesaId = req.params.id;

     
  
      // Encontre a despesa pelo ID
      const despesa = await Despesas.findOne({
        where: { id: despesaId }
      });
  
      if (!despesa) {
        return res.status(404).send('Despesa não encontrada.');
      }
  
      // Retorne os detalhes da despesa em formato JSON
      res.json(despesa);
    } catch (error) {
      console.error('Erro ao exibir detalhes da despesa:', error);
      res.status(500).send('Erro ao exibir detalhes da despesa.');
    }
  });
  


  
// Rota para repor estoque
router.post('/repor-estoque/:produtoId', (req, res) => {
    const produtoId = req.params.produtoId;
    const { quantidade } = req.body;

    // Lógica para atualizar a quantidade do produto no banco de dados
    // Exemplo:
    Produtos.findById(produtoId, (err, produto) => {
        if (err || !produto) {
            return res.json({ success: false, message: 'Produto não encontrado.' });
        }

        produto.quantidade += parseInt(quantidade, 10);
        produto.save(err => {
            if (err) {
                return res.json({ success: false, message: 'Erro ao atualizar o estoque.' });
            }
            res.json({ success: true, message: 'Estoque atualizado com sucesso.' });
        });
    });
});


module.exports = router;