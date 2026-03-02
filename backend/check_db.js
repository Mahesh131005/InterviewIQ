import pool from './src/db.js';

async function check() {
    const result = await pool.query("SELECT title, reference_code FROM questions");
    for (const row of result.rows) {
        console.log("-------");
        console.log("TITLE:", row.title);
        console.log("CODE:", row.reference_code.substring(0, 100).replace(/\\n/g, ' '));
    }
    pool.end();
}
check();
