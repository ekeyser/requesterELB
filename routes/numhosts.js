var express = require('express');
var router = express.Router();

router.get(/^\/([^\\/]+?)(?:\/(?=$))?$/i, function (req, res, next) {
    var numHosts = req.params[0];
    console.log(numHosts);

    var Memcached = require('memcached');
    var Server = "127.0.0.1:11211";
    var options = {};
    var memcached = new Memcached(Server, options);
    memcached.set("h", numHosts, 0, function () {
        console.log("done set rate (per sec)");
    });

    res.render('index', {title: numHosts});
});

module.exports = router;
