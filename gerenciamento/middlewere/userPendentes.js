
const status = require("../User/Status");

// Middleware para verificar se o usuário tem status aprovado
const verificarStatusAprovado = async (req, res, next) => {
    try {
        const usuarioId = req.session.utilizador?.id; // Obtendo o ID do usuário da sessão
        
        if (!usuarioId) {
            return res.render("AcessoNegado/noSession"); // Redirecionar para o login se o usuário não estiver autenticado
        }

        // Verifique o status do usuário na tabela de status
        const statusUsuario = await status.findOne({
            where: {
                usuario2Id: usuarioId
            }
        });

        // Se o status for 'pendente', redirecione para a página 'contaPendente'
        if (statusUsuario && statusUsuario.status === 'pendente') {
            return res.render('status/contaPendente');
        }

        // Se o status for 'aprovado', prossiga para a próxima rota
        next();
    } catch (error) {
        console.error('Erro ao verificar status do usuário:', error);
        return res.status(500).json({ message: 'Erro ao verificar status do usuário.' });
    }
};

// Exportar o middleware para uso em outras partes do aplicativo
module.exports = verificarStatusAprovado;
