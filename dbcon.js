var mysql = require('mysql');
var pool = mysql.createPool({
    connectionLimit : 10,
    host            : 'e764qqay0xlsc4cz.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    user            : 'jefox7cjpd3tzaw7',
    password        : 'wgyqezzhnmlfyh7j',
    database        : 'm6so6mw5tgxatlc5'
});
module.exports.pool = pool;
