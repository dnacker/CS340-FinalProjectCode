module.exports = function() {
    var express = require('express');
    var router = express.Router();

    function getClimbers(res, mysql, context, complete) {
        var sql = "SELECT climbers.id, climbers.name, age, weight, height, COUNT(DISTINCT ascents.pid) as cAscents, zones.name as homezone FROM climbers " +
                "LEFT JOIN zones ON home_zone_id = zones.id " +
                "LEFT JOIN ascents ON climbers.id = ascents.cid " +
                "GROUP BY climbers.id";
        mysql.pool.query(sql, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            }
            context.climbers = results;
            complete();
        });
    }

    function getClimber(res, mysql, context, cid, complete) {
        var sql = "SELECT climbers.id, climbers.name, age, weight, height, home_zone_id FROM climbers WHERE id = ?";
        var inserts = [cid];
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

    function buildZonesContext(context) {
        var zones = context.zones;
        if (!Array.isArray(zones)) {
            zones = [zones];
        }
        for (var i = 0; i < zones.length; i++) {
            zones[i].selected = false;
            if (zones[i].id == context.climber.home_zone_id) {
                zones[i].selected = true;
            }
        }
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
        var sql = "INSERT INTO climbers (name, age, weight, height, home_zone_id) VALUES (?, ?, ?, ?, ?)";
        var inserts = [req.body.name, req.body.age, req.body.weight, req.body.height, req.body.homezone];
        sql = mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            } else {
                res.redirect('/climbers');
            }
        });
    });

    router.get('/:cid', function(req, res) {
        callbackCount = 0;
        var context = {};
        context.jsscripts = ["updateclimber.js"];
        var mysql = req.app.get('mysql');
        getZones(res, mysql, context, complete);
        getClimber(res, mysql, context, req.params.cid, complete);
        function complete() {
            callbackCount++;
            if (callbackCount >= 2) {
                buildZonesContext(context);
                console.log(context);
                res.render('update-climber', context);
            }
        }
    });

    router.put('/:cid', function(req, res) {
        var mysql = req.app.get('mysql');
        var sql = "UPDATE climbers SET name=?, age=?, weight=?, height=?, home_zone_id=? WHERE id=?";
        var inserts = [req.body.name, req.body.age, req.body.weight, req.body.height, req.body.homezone, req.params.cid];
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

    router.delete('/:cid', function(req, res) {
        var mysql = req.app.get('mysql');
        var sql = "DELETE FROM climbers WHERE id = ?"
        var inserts = req.params.cid;
        sql = mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            } else {
                res.status(202);
                res.end();
            }
        });
    });
    return router;
}();