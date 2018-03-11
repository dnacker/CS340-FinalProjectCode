module.exports = function() {
    var express = require('express');
    var router = express.Router();

    function getClimbers(res, mysql, context, complete) {
        mysql.pool.query("SELECT climbers.id, climbers.name, age, weight, height, ascents, zones.name as homezone FROM climbers LEFT JOIN zones ON home_zone_id = zones.id", function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            }
            context.climbers = results;
            complete();
        });
    }

    function getClimber(res, mysql, context, id, complete) {
        var sql = "SELECT id, name, age, weight, height FROM climbers WHERE id = ?";
        var inserts = [id];
        mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            }
            context.climber = results[0];
            complete();
        });
    }

    function getZones(res, mysql, context, complete) {
        mysql.pool.query("SELECT id, name FROM zones", function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            }
            context.zones = results;
            complete();
        });
    }

    function deleteClimber(req, res, mysql) {
        var sql = "DELETE FROM climbers WHERE id = ?";
        var inserts = [req.params.id];
        sql = mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.status(400);
                res.end();
            } else {
                res.status(202);
                res.end();
            }
        });
    }

    function decrementAllProblems(req, res, mysql) {
        var sql = "SELECT problems.id FROM problems " +
                "INNER JOIN ascents ON problems.id = ascents.pid " +
                "INNER JOIN climbers ON climbers.id = ascents.cid " +
                "WHERE climbers.id = ?";
        var inserts = [req.params.id];
        sql = mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.status(400);
                res.end();
            } else {
                for (var i = 0; i < results.length; i++) {
                    decrementProblem(res, results[i], mysql);
                }
                deleteClimber(req, res, mysql);
            }
        });
    }

    function decrementProblem(res, pid, mysql) {
        var sql = "UPDATE problems SET problems.ascents = problems.ascents - 1 WHERE problems.id = ?";
        var inserts = [pid];
        sql = mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.status(400);
                res.end();
            }
        });
    }

    router.get('/', function(req, res) {
        var callbackCount = 0;
        var context = {};
        context.jsscripts = ["deleteclimber.js"];
        var mysql = req.app.get('mysql');
        getZones(res, mysql, context, complete);
        getClimbers(res, mysql, context, complete);
        function complete() {
            callbackCount++;
            if (callbackCount >= 2) {
                res.render('climbers', context);
            }
        }
    });

    router.post('/', function(req, res) {
        var mysql = req.app.get('mysql');
        var sql = "INSERT INTO climbers (name, age, weight, height, ascents, home_zone_id) VALUES (?, ?, ?, ?, ?, ?)";
        var inserts = [req.body.name, req.body.age, req.body.weight, req.body.height, 0, req.body.homezone];
        sql = mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            } else {
                res.redirect('/climbers');
            }
        });
    });

    router.get('/:id', function(req, res) {
        callbackCount = 0;
        var context = {};
        context.jsscripts = ["updateclimber.js"];
        var mysql = req.app.get('mysql');
        getZones(res, mysql, context, complete);
        getClimber(res, mysql, context, req.params.id, complete);
        function complete() {
            callbackCount++;
            if (callbackCount >= 2) {
                res.render('update-climber', context);
            }
        }
    });

    router.put('/:id', function(req, res) {
        var mysql = req.app.get('mysql');
        var sql = "UPDATE climbers SET name=?, age=?, weight=?, height=?, home_zone_id=? WHERE id=?";
        var inserts = [req.body.name, req.body.age, req.body.weight, req.body.height, req.body.homezone, req.params.id];
        sql = mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            } else {
                res.status(200);
                res.end();
            }
        });
    });

    router.delete('/:id', function(req, res) {
        var mysql = req.app.get('mysql');
        decrementAllProblems(req, res, mysql);
    });


    return router;
}();