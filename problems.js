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
 
    function getProblemStyles(res, mysql, context, complete) {
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

    function associateStylesToProblem(context) {
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

    function addProblemStyles(req, res, mysql, complete) {
        var sql = "INSERT INTO problem_styles (pid, sid) VALUES ?";
        var inserts = [];
        for (var i = 0; i < req.body.styles.length; i++) {
            var insert = [];
            insert.push("SELECT LAST_INSERT_ID()");
            insert.push(req.body.styles[i]);
            inserts.push(insert);
        }
        sql = mysql.pool.query(sql, [inserts], function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            }
            complete();
        });
    }

    router.get('/', function(req, res) {
        var callbackCount = 0;
        var context = {};
        context.jsscripts = ["deleteproblem.js"];
        var mysql = req.app.get('mysql');
        getProblems(res, mysql, context, complete);
        getZones(res, mysql, context, complete);
        getProblemStyles(res, mysql, context, complete);
        getStyles(res, mysql, context, complete);
        function complete() {
            callbackCount++;
            if (callbackCount >= 4) {
                associateStylesToProblem(context);
                res.render('problems', context);
            }
        }
    });

    router.post('/', function(req, res) {
        callbackCount = 0;
        var mysql = req.app.get('mysql');
        var sql = "INSERT INTO problems (name, difficulty, zoneid) VALUES (?, ?, ?)";
        var inserts = [req.body.name, req.body.difficulty, req.body.zone];
        sql = mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            }
            // addProblemStyles(req, res, mysql, complete);
            complete();
        });
        function complete() {
            callbackCount++;
            if (callbackCount>= 1) {
                res.redirect('/problems');
            }
        }

    });

    router.get('/:pid', function(req, res) {
        callbackCount = 0;
        var context = {};
        context.jsscripts = ["updateproblem.js"];
        var mysql = req.app.get('mysql');
        getProblem(res, mysql, context, req.params.pid, complete);
        getZones(res, mysql, context, complete);
        getStyles(res, mysql, context, complete);
        getProblemStyles(res, mysql, context, complete);
        //TODO: update so that checkboxes are checked
        

        function complete() {
            callbackCount++;
            if (callbackCount >= 4) {
                res.render('update-problem', context);
            }
        }
    });

    router.put('/:pid', function(req, res) {
        var mysql = req.app.get('mysql');
        var sql = "UPDATE problems SET name=?, difficulty=?, zoneid=? WHERE id=?";
        var inserts = [req.body.name, req.body.difficulty, req.body.zoneid, req.params.pid];
        //TODO: update from checkboxes so styles are updated

        sql = mysql.pool.query(sql, inserts, function(error, results, fields) {
            if (error) {
                req.write(JSON.stringify(error));
                res.end();
            } else {
                res.status(200);
                res.end();
            }
        });
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


    return router;
}();