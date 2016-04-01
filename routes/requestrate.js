var express = require('express');
var router = express.Router();

router.get(/^\/([^\\/]+?)(?:\/(?=$))?$/i, function (req, res, next) {
    var globalReqRate = req.params[0];
    console.log(globalReqRate);

    var Memcached = require('memcached');
    var Server = "127.0.0.1:11211";
    var options = {};
    var memcached = new Memcached(Server, options);
    memcached.set("r", globalReqRate, 0, function () {
        console.log("done set rate (per sec)");
    });

    res.render('index', {title: globalReqRate});
});

module.exports = router;
