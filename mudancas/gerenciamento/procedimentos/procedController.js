const express = require('express');
const router = express.Router();
const ProcedimentTable = require('./Servicos');
const adminauth = require("../middlewere/adminauth");
const Usertable = require("../database/User")
const Clientes = require("../clientes/Cliente2")

const Atividades = require("../database/acoes")

const { Op, Sequelize} = require('sequelize');

const calcularNumeroClientesAgendados = require('../middlewere/NumeroAgendas');


const administrador = require("../middlewere/Admin");



router.get("/admin/create/new/proced",calcularNumeroClientesAgendados, (req, res)=>{
    ProcedimentTable.findAll({order:[
        ['id','DESC']
    ]}).then(proced=>{
        res.render("admin/procedimento/novo",{
            proced : proced,
            numeroClientesAgendados: req.numeroClientesAgendados 
        })

    }).catch(error =>{
        console.error("Erro ao buscar procedimento:", error);
        res.status(500).send("Erro intern ao buscar procedimentos!")
    })

})

// ...

router.get("/procediment/review",adminauth, calcularNumeroClientesAgendados ,(req, res) => {
    ProcedimentTable.findAll({order:[
        ['id','DESC']
    ]}).then(proced => {
        Usertable.findOne().then(user=>{
            res.render("admin/agendar", {
                proced: proced,
                user : user,
                numeroClientesAgendados: req.numeroClientesAgendados 
              });
        
        })
    })
    .catch(error => {
      console.error('Erro ao buscar procedimentos:', error);
      res.status(500).send('Erro interno ao buscar procedimentos.');
    });
  });
  
  // ...
      



  router.post("/criarservico", adminauth, async (req, res) => {
    try {
        const title = req.body.title;
        const preco = req.body.preco;

        // Verifica a sessão para identificar se é um usuário ou um administrador
        const userId = req.session.user ? req.session.user.id : null;
        const adminId = req.session.admin ? req.session.admin.id : null;

        // Se não houver sessão de usuário nem de administrador, retorna erro
        if (!userId && !adminId) {
            return res.status(403).send("Não autorizado");
        }

        // Define o ID do usuário responsável pela criação do serviço
        const responsibleId = userId || adminId;

        if (title !== undefined && preco !== undefined) {
            if (!isNaN(preco)) {
                // Cria o novo serviço
                await ProcedimentTable.create({
                    title: title,
                    preco: preco
                });

                // Busca o registro existente na tabela Atividades ou cria um novo
                const atividade = await Atividades.findOne({ where: { UserId: responsibleId } });

                if (atividade) {
                    // Atualiza os valores existentes
                    atividade.totalAtualizacoesServicos += 1;
                    atividade.updatedAt = new Date();
                    await atividade.save();
                } else {
                    // Cria um novo registro se não existir
                    await Atividades.create({
                        UserId: responsibleId,
                        totalVendas: 0, // Inicialmente 0
                        totalAtualizacoesServicos: 1,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }

                res.redirect("/admin/create/new/proced");

            } else {
                res.status(400).send("Erro ao criar procedimento: preço inválido");
            }
        } else {
            res.status(400).send("Erro ao criar procedimento: dados incompletos");
        }
    } catch (error) {
        console.error("Erro ao criar procedimento:", error);
        res.status(500).send("Erro interno ao criar procedimento");
    }
});











router.post("/admin/delete/service", administrador, (req, res)=>{

    id = req.body.id;
    if(id !== undefined){
        if(!isNaN(id)){
            console.log("Eliminando um procedimento!")
            ProcedimentTable.destroy({
                where : { id : id}
            }).then(()=>{
                res.redirect("/")
            })
        } else {
            res.status(400).send("Erro ao eliminar procedimento!")
        }

    } else {
        res.status(400).send("Id núlo")
    }
})









module.exports = router;
