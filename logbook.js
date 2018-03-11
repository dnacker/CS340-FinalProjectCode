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
                    "WHERE climbers.id = ?";
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

    function getAllProblems(res, mysql, context, complete) {
        var sql = "SELECT problems.id, problems.name, problems.difficulty, zones.name as zone FROM problems " + 
                    "INNER JOIN zones ON problems.zoneid = zones.id";
        mysql.pool.query(sql, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            }
            context.allproblems = results;
            complete();
        });
    }

    function getZoneProblems(res, mysql, context, zid, complete) {
        var sql = "SELECT problems.id, problems.name, problems.difficulty, zones.name as zone FROM problems " + 
                    "INNER JOIN zones ON problems.zoneid = zones.id WHERE zones.id = ?";
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
                // console.log(context);
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
        
        updateAscents(req, res, mysql, complete);
        for (var i = 0; i < req.body.zoneproblems.length; i++) {
            incrementProblem(res, mysql, req.params.id, req.body.zoneproblems[i], complete);
        }
        
        function complete() {
            callbackCount++;
            if (callbackCount >= 1 + req.body.zoneproblems.length) {
                res.redirect('/logbook/' + req.params.id);
            }
        }

        
    });

    function updateAscents(req, res, mysql, complete) {
        var valueStr = "";
        for (var i = 0; i < req.body.zoneproblems.length; i++) {
            valueStr += "(?, ?)";
            if (i != req.body.zoneproblems.length - 1) {
                valueStr += ", ";
            }
        }
        var sql = "INSERT INTO ascents (cid, pid) VALUES " + valueStr;
        var inserts = [];
        for (var i = 0; i < req.body.zoneproblems.length; i++) {
            inserts.push(req.params.id);
            inserts.push(req.body.zoneproblems[i]);
        }
        sql = mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            } else {
                complete();
            }
        });
    }

    function incrementProblem(res, mysql, cid, pid, complete) {
        var sql = "UPDATE problems INNER JOIN ascents ON problems.id = ascents.pid " +
                    "INNER JOIN climbers ON climbers.id = ascents.cid " +
                    "SET problems.ascents = problems.ascents + 1" +
                    ", climbers.ascents = climbers.ascents + 1 " +
                    "WHERE climbers.id = ? AND problems.id = ?";
        var inserts = [cid, pid];
        sql = mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.status(400);
                res.end();
            } else {
                complete();
            }
        });
    }

    function decrementProblem(res, mysql, cid, pid, complete) {
        var sql = "UPDATE problems INNER JOIN ascents ON problems.id = ascents.pid " +
                    "INNER JOIN climbers ON climbers.id = ascents.cid " +
                    "SET problems.ascents = problems.ascents - 1" +
                    ", climbers.ascents = climbers.ascents - 1 " +
                    "WHERE climbers.id = ? AND problems.id = ?";
        var inserts = [cid, pid];
        console.log("here");
        sql = mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.status(400);
                res.end();
            } else {
                complete();
                deleteProblem(res, mysql, cid, pid, complete);
            }
        });
    }

    function deleteProblem(res, mysql, cid, pid, complete) {
        var sql = "DELETE FROM ascents WHERE cid = ? AND pid = ?";
        var inserts = [cid, pid];
        sql = mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.status(400);
                res.end();
            } else {
                complete();
            }
        });
    }

    router.delete('/:cid/:pid', function(req, res) {
        var mysql = req.app.get('mysql');
        var callbackCount = 0;

        decrementProblem(res, mysql, req.params.cid, req.params.pid, complete);
        function complete() {
            callbackCount++;
            if (callbackCount >= 2) {
                res.status(202)
                res.end();
            }
        }
    });


    return router;
}();

//TODO FIX update Ascents for problems and climbers when new Ascent is added/deleted