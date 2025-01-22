exports.get404page = (req, res, next) => {
    res.status(404).render('404.pug', { pageTitle: 'Page Not Found', path: '/404', isAuthenticated: req.session.isLoggedIn });// khong can di them vi da cung cap
}

exports.get500page = (req, res, next) => {
    res.status(500).render('500.pug', { pageTitle: 'Some thing went wrong!', path: '/500', isAuthenticated: req.session.isLoggedIn });// khong can di them vi da cung cap
}