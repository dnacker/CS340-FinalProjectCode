module.exports = function() {
    var express = require('express');
    var router = express.Router();

    function getProblems(res, mysql, zid, context, complete) {
        var sql = "SELECT id, name, difficulty, COUNT(problems.id) AS problemTotal FROM problems " + 
                "LEFT JOIN ascents ON problems.id = ascents.pid " +
                "WHERE problems.zoneid = ? " + 
                "GROUP BY problems.id " + 
                "ORDER BY difficulty";
        var inserts = [zid];
        sql = mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            }
            context.problems = results;
            complete();
        });
    }

    function getZone(res, mysql, zid, context, complete) {
        var sql = "SELECT zones.id, zones.name, country, state FROM zones WHERE zones.id = ?";
        var inserts = [zid];
        sql = mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            }
            context.zone = results[0];
            complete();
        });
    }

    function getZones(res, mysql, context, complete) {
        var sql = "SELECT zones.id, zones.name, country, state, COUNT(DISTINCT climbers.id) AS climberTotal, COUNT(DISTINCT problems.id) AS problemTotal FROM zones " +
                "LEFT JOIN climbers ON climbers.home_zone_id = zones.id " +
                "LEFT JOIN problems ON problems.zoneid = zones.id " +
                "GROUP BY zones.id";
        sql = mysql.pool.query(sql, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            }
            context.zones = results;
            complete();
        });
    }

    router.get('/', function(req, res) {
        var mysql = req.app.get('mysql');
        var context = {}
        context.jsscripts = ['deletezone.js'];
        getZones(res, mysql, context, complete);
        function complete() {
            res.render('zones', context);
        }
    });

    router.get('/:zid', function(req, res){
        var mysql = req.app.get('mysql');
        var context = {};
        context.jsscripts = ['updatezone.js', 'deleteproblem.js'];
        var callbackCount = 0;
        getProblems(res, mysql, req.params.zid, context, complete);
        getZone(res, mysql, req.params.zid, context, complete);
        function complete() {
            callbackCount++;
            if (callbackCount >= 2) {
                res.render('update-zone', context);
            }
        }
    });

    router.post('/', function(req, res) {
        var mysql = req.app.get('mysql');
        var sql = "INSERT INTO zones (name, country, state) VALUES (?, ?, ?)";
        var inserts = [req.body.name, req.body.country, req.body.state];
        sql = mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.status(400);
                res.end();
            } else {
                res.status(200);
                res.redirect('/zones');
            }
        });

    });

    router.put('/:zid', function(req, res) {
        var mysql = req.app.get('mysql');
        var sql = "UPDATE zones SET name=?, country=?, state=? WHERE id=?";
        var inserts = [req.body.name, req.body.country, req.body.state, req.params.zid];
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

    router.delete('/:zid', function(req, res) {
        var mysql = req.app.get('mysql');
        var sql = "DELETE FROM zones WHERE id = ?";
        var inserts = [req.params.zid];
        sql = mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.status(400);
                res.end();
            } else {
                res.status(202)
                res.end();
            }
        });
    });

    return router;
}();