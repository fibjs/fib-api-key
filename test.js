var test = require('test');
test.setup();

var api_key = require('./');
var db = require('db');

var http = require('http');
var mq = require('mq');

describe("api-key", () => {
    var conn;
    var ak;
    var called;

    before(() => {
        conn = db.openSQLite("test.db");
    });

    after(() => {
        conn.close();

        try {
            fs.unlink("test.db");
        } catch (e) {};
    })

    it('setup', () => {
        ak = new api_key(conn, {
            table_name: 'test_api_key',
            app_name: 'test'
        });

        ak.store.setup();
    });

    it('server', function() {
        var svr = new http.Server(8888, new mq.Chain([
            ak.filter,
            function(r) {
                called = true;
            }
        ]));

        svr.asyncRun();
    });

    it('no key', function() {
        called = false;
        var r = http.get('http://127.0.0.1:8888/test');
        assert.equal(r.status, 401);
        assert.equal(r.firstHeader('Content-Type'), 'application/json');
        assert.isFalse(called);
    });

    it('auth passed', function() {
        ak.store.set('test-id', 'test-key');
        called = false;
        var r = http.get('http://127.0.0.1:8888/test', {
            'X-test-Id': 'test-id',
            'X-test-Key': 'test-key',
        });
        assert.equal(r.status, 200);
        assert.isTrue(called);
    });

    it('auth not passed', function() {
        called = false;
        var r = http.get('http://127.0.0.1:8888/test', {
            'X-test-Id': 'test-id',
            'X-test-Key': 'test-key1',
        });
        assert.equal(r.status, 401);
        assert.equal(r.firstHeader('Content-Type'), 'application/json');
        assert.isFalse(called);
    });

    it('json config', function() {
        ak = new api_key({
            m_id: 'm_key'
        }, {
            app_name: 'test'
        });

        var svr = new http.Server(8889, new mq.Chain([
            ak.filter,
            function(r) {
                called = true;
            }
        ]));

        svr.asyncRun();

        called = false;
        var r = http.get('http://127.0.0.1:8889/test', {
            'X-test-Id': 'm_id',
            'X-test-Key': 'm_key',
        });
        assert.equal(r.status, 200);
        assert.isTrue(called);
    });
});

test.run(console.DEBUG);
