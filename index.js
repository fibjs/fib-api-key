var util = require('util');
var kv = require('fib-kv');

function send_error(r, code, msg) {
    r.status = 401;
    r.setHeader('Content-Type', 'application/json');
    r.write(JSON.stringify({
        "error": "Unauthorized",
        "message": msg,
        "status": code
    }));
    r.end();
}

function api_key(conn, opts) {
    opts = opts || {};
    var _back = new kv(conn, opts);

    util.extend(this, {
        setup: function() {
            _back.setup();
        },
        get: function(k) {
            return _back.get(k);
        },
        set: function(k, v) {
            _back.set(k, v);
        },
        has: function(k) {
            return _back.has(k);
        },
        remove: function(k) {
            _back.remove(k);
        },
        clear_cache: function() {
            _back.clear_cache();
        },
        filter: function(r) {
            var id = r.firstHeader('X-' + opts.app_name + '-Id');
            var key = r.firstHeader('X-' + opts.app_name + '-Key');

            if (id === null || key === null)
                return send_error(r.response, 401, "Missing api key");

            if (_back.get(id) !== key)
                return send_error(r.response, 401, "Api auth failed.");
        }
    });
}

module.exports = api_key;
