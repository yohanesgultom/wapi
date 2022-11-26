const sqlite3 = require('sqlite3').verbose();

const initDb = (dbPath) => {
    // init db and tables
    const db = new sqlite3.Database(dbPath);
    db.run(`
    CREATE TABLE IF NOT EXISTS webhooks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_url TEXT NOT NULL,
        auth_header TEXT,
        event_code TEXT NOT NULL,
        created_at TEXT NOT NULL
    )`);

    // webhooks methods
    const webhooks = {
        create: (webhook) => {
            return new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO webhooks (post_url, auth_header, event_code, created_at) VALUES (?, ?, ?, ?)`,
                    [ webhook.postUrl, webhook.authHeader, webhook.eventCode, (new Date()).toISOString() ], 
                    function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(this);
                        }
                    });
            });
        },

        all: () => {
            return new Promise((resolve, reject) => {
                db.all(`SELECT * FROM webhooks`, function (err, rows) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
        },

        delete: (id)  => {
            return new Promise((resolve, reject) => {
                db.run(`DELETE FROM webhooks WHERE id = ?`, [id], function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(this);
                    }                        
                });
            });
        },
    };

    return {
        _db: db,
        webhooks: webhooks,
    };
};

module.exports = {
    initDb
};
