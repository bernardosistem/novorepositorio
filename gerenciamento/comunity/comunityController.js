// membroController.js
const express = require('express');
const router = express.Router();

const Comunity = require("./Comunity");

const fotoacomunity = require("./fotoComunity");

const status = require("../User/Status");

const multer = require('multer');
const path = require('path');

// Configurar o armazenamento para salvar na pasta 'uploads'
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nome do arquivo com timestamp para evitar duplicatas
    }
});

// Inicializar o Multer com a configuração de armazenamento
const upload = multer({ storage: storage });




router.get("/comunity-page-create", (req, res)=>{

    res.render("entradas/Comunidade");
})



router.post('/cadastrar-comunidade', upload.single('foto'), async (req, res) => {
    try {
        // Capturar o nome da comunidade a partir do formulário
        const { nome } = req.body;

        // Criar uma nova entrada na tabela Comunidade
        const novaComunidade = await Comunity.create({ nome });

        // Verificar se o arquivo de foto foi enviado
        if (req.file) {
            const caminhoFoto = req.file.path; // Caminho da foto no servidor

            // Salvar o caminho da foto na tabela FotoComunity, associando à comunidade criada
            await fotoacomunity.create({
                foto: caminhoFoto,
                ComunityId: novaComunidade.id
            });
        }

        // Iniciar uma sessão com o ID da nova comunidade e definir a estrutura do utilizador
        req.session.utilizador = {
            comunityId: novaComunidade.id
        };

        console.log("ID DA COMUNIDADE: ", req.session.utilizador.comunityId);

        res.redirect("/user-form");
    } catch (error) {
        console.error('Erro ao cadastrar comunidade:', error);
        res.status(500).send('Erro no servidor ao cadastrar comunidade.');
    }
});





module.exports = router;
