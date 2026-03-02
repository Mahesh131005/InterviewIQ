import 'dotenv/config';
import pool from '../src/db.js';

async function listQuestions() {
    try {
        const res = await pool.query('SELECT title, (reference_code IS NOT NULL) as has_ref FROM questions');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
listQuestions();
