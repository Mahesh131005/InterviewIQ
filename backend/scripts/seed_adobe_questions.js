import 'dotenv/config';
import pool from '../src/db.js';

const seedAdobeQuestions = async () => {
    try {
        console.log('Seeding Adobe questions...');

        const questions = [
            {
                title: 'Best Time to Buy and Sell Stock',
                description: 'You are given an array prices where prices[i] is the price of a given stock on the ith day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.',
                difficulty: 'Easy',
                expected_time: 10,
                expected_complexity: 'O(N)',
                sample_input: '[7,1,5,3,6,4]',
                sample_output: '5',
                constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^4'],
                input_format: 'A single array representing the prices.',
                output_format: 'An integer representing maximum profit.',
                tags: ['Array', 'Dynamic Programming'],
                reference_language: 'python',
                reference_code: `
def maxProfit(prices):
    if not prices:
        return 0
    min_price = float('inf')
    max_profit = 0
    for price in prices:
        if price < min_price:
            min_price = price
        elif price - min_price > max_profit:
            max_profit = price - min_price
    return max_profit

import sys
import json
import ast

s = sys.stdin.read().strip()
while len(s) >= 2 and ((s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'"))):
    s = s[1:-1]
try:
    prices = json.loads(s)
except:
    prices = ast.literal_eval(s)
print(maxProfit(prices))
`,
                testcases: [
                    { input: '[7,1,5,3,6,4]', expected_output: '5', is_hidden: false },
                    { input: '[7,6,4,3,1]', expected_output: '0', is_hidden: false },
                    { input: '[1,2]', expected_output: '1', is_hidden: true },
                    { input: '[2,4,1]', expected_output: '2', is_hidden: true },
                    { input: '[3,2,6,5,0,3]', expected_output: '4', is_hidden: true }
                ]
            },
            {
                title: '3Sum',
                description: 'Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.\n\nNotice that the solution set must not contain duplicate triplets.',
                difficulty: 'Medium',
                expected_time: 25,
                expected_complexity: 'O(N^2)',
                sample_input: '[-1,0,1,2,-1,-4]',
                sample_output: '[[-1,-1,2],[-1,0,1]]',
                constraints: ['3 <= nums.length <= 3000', '-10^5 <= nums[i] <= 10^5'],
                input_format: 'A single array of integers.',
                output_format: 'A list of lists containing the unique triplets.',
                tags: ['Array', 'Two Pointers', 'Sorting'],
                reference_language: 'python',
                reference_code: `
def threeSum(nums):
    res = []
    nums.sort()
    for i in range(len(nums)):
        if i > 0 and nums[i] == nums[i-1]:
            continue
        l, r = i + 1, len(nums) - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s < 0:
                l += 1
            elif s > 0:
                r -= 1
            else:
                res.append([nums[i], nums[l], nums[r]])
                while l < r and nums[l] == nums[l+1]:
                    l += 1
                while l < r and nums[r] == nums[r-1]:
                    r -= 1
                l += 1
                r -= 1
    return res

import sys
import json
import ast

s = sys.stdin.read().strip()
while len(s) >= 2 and ((s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'"))):
    s = s[1:-1]
try:
    nums = json.loads(s)
except:
    nums = ast.literal_eval(s)
res = threeSum(nums)
print(json.dumps(res).replace(" ", ""))
`,
                testcases: [
                    { input: '[-1,0,1,2,-1,-4]', expected_output: '[[-1,-1,2],[-1,0,1]]', is_hidden: false },
                    { input: '[0,1,1]', expected_output: '[]', is_hidden: false },
                    { input: '[0,0,0]', expected_output: '[[0,0,0]]', is_hidden: false },
                    { input: '[0,0,0,0]', expected_output: '[[0,0,0]]', is_hidden: true },
                    { input: '[-2,0,1,1,2]', expected_output: '[[-2,0,2],[-2,1,1]]', is_hidden: true }
                ]
            },
            {
                title: 'Integer to Roman',
                description: 'Seven different symbols represent Roman numerals with the following values:\nI=1, V=5, X=10, L=50, C=100, D=500, M=1000\n\nGiven an integer, convert it to a roman numeral.',
                difficulty: 'Medium',
                expected_time: 15,
                expected_complexity: 'O(1)',
                sample_input: '3749',
                sample_output: '"MMMDCCXLIX"',
                constraints: ['1 <= num <= 3999'],
                input_format: 'An integer.',
                output_format: 'A string representing the Roman numeral.',
                tags: ['Hash Table', 'Math', 'String'],
                reference_language: 'python',
                reference_code: `
def intToRoman(num: int) -> str:
    val = [
        1000, 900, 500, 400,
        100, 90, 50, 40,
        10, 9, 5, 4,
        1
        ]
    syb = [
        "M", "CM", "D", "CD",
        "C", "XC", "L", "XL",
        "X", "IX", "V", "IV",
        "I"
        ]
    roman_num = ''
    i = 0
    while  num > 0:
        for _ in range(num // val[i]):
            roman_num += syb[i]
            num -= val[i]
        i += 1
    return roman_num

import sys
s = sys.stdin.read().strip()
while len(s) >= 2 and ((s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'"))):
    s = s[1:-1]
n = int(s)
print(f'"{intToRoman(n)}"')
`,
                testcases: [
                    { input: '3749', expected_output: '"MMMDCCXLIX"', is_hidden: false },
                    { input: '58', expected_output: '"LVIII"', is_hidden: false },
                    { input: '1994', expected_output: '"MCMXCIV"', is_hidden: false },
                    { input: '9', expected_output: '"IX"', is_hidden: true },
                    { input: '3999', expected_output: '"MMMCMXCIX"', is_hidden: true }
                ]
            },
            {
                title: 'Jump Game',
                description: 'You are given an integer array nums. You are initially positioned at the array\'s first index, and each element in the array represents your maximum jump length at that position.\n\nReturn true if you can reach the last index, or false otherwise.',
                difficulty: 'Medium',
                expected_time: 20,
                expected_complexity: 'O(N)',
                sample_input: '[2,3,1,1,4]',
                sample_output: 'true',
                constraints: ['1 <= nums.length <= 10^4', '0 <= nums[i] <= 10^5'],
                input_format: 'An integer array.',
                output_format: 'Boolean indicating success.',
                tags: ['Array', 'Dynamic Programming', 'Greedy'],
                reference_language: 'python',
                reference_code: `
def canJump(nums):
    m = 0
    for i, n in enumerate(nums):
        if i > m:
            return False
        m = max(m, i + n)
    return True

import sys
import json
import ast

s = sys.stdin.read().strip()
while len(s) >= 2 and ((s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'"))):
    s = s[1:-1]
try:
    nums = json.loads(s)
except:
    nums = ast.literal_eval(s)
res = canJump(nums)
if res:
    print("true")
else:
    print("false")
`,
                testcases: [
                    { input: '[2,3,1,1,4]', expected_output: 'true', is_hidden: false },
                    { input: '[3,2,1,0,4]', expected_output: 'false', is_hidden: false },
                    { input: '[0]', expected_output: 'true', is_hidden: true },
                    { input: '[1,2]', expected_output: 'true', is_hidden: true }
                ]
            }
        ];

        let adobeId;
        const compRes = await pool.query("SELECT id FROM companies WHERE name='Adobe'");
        if (compRes.rows.length > 0) {
            adobeId = compRes.rows[0].id;
        } else {
            console.log('Creating Adobe company...');
            const newComp = await pool.query(
                "INSERT INTO companies (name, description, total_questions) VALUES ('Adobe', 'Adobe Interview Questions', 4) RETURNING id"
            );
            adobeId = newComp.rows[0].id;
        }

        for (const q of questions) {
            // Check if exists
            const existing = await pool.query('SELECT id FROM questions WHERE title = $1', [q.title]);
            let qId;

            if (existing.rows.length > 0) {
                console.log(`Question '${q.title}' already exists. Updating reference code...`);
                qId = existing.rows[0].id;
                await pool.query(
                    'UPDATE questions SET reference_code=$1, reference_language=$2, company_id=$3 WHERE id=$4',
                    [q.reference_code, q.reference_language, adobeId, qId]
                );
            } else {
                console.log(`Inserting new question '${q.title}'...`);
                const insertRes = await pool.query(
                    `INSERT INTO questions (
                        title, description, difficulty, expected_complexity,
                        sample_input, sample_output, constraints, input_format, output_format,
                        topic, company_id, reference_code, reference_language
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
                    [
                        q.title, q.description, q.difficulty.toLowerCase(), q.expected_complexity,
                        q.sample_input, q.sample_output, JSON.stringify(q.constraints), q.input_format, q.output_format,
                        q.tags[0].toLowerCase(), adobeId, q.reference_code, q.reference_language
                    ]
                );
                qId = insertRes.rows[0].id;
            }

            // Insert testcases
            console.log(`Adding testcases for ${q.title}...`);
            for (const c of q.testcases) {
                // Check if testcase exists to avoid duplicates
                const tcExists = await pool.query(
                    'SELECT id FROM testcases WHERE question_id=$1 AND input=$2',
                    [qId, c.input]
                );
                if (tcExists.rows.length === 0) {
                    await pool.query(
                        `INSERT INTO testcases (question_id, input, expected_output, is_hidden) VALUES ($1, $2, $3, $4)`,
                        [qId, c.input, c.expected_output, c.is_hidden]
                    );
                }
            }
        }

        console.log('Adobe questions seeded successfully.');
    } catch (e) {
        console.error('Error seeding Adobe questions:', e);
    } finally {
        pool.end();
    }
};

seedAdobeQuestions();
