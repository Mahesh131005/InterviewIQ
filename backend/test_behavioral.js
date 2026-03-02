import axios from 'axios';
import { Submission } from './src/models/index.js';

async function test() {
    try {
        // 1. First let's get a valid submission from the DB so we don't 404
        const pool = (await import('./src/db.js')).default;
        const res = await pool.query('SELECT id FROM submissions LIMIT 1');
        if (res.rowCount === 0) { console.log('no subs'); pool.end(); return; }

        const sid = res.rows[0].id;

        // We can't hit the API without an auth token, so let's import the controller's logic directly
        const { submitBehavioral } = await import('./src/controllers/submissionController.js');

        // Mock req and res
        const req = {
            body: { submissionId: sid, response: "Here is my behavioral answer" },
            userId: "00000000-0000-0000-0000-000000000000" // doesn't matter for this controller
        };

        const mockedRes = {
            json: (data) => console.log('SUCCESS JSON:', data),
            status: (code) => {
                console.log('STATUS:', code);
                return { json: (data) => console.log('JSON:', data) };
            }
        };

        await submitBehavioral(req, mockedRes);

        pool.end();
    } catch (e) {
        console.error('SCRIPT ERR:', e);
    }
}
test();
