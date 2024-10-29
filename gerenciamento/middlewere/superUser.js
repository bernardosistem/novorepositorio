// Middleware para verificar se o usuário é super_admin
function isSuperAdmin(req, res, next) {
    // Verifica se há uma sessão e se o tipo de usuário é 'super_admin'
    if (req.session && req.session.userType === 'super_admin') {
        return next(); // Se for super_admin, prossegue para a próxima rota
    } else {
        // Se não for super_admin ou não houver sessão, retorna um erro 403
        return res.status(403).send('Acesso negado: você não é um super administrador.');
    }
}

// Exporta o middleware para uso em outras partes da aplicação
module.exports = isSuperAdmin;
