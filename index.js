var util = require('util');
var kv = require('fib-kv');

function send_error(r, code, msg) {
    r.statusCode = 401;
    r.json({
        "error": "Unauthorized",
        "message": msg,
        "status": code
    });
    r.end();
}

function api_key(conn, opts) {
    opts = opts || {};

    this.store = new kv(conn, opts);
    this.filter = (r) => {
        var id = r.firstHeader('X-' + opts.app_name + '-Id');
        var key = r.firstHeader('X-' + opts.app_name + '-Key');

        if (id === null || key === null)
            return send_error(r.response, 401, "Missing api key");

        if (this.store.get(id) !== key)
            return send_error(r.response, 401, "Api auth failed.");
    };
}

module.exports = api_key;