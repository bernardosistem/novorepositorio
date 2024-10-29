const Usuario  = require('../User/User'); // Certifique-se de que o caminho para o modelo de usuários está correto

// Middleware para verificar se o usuário é admin ou super_admin
const verificarAdmin = async (req, res, next) => {
    try {
        const usuarioId = req.session.utilizador?.id; // Obtendo o ID do usuário da sessão

        if (!usuarioId) {
            return res.redirect('/login'); // Redirecionar para o login se o usuário não estiver autenticado
        }

        // Verifique o usuário na tabela de usuários
        const usuario = await Usuario.findOne({
            where: {
                id: usuarioId
            }
        });

        // Verifica se o usuário é admin ou super_admin
        if (!usuario || (usuario.type_user !== 'admin' && usuario.type_user !== 'super_admin')) {
            return res.render("AcessoNegado/noAdmin"); // Renderiza a página de acesso negado se não for admin ou super_admin
        }

        // Se for admin ou super_admin, prossiga para a próxima rota
        next();
    } catch (error) {
        console.error('Erro ao verificar tipo de usuário:', error);
        return res.status(500).json({ message: 'Erro ao verificar tipo de usuário.' });
    }
};

module.exports = verificarAdmin;
