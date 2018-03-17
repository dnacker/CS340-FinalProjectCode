module.exports = function() {
    var express = require('express');
    var router = express.Router();

    function getProblems(res, mysql, context, complete) {
        var sql = "SELECT problems.id, problems.name, difficulty, COUNT(ascents.cid) AS pAscents, zones.name AS zone FROM problems " + 
                "INNER JOIN zones ON problems.zoneid = zones.id " +
                "LEFT JOIN ascents ON problems.id = ascents.pid " +
                "GROUP BY problems.id " + 
                "ORDER BY zone, difficulty";
        mysql.pool.query(sql, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            }
            context.problems = results;
            complete();
        });
    }

    function getProblemsFilterByStyle(sid, res, mysql, context, complete) {
        var sql = "SELECT problems.id, problems.name, difficulty, COUNT(ascents.cid) AS pAscents, zones.name AS zone, problem_styles.sid FROM problems " + 
                "INNER JOIN zones ON problems.zoneid = zones.id " +
                "LEFT JOIN problem_styles ON problems.id = problem_styles.pid " + 
                "LEFT JOIN ascents ON problems.id = ascents.pid " +
                "WHERE problem_styles.sid = ? " +
                "GROUP BY problems.id " + 
                "ORDER BY zone, difficulty";
        var inserts = [sid];
        mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            }
            context.problems = results;
            complete();
        });
    }
 
    function getProblemsStyles(res, mysql, context, complete) {
        var sql = "SELECT problems.id, styles.name FROM problems " + 
                "INNER JOIN problem_styles ON problems.id = problem_styles.pid " + 
                "INNER JOIN styles ON problem_styles.sid = styles.id";
        mysql.pool.query(sql, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            }
            context.problemstyles = results;
            complete();
        });
    }


    function getProblem(res, mysql, context, pid, complete) {
        var sql = "SELECT id, name, difficulty, zoneid FROM problems WHERE id = ?";
        var inserts = [pid];
        mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            }
            context.problem = results[0];
            complete();
        });
    }

    function getProblemStyles(res, mysql, context, pid, complete) {
        var sql = "SELECT sid FROM problem_styles WHERE pid = ?";
        var inserts = [pid];
        mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            }
            context.problemstyles = results;
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

    function getStyles(res, mysql, context, complete) {
        mysql.pool.query("SELECT id, name FROM styles", function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            }
            context.styles = results;
            complete();
        });
    }

    function associateStylesToProblems(context) {
        for (var i = 0; i < context.problems.length; i++) {
            var problem = context.problems[i];
            problem.styles = [];
            for (var j = 0; j < context.problemstyles.length; j++) {
                var problemStyle = context.problemstyles[j];
                if (problemStyle.id == problem.id) {
                    problem.styles.push(problemStyle.name);
                }
            }
        }
    }

    function addProblemStyles(styleArr, pid, res, mysql, complete) {
        var sql = "INSERT INTO problem_styles (pid, sid) VALUES ?";
        var inserts = [];
        for (var i = 0; i < styleArr.length; i++) {
            var insert = [];
            insert.push(pid);
            insert.push(styleArr[i]);
            inserts.push(insert);
        }
        sql = mysql.pool.query(sql, [inserts], function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            } else {
                complete();
            }
        });
    }

    function buildStylesContext(context) {
        var styles = context.styles;
        var problemstyles = context.problemstyles;
        if (!Array.isArray(problemstyles)) {
            problemstyles = [problemstyles];
        }
        for (var i = 0; i < styles.length; i++) {
            var found = false;
            for (var j = 0; j < problemstyles.length; j++) {
                if (problemstyles[j].sid == styles[i].id) {
                    found = true;
                }
            }
            styles[i].checked = found;
        }
    }

    function buildZonesContext(context) {
        var zones = context.zones;
        if (!Array.isArray(zones)) {
            zones = [zones];
        }
        var problem = context.problem;
        for (var i = 0; i < zones.length; i++) {
            var zone = zones[i];
            zone.selected = false;
            if (problem.zoneid == zone.id) {
                zone.selected = true;
            }
        }
    }

    router.get('/', function(req, res) {
        var callbackCount = 0;
        var context = {};
        context.jsscripts = ["deleteproblem.js"];
        var mysql = req.app.get('mysql');
        getProblems(res, mysql, context, complete);
        getZones(res, mysql, context, complete);
        getProblemsStyles(res, mysql, context, complete);
        getStyles(res, mysql, context, complete);
        function complete() {
            callbackCount++;
            if (callbackCount >= 4) {
                associateStylesToProblems(context);
                res.render('problems', context);
            }
        }
    });

    router.post('/', function(req, res) {
        var callbackCount = 0;
        var mysql = req.app.get('mysql');
        var sql = "INSERT INTO problems (name, difficulty, zoneid) VALUES (?, ?, ?)";
        var inserts = [req.body.name, req.body.difficulty, req.body.zone];
        sql = mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            } else {
                addProblemStyles(req.body.styles, results.insertId, res, mysql, complete);
                complete();
            }
        });
        function complete() {
            callbackCount++;
            if (callbackCount >= 2) {
                res.redirect('/problems');
            }
        }
    });

    

    router.get('/:pid', function(req, res) {
        callbackCount = 0;
        var context = {};
        context.jsscripts = ["updateproblem.js"];
        var mysql = req.app.get('mysql');
        var pid = req.params.pid;
        getProblem(res, mysql, context, pid, complete);
        getZones(res, mysql, context, complete);
        getStyles(res, mysql, context, complete);
        getProblemStyles(res, mysql, context, pid, complete);
        function complete() {
            callbackCount++;
            if (callbackCount >= 4) {
                buildStylesContext(context);
                buildZonesContext(context);
                res.render('update-problem', context);
            }
        }
    });

    function updateProblemStyles(styleArr, pid, res, mysql, complete) {
        var sql = "DELETE FROM problem_styles WHERE pid = ?";
        var inserts = [pid];
        sql = mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            } else {
                addProblemStyles(styleArr, pid, res, mysql, complete);
                complete();
            }
        });
    }

    router.put('/:pid', function(req, res) {
        var callbackCount = 0;
        var mysql = req.app.get('mysql');
        var sql = "UPDATE problems SET name=?, difficulty=?, zoneid=? WHERE id=?";
        var inserts = [req.body.name, req.body.difficulty, req.body.zoneid, req.params.pid];
        if (!Array.isArray(req.body.styles)) {
            req.body.styles = [req.body.styles];
        }
        updateProblemStyles(req.body.styles, req.params.pid, res, mysql, complete);
        sql = mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                req.write(JSON.stringify(error));
                res.end();
            } else {
                complete();
            }
        });
        function complete() {
            callbackCount++;
            if (callbackCount >= 3) {
                res.status(200);
                res.end();
            }
        }
    });

    router.delete('/:pid', function(req, res) {
        var mysql = req.app.get('mysql');
        var sql = "DELETE FROM problems WHERE id = ?";
        var inserts = [req.params.pid];
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

    router.get('/styles/:sid', function(req, res) {
        var mysql = req.app.get('mysql');
        var context = {};
        context.jsscripts = ["deleteproblem.js"];
        var callbackCount = 0;
        getZones(res, mysql, context, complete);
        getProblemsFilterByStyle(req.params.sid, res, mysql, context, complete);
        getProblemsStyles(res, mysql, context, complete);
        getStyles(res, mysql, context, complete);
        function complete() {
            callbackCount++;
            if (callbackCount >= 4) {
                associateStylesToProblems(context);
                res.render('problems', context);
            }
        }
    });

    return router;
}();