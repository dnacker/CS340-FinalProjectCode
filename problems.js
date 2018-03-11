module.exports = function() {
    var express = require('express');
    var router = express.Router();

    function getProblems(res, mysql, context, complete) {
        mysql.pool.query("SELECT problems.id, problems.name, difficulty, ascents, zones.name AS zone FROM problems INNER JOIN zones ON problems.zoneid = zones.id", function(error, results, fields) {
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


    function getProblem(res, mysql, context, id, complete) {
        var sql = "SELECT id, name, difficulty, ascents, zoneid FROM problems WHERE id = ?";
        var inserts = [id];
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
        var sql1 = "INSERT INTO problems (name, difficulty, ascents, zoneid) VALUES (?, ?, ?, ?)";
        var inserts1 = [req.body.name, req.body.difficulty, 0, req.body.zone];
        sql1 = mysql.pool.query(sql1, inserts1, function(error, results, fields) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            } else {
                var sql2 = "INSERT INTO problem_styles (pid, sid) VALUES ";
                var value = "((SELECT MAX(problems.id) FROM problems)";
                var values = "";
                for (var i = 0; i < req.body.styles.length; i++) {
                    values += value + ", " + req.body.styles[i] + ")";
                    if (i != req.body.styles.length - 1) {
                        values += ", ";
                    }
                }
                sql2 += values;
                sql2 = mysql.pool.query(sql2, function(error, results, fields) {
                    if (error) {
                        res.write(JSON.stringify(error));
                        res.end();
                    } else {
                        complete();
                    }
                });
            }
            complete();
        });

        function complete() {
            callbackCount++;
            if (callbackCount>= 2) {
                res.redirect('/problems');
            }
        }

    });

    router.get('/:id', function(req, res) {
        callbackCount = 0;
        var context = {};
        context.jsscripts = ["updateproblem.js"];
        var mysql = req.app.get('mysql');
        getProblem(res, mysql, context, req.params.id, complete);
        getZones(res, mysql, context, complete);
        getStyles(res, mysql, context, complete);
        getProblemStyles(res, mysql, context, complete);
        //TODO: update so that checkboxes are checked
        

        function complete() {
            callbackCount++;
            if (callbackCount >= 3) {
                res.render('update-problem', context);
            }
        }
    });

    router.put('/:id', function(req, res) {
        //TODO: update function so that pid, sid pairs are deleted or added as appropriate
        var mysql = req.app.get('mysql');
        var sql = "UPDATE problems SET name=?, difficulty=?, zoneid=? WHERE id=?";
        var inserts = [req.body.name, req.body.difficulty, req.body.zoneid, req.params.id];
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

    router.delete('/:id', function(req, res) {
        var mysql = req.app.get('mysql');
        var sql = "DELETE FROM problems WHERE id = ?";
        var inserts = [req.params.id];
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