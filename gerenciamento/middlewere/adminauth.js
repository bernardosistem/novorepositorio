

function AdminAuth(req, res, next){
    const user = req.session.user;
    const admin  =req.session.admin;
    if(user !== undefined || admin  !== undefined){
        next();
    } else {
        res.redirect("/acesso-negado")
    }
}


module.exports = AdminAuth;