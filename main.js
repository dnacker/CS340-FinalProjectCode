var express = require('express');
var mysql = require('./dbcon.js');
var bodyParser = require('body-parser');

var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});

app.engine('handlebars', handlebars.engine);
app.use(bodyParser.urlencoded({extended:true}));
app.use('/static', express.static('public'));
app.set('view engine', 'handlebars');
app.set('port', process.env.PORT || 8000);
app.set('mysql', mysql);


app.use('/climbers', require('./climbers.js'));
app.use('/problems', require('./problems.js'));
app.use('/logbook', require('./logbook.js'));
app.use('/zones', require('./zones.js'));


app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500);
    res.render('500');
});


app.get('/', function(req, res){
    var context = {};
    context.jsscripts = ['googleSignIn.js'];
    res.render('home', context);
});

app.listen(app.get('port'), function() {
    console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});