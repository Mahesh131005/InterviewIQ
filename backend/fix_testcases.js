import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  user: 'postgres',
  password: 'postgres123',
  host: 'localhost',
  port: 5432,
  database: 'coding_interview'
});

async function fix() {
  try {
    await client.connect();

    // Fix the test case that has 's = "()[]{}' format
    const res = await client.query(`
      UPDATE testcases 
      SET input = REGEXP_REPLACE(input, '^s = "?(.*?)"?$', '\\1')
      WHERE question_id IN (SELECT id FROM questions WHERE title = 'Valid Parentheses')
      AND input LIKE 's = %'
    `);
    console.log('Fixed s= prefix testcases:', res.rowCount);

    // Also remove any duplicate testcases
    const dedup = await client.query(`
      DELETE FROM testcases a USING testcases b
      WHERE a.id > b.id
      AND a.question_id = b.question_id
      AND a.input = b.input
      AND a.expected_output = b.expected_output
    `);
    console.log('Removed duplicates:', dedup.rowCount);

    // Show final state
    const verify = await client.query(`
      SELECT t.input, t.expected_output, t.is_hidden
      FROM testcases t 
      JOIN questions q ON q.id = t.question_id 
      WHERE q.title = 'Valid Parentheses'
      ORDER BY t.input
    `);
    console.log('\nValid Parentheses test cases:');
    verify.rows.forEach(r => {
      console.log(`  input="${r.input}" → expected="${r.expected_output}" (hidden: ${r.is_hidden})`);
    });

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

fix();
