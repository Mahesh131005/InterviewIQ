import pool from './src/db.js';

async function check() {
    const res = await pool.query("SELECT reference_code FROM questions WHERE title='Reverse String'");
    console.log("=== DB CODE ===");
    console.log(res.rows[0].reference_code);
    pool.end();
}

check();
