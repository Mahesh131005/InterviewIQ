import axios from 'axios';

async function test() {
    try {
        const pool = (await import('./src/db.js')).default;
        const res = await pool.query("SELECT interview_id as id, (SELECT user_id FROM interviews i WHERE i.id = interview_id) as user_id FROM submissions LIMIT 1");
        if (res.rowCount === 0) { console.log('no subs'); pool.end(); return; }

        const iid = res.rows[0].id;
        const uid = res.rows[0].user_id;

        // We can't hit the API without an auth token, so let's import the controller's logic directly
        const { completeInterview } = await import('./src/controllers/interviewController.js');

        // Mock req and res
        const req = {
            params: { interviewId: iid },
            userId: uid
        };

        const mockedRes = {
            json: (data) => console.log('SUCCESS JSON:', data),
            status: (code) => {
                console.log('STATUS:', code);
                return { json: (data) => console.log('JSON:', data) };
            }
        };
        console.log('Completing interview', iid);
        await completeInterview(req, mockedRes);

        pool.end();
    } catch (e) {
        console.error('SCRIPT ERR:', e);
    }
}
test();
