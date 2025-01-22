module.exports = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
    //we have to use next() because we'll include many middleware
    //if this middleware is done, the next one can be executed
    next();
}