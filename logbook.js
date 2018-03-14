module.exports = function() {
    var express = require('express');
    var router = express.Router();

    function getClimber(res, mysql, context, id, complete) {
        var sql = "SELECT id, name FROM climbers WHERE id = ?";
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
 
    function getClimberProblems(res, mysql, context, cid, complete) {
        var sql = "SELECT problems.id, problems.name, problems.difficulty, zones.name as zone FROM ascents " +
                    "INNER JOIN climbers ON ascents.cid = climbers.id " +
                    "INNER JOIN problems ON ascents.pid = problems.id " +
                    "INNER JOIN zones ON problems.zoneid = zones.id " +
                    "WHERE climbers.id = ? ORDER BY problems.difficulty";
        var inserts = [cid];
        mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            }
            context.problems = results;
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

    function getZoneProblems(res, mysql, context, zid, complete) {
        var sql = "SELECT problems.id, problems.name, problems.difficulty, zones.name as zone FROM problems " + 
                    "INNER JOIN zones ON problems.zoneid = zones.id " + 
                    "WHERE zones.id = ? ORDER BY problems.difficulty";
        var inserts = [zid];
        mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            }
            context.zoneproblems = results;
            complete();
        });
    }


    router.get('/:id', function(req, res) {
        callbackCount = 0;
        var context = {};
        context.jsscripts = ["updatelogbook.js"];
        var mysql = req.app.get('mysql');
        getClimber(res, mysql, context, req.params.id, complete);
        getZones(res, mysql, context, complete);
        getClimberProblems(res, mysql, context, req.params.id, complete);
        if (req.url.indexOf("?zone=") > 0) {
            var zoneid = parseInt(req.url.substring(req.url.indexOf("?zone=") + 6));
            getZoneProblems(res, mysql, context, zoneid, complete);
        } else {
            complete();
        }
        
        function complete() {
            callbackCount++;
            if (callbackCount >= 4) {
                res.render('logbook', context);
            }
        }
    });

    router.post('/:id', function(req, res) {
        var mysql = req.app.get('mysql');
        var callbackCount = 0;
        if (!Array.isArray(req.body.zoneproblems)) {
            var arr = [];
            arr.push(req.body.zoneproblems);
            req.body.zoneproblems = arr;
        }
        
        for (var i = 0; i < req.body.zoneproblems.length; i++) {
            addAscent(res, req.params.id, req.body.zoneproblems[i], mysql, complete);
        }

        function complete() {
            callbackCount++;
            if (callbackCount >= req.body.zoneproblems.length) {
                res.redirect('/logbook/' + req.params.id);
            }
        }

        function addAscent(res, cid, pid, mysql, complete) {
            var sql = "CALL add_ascent(?, ?)";
            var inserts = [cid, pid];
            mysql.pool.query(sql, inserts, function(error, results, fields) {
                if (error) {
                    res.write(JSON.stringify(error));
                    res.end();
                } else {
                    complete();
                }
            });
        }
    });
    
    router.delete('/:cid/:pid', function(req, res) {
        var mysql = req.app.get('mysql');
        var sql = "CALL delete_ascent(?, ?)";
        var inserts = [req.params.cid, req.params.pid];
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
    });


    return router;
}();