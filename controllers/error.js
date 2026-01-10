exports.pageNotFound = (req, res, next) => {
  res.status(404).render('404', {
    pageTitle: 'Page Not Found',
    path: '404',

    // session safe data
    isLoggedIn: req.session?.isLoggedIn || false,
    user: req.session?.user || null,
    role: req.session?.user?.role || null
  });
};
