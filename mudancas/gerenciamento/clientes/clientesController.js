    const express = require('express');
const router = express.Router();
const Clientes = require('./Cliente2');
const ProcedimentTable = require("../procedimentos/Servicos");
const adminauth = require("../middlewere/adminauth")
const Vendas = require("../registro/Venda");
const Usuarios = require("../database/User");

const Administradores = require("../database/AdminTable")


const Formacao = require("../database/Formacao");
const VendaFormacao = require("../database/VendaFormacao");

const { Op } = require("sequelize")

const connection = require("../database/database");

const Venda = require("./venda")

const VendaProduto =  require("./VenderProduto");

const Atividades = require("../database/acoes");

const Produtos = require('./Produtos');


const { PDFDocument } = require('pdf-lib');
const html2canvas = require('html2canvas');

const multer = require('multer');

const Sequelize = require("sequelize");

const path = require('path');
const fs = require('fs');





// Rota para gerar o PDF e salvar na pasta de uploads
router.post('/gerar-relatorio-pdf', async (req, res) => {
  try {
      // Dados do recibo
      const { servicesDetails, productsDetails, formacoesDetails, totalServiceSales, totalProductSales, totalFormacaoSales, totalSales, totalExpenses, profit } = req.body;

      // Criar um novo documento PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);
      const { width, height } = page.getSize();
      const fontSize = 12;
      
      // Adicionar o texto ao PDF (isso é um exemplo, você pode adicionar HTML conforme desejar)
      page.drawText('Relatório de Vendas', { x: 50, y: height - 50, size: fontSize });
      page.drawText(`Total de Vendas de Serviços: Kz ${totalServiceSales}`, { x: 50, y: height - 80, size: fontSize });
      page.drawText(`Total de Vendas de Produtos: Kz ${totalProductSales}`, { x: 50, y: height - 110, size: fontSize });
      page.drawText(`Total de Vendas de Formaçōes: Kz ${totalFormacaoSales}`, { x: 50, y: height - 140, size: fontSize });
      page.drawText(`Total de Vendas: Kz ${totalSales}`, { x: 50, y: height - 170, size: fontSize });
      page.drawText(`Total de Despesas: Kz ${totalExpenses}`, { x: 50, y: height - 200, size: fontSize });
      page.drawText(`Lucro Líquido: Kz ${profit}`, { x: 50, y: height - 230, size: fontSize });

      // Salvar o PDF na pasta uploads
      const pdfBytes = await pdfDoc.save();
      const pdfPath = path.join(__dirname, '../uploads/relatorio.pdf');
      fs.writeFileSync(pdfPath, pdfBytes);

      // Retornar o caminho do arquivo PDF
      res.json({ pdfUrl: `/uploads/relatorio.pdf` });
  } catch (error) {
      console.error('Erro ao gerar o PDF:', error);
      res.status(500).send('Erro ao gerar o PDF.');
  }
});






















const pdfDir = path.join(__dirname, '../../public/pdfs');
if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
}


async function generatePDF(clienteId) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Define o URL da página que você deseja capturar
  const url = `http://localhost:3000/ficha/${clienteId}`; // Ajuste o URL conforme sua rota

  await page.goto(url, { waitUntil: 'networkidle0' });
  
  const pdfPath = path.join(pdfDir, `ficha_cliente_${clienteId}.pdf`);
  await page.pdf({
      path: pdfPath,
      format: 'A4'
  });

  await browser.close();

  return pdfPath;
}

module.exports = generatePDF;

const calcularNumeroClientesAgendados = require('../middlewere/NumeroAgendas');

const admin= require("../middlewere/Admin");
const Despesa = require('./Despesas');
const Formacoes = require('../database/Formacao');


router.post("/admin/schedule/client",adminauth, async (req, res) => {
  try {
    
     // Verifica se há uma sessão ativa e se é um usuário ou administrador
     const userId = req.session.user ? req.session.user.id : null;
     const adminId = req.session.admin ? req.session.admin.id : null;

    // Recebe os dados do front-end
    const { nome, BI, bairro, rua, data, procedimento, pagamento, contacto, metodoPagamento } = req.body;

    // Formata a data para o formato DD-MM-YYYY

    // Obtém o custo do serviço associado ao procedimento
    const procedimentoInfo = await ProcedimentTable.findOne({   
      where: { title: procedimento } // Busca o procedimento pelo título
    });

    if (procedimentoInfo) {
      const servicoId = procedimentoInfo.id; // Obtém o ID do procedimento

      // Cria o cliente associado ao usuário (funcionário do salão)
      const cliente = await Clientes.create({
        nome: nome,
        BI: BI,
        bairro: bairro,
        rua: rua,
        data: data,
        procedimento: procedimento,
        pagamento: pagamento,
        contactos: contacto,
        UserId: userId || null, // Associa o cliente ao usuário ou deixa como null se for um administrador
        ServicoId: servicoId // Associa o serviço agendado ao cliente
      });

    
      console.log("Cliente agendado e venda registrada com sucesso!");
      res.redirect("/admin/client/list");
    } else {
      console.error("Procedimento não encontrado.");
      res.status(400).send("Erro ao agendar cliente!");
    }
  } catch (error) {
    console.error("Erro ao agendar cliente:", error);
    res.status(500).send("Erro interno ao agendar cliente");
  }
});



router.post('/admin/register/sell', async (req, res) => {
  try {
      const { clienteId } = req.body;
      console.log('clienteId:', clienteId); // Adicione esta linha para depuração

      if (!clienteId) {
          return res.status(400).send("ID do cliente não fornecido");
      }

      // Busca o cliente pelo ID
      const cliente = await Clientes.findByPk(clienteId);
      if (!cliente) {
          return res.status(404).send("Cliente não encontrado");
      }

      // Procura o procedimento associado
      const procedimentoInfo = await ProcedimentTable.findOne({ where: { title: cliente.procedimento } });
      if (!procedimentoInfo) {
          return res.status(400).send("Procedimento não encontrado");
      }

      // Registra a venda
      await Vendas.create({
          typeService: cliente.procedimento,
          date: cliente.data,
          valor: procedimentoInfo.preco,
          serviceCost: procedimentoInfo.preco,
          metodoPagamento: cliente.pagamento,
          ClientId: cliente.id,
          ServicoId: procedimentoInfo.id
      });

      // Verifica o tipo de usuário na sessão
      if (req.session.user) {
          // Sessão de usuário
          const userId = req.session.user.id;

          let atividade = await Atividades.findOne({ where: { UserId: userId } });
          if (atividade) {
              atividade.totalVendas += 1;
              atividade.updatedAt = new Date();
              await atividade.save();
          } else {
              await Atividades.create({
                  UserId: userId,
                  totalVendas: 1,
                  totalAtualizacoesServicos: 0,
                  createdAt: new Date(),
                  updatedAt: new Date()
              });
          }
      } else if (req.session.admin) {
          // Sessão de administrador
          // Administradores não precisam atualizar a tabela de Atividades
          console.log('Administrador registrando a venda, tabela de atividades não atualizada.');
      } else {
          return res.status(403).send("Sessão inválida");
      }

      // Retorna os dados do cliente necessários para o script
      res.json({
          cliente,
          custo: procedimentoInfo.preco
      });

  } catch (error) {
      console.error(error);
      res.status(500).send('Erro ao registrar a venda');
  }
});




const CLIENTS_PER_PAGE = 6;

router.get('/admin/client/list', calcularNumeroClientesAgendados, adminauth, async (req, res) => {
  try {
    // Pega a página atual a partir dos parâmetros da query, padrão para 1
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * CLIENTS_PER_PAGE;

    // Conta o total de clientes
    const totalClients = await Clientes.count();
    const totalPages = Math.ceil(totalClients / CLIENTS_PER_PAGE);

    // Busca os clientes da página atual
    const clientes = await Clientes.findAll({
      order: [['id', 'DESC']],
      limit: CLIENTS_PER_PAGE,
      offset: offset
    });

    // Busca os procedimentos, se necessário
    const proced = await ProcedimentTable.findAll({
      order: [['id', 'DESC']]
    });

    res.render('admin/clientes', {
      clientes: clientes,
      proced: proced,
      numeroClientesAgendados: req.numeroClientesAgendados,
      currentPage: page,
      totalPages: totalPages
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao carregar clientes');
  }
});










router.get("/ficha/:id", adminauth, calcularNumeroClientesAgendados, async (req, res) => {
  try {
    const id = req.params.id;
    const atendenteId = req.session.user ? req.session.user.id : req.session.admin.id;

    if (!isNaN(id) && id !== undefined && !isNaN(atendenteId) && atendenteId !== undefined) {
      const cliente = await Clientes.findByPk(id);
      const proced = await ProcedimentTable.findAll({ order: [['id', 'DESC']] });
      const custo = await ProcedimentTable.findOne({ where: { id: cliente.ServicoId } });

      let atendenteNome = '';

      if (req.session.admin) {
        // O usuário é um administrador
        const admin = await Administradores.findByPk(atendenteId);
        atendenteNome = admin ? admin.nome : 'Administrador Desconhecido';
      } else if (req.session.user) {
        // O usuário é um usuário comum
        const user = await Usuarios.findByPk(atendenteId);
        atendenteNome = user ? user.nome : 'Usuário Desconhecido';
      } else {
        // Caso não esteja autenticado ou sessão não esteja definida
        atendenteNome = 'Desconhecido';
      }

      res.render("admin/ficha", {
        cliente: cliente,
        atendente: atendenteNome, // Passa o nome do atendente modificado
        proced: proced,
        numeroClientesAgendados: req.numeroClientesAgendados,
        custo: custo.preco
      });
    } else {
      res.status(400).send("ID inválido");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao processar a requisição");
  }
});









router.get("/crate-produts",calcularNumeroClientesAgendados, (req, res)=>{


  const proced = ProcedimentTable.findAll();
  

  Produtos.findAll({order:[
      ['id','DESC']
  ]}).then(produtos=>{


      res.render("admin/produtos/novo",{
         
          numeroClientesAgendados: req.numeroClientesAgendados,
          produtos,
          proced
      })

  }).catch(error =>{
      console.error("Erro ao buscar procedimento:", error);
      res.status(500).send("Erro intern ao buscar procedimentos!")
  })

})



router.post('/cadastrar-produto', async (req, res) => {
  const { nome, preco, quantidade } = req.body;

  try {
      if (!nome || !preco || !quantidade) {
          return res.json({ success: false, message: 'Dados faltando' });
      }

      await Produtos.create({ nome, preco, quantidade });
      res.json({ success: true, message: 'Produto cadastrado com sucesso!' });
  } catch (error) {
      console.error(error);
      res.json({ success: false, message: 'Erro ao cadastrar o produto' });
  }
});



router.get("/vender-produtos",calcularNumeroClientesAgendados, (req, res)=>{
  Produtos.findAll({order:[
      ['id','DESC']
  ]}).then(produtos=>{
      res.render("admin/produtos/venderProduto",{
          produtos,
          numeroClientesAgendados: req.numeroClientesAgendados 
      })

  }).catch(error =>{
      console.error("Erro ao buscar procedimento:", error);
      res.status(500).send("Erro intern ao buscar procedimentos!")
  })

})


router.post("/delete/client", adminauth, (req, res)=>{
    var id = req.body.id;
    Clientes.destroy({
        where : {id : id}
    }).then(()=>{
        res.redirect("/admin/client/list")
    })
});



router.post("/vender-produto", async (req, res) => {
  try {
    // Criação de uma nova venda
    const venda = await Venda.create({
      cliente: req.body.nome,
      nif: req.body.nif
    });

    // Produtos selecionados (pode ser um array ou um único valor)
    let produtos = req.body['produtos[]'];
    if (!Array.isArray(produtos)) {
      produtos = [produtos];
    }

    // Quantidades de produtos
    const quantidades = JSON.parse(req.body.quantidadesJson);

    console.log("Produtos selecionados:", produtos);
    console.log("Quantidades:", quantidades);

    // Verifica se o array de produtos e o objeto de quantidades estão definidos
    if (!produtos || produtos.length === 0) {
      throw new Error("Nenhum produto selecionado.");
    }

    if (!quantidades || typeof quantidades !== 'object') {
      throw new Error("Quantidades não estão definidas.");
    }

    // Itera sobre os produtos selecionados e suas quantidades
    for (let produtoId of produtos) {
      let quantidade = quantidades[produtoId];
      // Verifica se a quantidade está definida e é um número
      if (quantidade && !isNaN(quantidade) && quantidade > 0) {
        // Atualiza a quantidade do produto
        await Produtos.update(
          { quantidade: Sequelize.literal(`quantidade - ${quantidade}`) },
          { where: { id: produtoId } }
        );

        // Verifica se a quantidade do produto caiu para zero
        const produto = await Produtos.findByPk(produtoId);
        if (produto.quantidade <= 0) {
          // Opcional: Notifica que o produto está esgotado
          // Você pode adicionar lógica adicional aqui, se necessário
        }

        // Cria o registro de venda do produto
        await VendaProduto.create({
          vendapId: venda.id,
          ProdutoId: parseInt(produtoId, 10),
          quantidade: parseInt(quantidade, 10) // Converte para número inteiro
        });
      }
    }

    // Redireciona para a ficha do cliente após a venda ser registrada
    res.redirect(`/ficha-cliente/${venda.id}`);
  } catch (error) {
    console.error("Erro ao registrar a venda:", error);
    res.status(500).send("Erro ao registrar a venda!");
  }
});






router.get('/ficha-cliente/:vendaId', calcularNumeroClientesAgendados, async (req, res) => {
  try {
    const vendaId = req.params.vendaId;

    // Buscar venda
    const venda = await Venda.findByPk(vendaId);
    if (!venda) {
      return res.status(404).send("Venda não encontrada.");
    }

    // Buscar produtos e quantidades associados à venda
    const vendaProdutos = await connection.query(
      'SELECT ProdutoId, quantidade FROM vendaprodutos WHERE vendapId = ?',
      {
        replacements: [vendaId],
        type: Sequelize.QueryTypes.SELECT
      }
    );

    // Se não houver produtos associados à venda, retornar erro
    if (vendaProdutos.length === 0) {
      return res.status(404).send("Nenhum produto encontrado para esta venda.");
    }

    // Buscar detalhes dos produtos
    const produtoIds = vendaProdutos.map(vp => vp.ProdutoId);
    const produtos = await connection.query(
      'SELECT id, nome, preco FROM produtos WHERE id IN (?)',
      {
        replacements: [produtoIds],
        type: Sequelize.QueryTypes.SELECT
      }
    );

    // Mapear detalhes dos produtos
    const produtosMap = new Map(produtos.map(p => [p.id, p]));

    // Calcular o total gasto
    let totalGasto = 0;
    const produtosDetalhados = vendaProdutos.map(vp => {
      const produto = produtosMap.get(vp.ProdutoId);
      if (!produto) {
        // Se o produto não for encontrado, retornar um erro
        console.error(`Produto com ID ${vp.ProdutoId} não encontrado.`);
        return null;
      }
      // Garantir que o preço é tratado como número
      const preco = parseFloat(produto.preco);
      const totalProduto = vp.quantidade * preco;
      totalGasto += totalProduto;
      return {
        nome: produto.nome,
        preco,
        quantidade: vp.quantidade,
        totalProduto
      };
    }).filter(item => item !== null); // Filtrar itens nulos, caso algum produto não seja encontrado

    res.render('admin/produtos/fichaVenda', {
      venda,
      produtos: produtosDetalhados,
      totalGasto,
      numeroClientesAgendados: req.numeroClientesAgendados 
    });
  } catch (error) {
    console.error("Erro ao gerar a ficha do cliente:", error);
    res.status(500).send("Erro ao gerar a ficha do cliente!");
  }
});






router.get("/criar-despesas", calcularNumeroClientesAgendados, (req, res)=>{

  
 res.render("admin/Cadastros/despesas",{
  numeroClientesAgendados: req.numeroClientesAgendados
 })
});




router.get("/relatorio-despesas", calcularNumeroClientesAgendados, (req, res)=>{

  
  res.render("admin/Relatorios/despesas",{
   numeroClientesAgendados: req.numeroClientesAgendados
  })
 });
 


 


router.get("/geral",calcularNumeroClientesAgendados , async (req, res)=>{


  try {
    const formacoes = await Formacoes.findAll();
    const services = await ProcedimentTable.findAll();
    const products = await Produtos.findAll();
    res.render('admin/Relatorios/geral', { services, products, numeroClientesAgendados: req.numeroClientesAgendados, formacoes });
} catch (error) {
    console.error('Erro ao carregar serviços e produtos:', error);
    res.status(500).send('Erro ao carregar dados.');
}

  })


// Função para calcular a data com base no período selecionado
const calcularData = (periodo) => {
  let dataAtual = new Date();
  let dataInicio, dataFim;

  switch (periodo) {
      case 'dia':
          dataInicio = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate());
          dataFim = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate() + 1);
          break;
      case 'semana':
          let diaSemana = dataAtual.getDay();
          let diasAteInicioSemana = diaSemana === 0 ? 6 : diaSemana - 1;
          dataInicio = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate() - diasAteInicioSemana);
          dataFim = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), dataInicio.getDate() + 7);
          break;
      case 'mes':
          dataInicio = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
          dataFim = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0);
          break;
      case 'trimestre':
          let trimestre = Math.floor((dataAtual.getMonth() / 3));
          dataInicio = new Date(dataAtual.getFullYear(), trimestre * 3, 1);
          dataFim = new Date(dataInicio.getFullYear(), dataInicio.getMonth() + 3, 0);
          break;
      case 'semestre':
          let semestre = Math.floor(dataAtual.getMonth() / 6);
          dataInicio = new Date(dataAtual.getFullYear(), semestre * 6, 1);
          dataFim = new Date(dataInicio.getFullYear(), dataInicio.getMonth() + 6, 0);
          break;
      case 'ano':
          dataInicio = new Date(dataAtual.getFullYear(), 0, 1);
          dataFim = new Date(dataAtual.getFullYear(), 11, 31);
          break;
      default:
          dataInicio = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate());
          dataFim = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate() + 1);
          break;
  }

  return { dataInicio, dataFim };
};


// Rota para processar o relatório
router.post('/gerar-relatorio', calcularNumeroClientesAgendados, async (req, res) => {
  try {
      const selectedServices = JSON.parse(req.body.services || '[]');
      const selectedProducts = JSON.parse(req.body.products || '[]');
      const selectedFormacoes = JSON.parse(req.body.formacoes || '[]'); // Adicionado para formações
      const periodo = req.body.periodo || 'dia';  // Padrão: 'dia'

      const { dataInicio, dataFim } = calcularData(periodo);

      let servicesDetails = [];
      let totalServiceSales = 0;
      if (selectedServices.length > 0) {
          const serviceSales = await Vendas.findAll({
              where: {
                  ServicoId: selectedServices,
                  createdAt: {
                      [Op.between]: [dataInicio, dataFim]
                  }
              }
          });

          const services = await ProcedimentTable.findAll({
              where: { id: selectedServices }
          });

          const serviceMap = services.reduce((acc, service) => {
              acc[service.id] = service;
              return acc;
          }, {});

          const serviceAggregates = serviceSales.reduce((acc, sale) => {
              const service = serviceMap[sale.ServicoId];
              if (!acc[service.id]) {
                  acc[service.id] = {
                      title: service.title,
                      preco: parseFloat(service.preco),
                      valor: 0
                  };
              }
              acc[service.id].valor += parseFloat(sale.valor);
              return acc;
          }, {});

          servicesDetails = Object.values(serviceAggregates);
          totalServiceSales = servicesDetails.reduce((total, service) => total + (service.valor || 0), 0);
      }

      let productsDetails = [];
      let totalProductSales = 0;
      if (selectedProducts.length > 0) {
          const productSales = await VendaProduto.findAll({
              where: {
                  ProdutoId: selectedProducts,
                  createdAt: {
                      [Op.between]: [dataInicio, dataFim]
                  }
              }
          });

          const products = await Produtos.findAll({
              attributes: ['id', 'nome', 'preco'],
              where: { id: selectedProducts }
          });

          const productMap = products.reduce((acc, product) => {
              acc[product.id] = product;
              return acc;
          }, {});

          const productAggregates = productSales.reduce((acc, sale) => {
              const product = productMap[sale.ProdutoId];
              if (!acc[product.id]) {
                  acc[product.id] = {
                      nome: product.nome,
                      preco: parseFloat(product.preco),
                      total: 0
                  };
              }
              acc[product.id].total += parseFloat(product.preco) * parseInt(sale.quantidade, 10);
              return acc;
          }, {});

          productsDetails = Object.values(productAggregates);
          totalProductSales = productsDetails.reduce((total, product) => total + (product.total || 0), 0);
      }

      let formacoesDetails = [];
      let totalFormacaoSales = 0;
      if (selectedFormacoes.length > 0) {
          const formacaoSales = await VendaFormacao.findAll({
              where: {
                  FormacoId: selectedFormacoes,
                  createdAt: {
                      [Op.between]: [dataInicio, dataFim]
                  }
              }
          });

          const formacoes = await Formacao.findAll({
              attributes: ['id', 'nome', 'valor'],
              where: { id: selectedFormacoes }
          });

          const formacaoMap = formacoes.reduce((acc, formacao) => {
              acc[formacao.id] = formacao;
              return acc;
          }, {});

          const formacaoAggregates = formacaoSales.reduce((acc, sale) => {
              const formacao = formacaoMap[sale.FormacoId];
              if (!acc[formacao.id]) {
                  acc[formacao.id] = {
                      nome: formacao.nome,
                      valor: parseFloat(formacao.valor),
                      total: 0
                  };
              }
              acc[formacao.id].total += parseFloat(formacao.valor); // Supondo que cada venda é uma unidade
              return acc;
          }, {});

          formacoesDetails = Object.values(formacaoAggregates);
          totalFormacaoSales = formacoesDetails.reduce((total, formacao) => total + (formacao.total || 0), 0);
      }

      let totalSales = totalServiceSales + totalProductSales + totalFormacaoSales; // Incluindo formações

      const expenses = await Despesa.findAll({
          where: {
              createdAt: {
                  [Op.between]: [dataInicio, dataFim]
              }
          }
      });
      let totalExpenses = expenses.reduce((total, expense) => total + (parseFloat(expense.valor) || 0), 0);

      let profit = totalSales - totalExpenses;

      totalServiceSales = Number(totalServiceSales);
      totalProductSales = Number(totalProductSales);
      totalFormacaoSales = Number(totalFormacaoSales); // Incluindo formações
      totalSales = Number(totalSales);
      totalExpenses = Number(totalExpenses);
      profit = Number(profit);

      res.render('admin/Relatorios/relatorioResultado', {
          servicesDetails,
          productsDetails,
          formacoesDetails, // Adicionando detalhes das formações
          totalServiceSales,
          totalProductSales,
          totalFormacaoSales, // Adicionando total das formações
          totalSales,
          totalExpenses,
          profit,
          periodo,
          numeroClientesAgendados: req.numeroClientesAgendados
      });

  } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      res.status(500).send('Erro ao gerar relatório.');
  }
});

   
module.exports = router;
