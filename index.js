const express =  require('express');
const app = express();
const session = require('express-session');
const Sequelize = require('sequelize');
const sequelize = require('./gerenciamento/database/database');
const bcrypt = require("bcryptjs");

const Notificacao = require("./gerenciamento/middlewere/notificacao");

const port = 4000;





app.use(session({
  secret: "bernardo01",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 30000000 }
}));

app.set('view engine', 'ejs');

const bodyP = require('body-parser');
app.use(bodyP.urlencoded({ extended: false }));
app.use(bodyP.json());

app.use(express.static('public'));

// Conexão com a base de dados
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexão estabelecida com sucesso.');
    await sequelize.sync({force:false});
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
  }
})();




const multer = require('multer');
const path = require('path');

// Configuração do armazenamento do multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Define a pasta de destino para os uploads
    },
    filename: (req, file, cb) => {
        // Gera um nome único para o arquivo
        cb(null, Date.now() + path.extname(file.originalname)); // Adiciona um timestamp ao nome do arquivo
    }
});

// Inicializa o multer com a configuração de armazenamento
const upload = multer({ storage });


app.use('/uploads', express.static('uploads'));


const Membro = require("./gerenciamento/membro/Membro");

const DadosEclesiais = require("./gerenciamento/DadosMembros/Eclesiais")

const CursosTeologicos = require("./gerenciamento/DadosMembros/CursoTeologico")

const DadosAcademicos = require("./gerenciamento/DadosMembros/DadosAcademicos");

const Contato = require("./gerenciamento/DadosMembros/Contactos");

const Endereco = require("./gerenciamento/DadosMembros/Endereco");

const Dizimos = require("./gerenciamento/Financas/Disimos");

const Ofertas = require("./gerenciamento/Financas/Ofertas");

const Despesas = require("./gerenciamento/Financas/Despesas");


const Notas = require("./gerenciamento/Nota/Notificacao");



const Departamento = require("./gerenciamento/DadosMembros/Departamento");


const departamentoMembros = require("./gerenciamento/DadosMembros/DepartamentoMembro");


const Cuotas = require("./gerenciamento/Financas/Cuotas");



const Comunity = require("./gerenciamento/comunity/Comunity");


const ofertacomunity= require("./gerenciamento/comunity/OfertaComunity");

const dizimocomunity= require("./gerenciamento/comunity/DizimoComunity");

const despesacomunity= require("./gerenciamento/comunity/DespesaComunity");


const membrocomunity= require("./gerenciamento/comunity/MembroComunity");



const fotocomunity= require("./gerenciamento/comunity/fotoComunity");




const UtilizadorComunity = require("./gerenciamento/comunity/UserComunity");



const Utilizador= require("./gerenciamento/User/User");


const Status= require("./gerenciamento/User/Status");



const menbroController = require("./gerenciamento/membro/membroController");

app.use("/", menbroController)



const userController = require("./gerenciamento/User/usercontroller");

app.use("/", userController)




const comunityController = require("./gerenciamento/comunity/comunityController");

app.use("/", comunityController)




const FinancasController = require("./gerenciamento/Financas/financasController");

app.use("/", FinancasController)


// Use o middleware para contar notificações


const contarNotificacoes = require("./gerenciamento/middlewere/notificacao");

app.use(contarNotificacoes)


app.get("/", async (req, res) => {
    try {
        const comunityId = req.session.utilizador?.comunityId;
        const utilizadorId = req.session.utilizador?.id;
        let fotoUrl = null;
  
        if (comunityId && utilizadorId) {
            const statusData = await Status.findOne({
                where: { ComunityId: comunityId, usuario2Id: utilizadorId }
            }); 
  
            if (statusData && statusData.status.toLowerCase() === 'pendente') {
                fotoUrl = null;
            } else {
                const fotoData = await fotocomunity.findOne({ where: { ComunityId: comunityId } });
                if (fotoData) {
                    fotoUrl = fotoData.foto;
                }
            }
        }
  

        console.log(req.notifications);
  
        res.render("layout/index", {
            notificacoes:  req.notificacoes,
            fotoUrl: fotoUrl
        });
    } catch (error) {
        console.error('Erro ao buscar status ou foto da comunidade:', error);
        res.status(500).send('Erro no servidor ao carregar a página.');
    }
  });
  


app.post('/dados-eclesiais', async (req, res) => {
  try {
      const {
          membroId,
          situacao,
          categoria,
          funcao,
          dataConsagracao,
          dataBatismo,
          igrejaMatriz,
          filiais,
          departamentos // Recebendo os departamentos selecionados
      } = req.body;

      // Primeiro, cria os dados eclesiais
      const dadosEclesiais = await DadosEclesiais.create({
          MembroId: membroId,
          situacao,
          categoria,
          funcao,
          dataConsagracao,
          dataBatismo,
          igrejaMatriz,
          filiais
      });

      // Agora, registra cada departamento associado ao membro
      if (departamentos) {
          for (const departamentoId of departamentos) {
              await departamentoMembros.create({
                  MembroId: membroId,
                  departamentoId: departamentoId // Associando o departamento ao membro
              });
          }
      }

      // Redireciona após o cadastro
      res.redirect(`/cursos-teologicos/cadastrar/${membroId}`);
  } catch (error) {
      console.error(error);
      res.status(500).send('Erro ao cadastrar dados eclesiais.');
  }
});

  



app.delete('/remover-membro/:id', async (req, res) => {
  try {
      const id = req.params.id;
      await Membro.destroy({ where: { id } }); // Ajuste para o nome da sua tabela
      res.sendStatus(200); // Retorna status 200 se a remoção for bem-sucedida
  } catch (error) {
      console.error('Erro ao remover membro:', error);
      res.sendStatus(500); // Retorna status 500 em caso de erro
  }
});













// Restante do código (rotas, etc.)

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});