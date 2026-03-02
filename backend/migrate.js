import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pkg;

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'coding_interview',
});

async function main() {
    const client = await pool.connect();
    try {
        console.log('Connected to DB. Adding columns...');

        // Add columns if they don't exist
        await client.query(`
      ALTER TABLE questions 
      ADD COLUMN IF NOT EXISTS input_format TEXT,
      ADD COLUMN IF NOT EXISTS output_format TEXT,
      ADD COLUMN IF NOT EXISTS reference_code TEXT,
      ADD COLUMN IF NOT EXISTS reference_language VARCHAR(20) DEFAULT 'python';
    `);
        console.log('Columns added successfully.');

        // Clear existing questions to repopulate cleanly with formats
        console.log('Clearing existing questions...');
        await client.query('DELETE FROM submissions;');
        await client.query('DELETE FROM testcases;');
        await client.query('DELETE FROM questions;');

        // Read sample-data.sql
        console.log('Populating new sample data...');
        const sqlPath = path.join(__dirname, 'db', 'sample-data.sql');
        const sqlScript = fs.readFileSync(sqlPath, 'utf8');

        // Execute sample data script
        await client.query(sqlScript);
        console.log('Sample data populated successfully!');

        const references = [
            {
                title: 'Two Sum',
                code: `import sys
def solve():
    input_data = sys.stdin.read().split()
    if not input_data: return
    # This expects custom input format: N then N space separated ints then target
    # e.g 4 2 7 11 15 9
    try:
      n = int(input_data[0])
      nums = [int(x) for x in input_data[1:n+1]]
      target = int(input_data[n+1])
      seen = {}
      for i, num in enumerate(nums):
          if target - num in seen:
              print(f"{seen[target-num]} {i}")
              return
          seen[num] = i
    except:
      pass
solve()`
            },
            {
                title: 'Reverse String',
                code: `import sys
def solve():
    try:
      import ast
      s = ast.literal_eval(sys.stdin.read().strip())
      s.reverse()
      print(str(s).replace(" ", ""))
    except:
      s = sys.stdin.read().split()
      if not s: return
      print(" ".join(reversed(s)))
solve()`
            },
            {
                title: 'Longest Substring Without Repeating Characters',
                code: `import sys
def solve():
    s = sys.stdin.read().strip()
    if s and (s.startswith('"') or s.startswith("'")):
      s = s[1:-1]
    if not s: return
    char_map = {}
    left = 0
    max_len = 0
    for right in range(len(s)):
        if s[right] in char_map:
            left = max(left, char_map[s[right]] + 1)
        char_map[s[right]] = right
        max_len = max(max_len, right - left + 1)
    print(max_len)
solve()`
            },
            {
                title: 'Valid Parentheses',
                code: `import sys
def solve():
    s = sys.stdin.read().strip()
    if s and (s.startswith('"') or s.startswith("'")):
      s = s[1:-1]
    if not s: return
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top_element = stack.pop() if stack else '#'
            if mapping[char] != top_element:
                print("false")
                return
        else:
            stack.append(char)
    print("true" if not stack else "false")
solve()`
            },
            {
                title: 'Median of Two Sorted Arrays',
                code: `import sys
import json
def solve():
    raw_str = sys.stdin.read().strip()
    if not raw_str: return
    # Try parsing json arrays if possible e.g "[1,3], [2]"
    try:
      s1, s2 = raw_str.split('],')
      arr1 = json.loads(s1 + ']')
      arr2 = json.loads(s2.strip())
      nums = sorted(arr1 + arr2)
      l = len(nums)
      if l % 2 == 0:
          print(f"{(nums[l//2 - 1] + nums[l//2]) / 2.0}")
      else:
          print(f"{float(nums[l//2])}")
    except:
      pass
solve()`
            },
            {
                title: 'Trapping Rain Water',
                code: `import sys
import json
def solve():
    raw_str = sys.stdin.read().strip()
    if not raw_str: return
    try:
      height = json.loads(raw_str)
      if not height: return print("0")
      left, right = 0, len(height) - 1
      left_max, right_max = height[left], height[right]
      water = 0
      while left < right:
          if left_max < right_max:
              left += 1
              left_max = max(left_max, height[left])
              water += left_max - height[left]
          else:
              right -= 1
              right_max = max(right_max, height[right])
              water += right_max - height[right]
      print(water)
    except:
      pass
solve()`
            },
            {
                title: 'Merge k Sorted Lists',
                code: `import sys
import json
def solve():
    raw_str = sys.stdin.read().strip()
    if not raw_str: return
    try:
        lists = json.loads(raw_str)
        merged = []
        for l in lists:
            merged.extend(l)
        print(json.dumps(sorted(merged)).replace(" ", ""))
    except:
        pass
solve()`
            }
        ];

        console.log('Inserting reference code...');
        for (const ref of references) {
            await client.query('UPDATE questions SET reference_code = $1, reference_language = $2 WHERE title = $3', [ref.code, 'python', ref.title]);
        }
        console.log('Reference codes mapped.');

    } catch (e) {
        console.error('Error during migration:', e);
    } finally {
        client.release();
        pool.end();
    }
}

main();
