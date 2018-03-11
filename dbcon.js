var mysql = require('mysql');
var pool = mysql.createPool({
    connectionLimit : 10,
    host            : 'classmysql.engr.oregonstate.edu',
    user            : 'cs340_ackermda',
    password        : 'NgF8X6uryqPj',
    database        : 'cs340_ackermda'
});
module.exports.pool = pool;