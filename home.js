module.exports = function() {
    var express = require('express');
    var router = express.Router();

    router.get('/', function(req, res) {
        context = {};
        res.render('home');
    });

    return router;
}();