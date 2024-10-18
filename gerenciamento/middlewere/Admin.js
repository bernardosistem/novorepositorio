

function AdminAuth(req, res, next){
    const user = req.session.admin;
    if(user !== undefined){
        next();
    } else {
        res.redirect("/acesso-negado-admin")
    }
}


module.exports = AdminAuth;