import fs from 'fs';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Client({
  user: 'postgres',
  password: 'postgres123',
  host: 'localhost',
  port: 5432,
  database: 'coding_interview'
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database coding_interview...');

    const schemaPath = path.join(__dirname, 'db', '005_practice_problems.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('Executing 005_practice_problems.sql...');
    await client.query(schemaSql);
    console.log('✅ 005_practice_problems.sql executed successfully.');

    const samplePath = path.join(__dirname, 'db', 'sample_practice.sql');
    const sampleSql = fs.readFileSync(samplePath, 'utf8');
    console.log('Executing sample_practice.sql...');
    await client.query(sampleSql);
    console.log('✅ sample_practice.sql executed successfully.');

  } catch (e) {
    console.error('❌ Error executing SQL:', e.message);
  } finally {
    await client.end();
  }
}

run();
