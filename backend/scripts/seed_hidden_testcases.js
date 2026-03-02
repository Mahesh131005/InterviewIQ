import 'dotenv/config';
import pool from '../src/db.js';

const seedHiddenTestcases = async () => {
    try {
        console.log('Seeding hidden testcases...');

        // Fetch all questions to map title -> id
        const result = await pool.query('SELECT id, title FROM questions');
        const questionsList = result.rows;
        const qMap = {};
        for (const q of questionsList) {
            qMap[q.title] = q.id;
        }

        const hiddenCases = [
            {
                title: 'Two Sum',
                cases: [
                    { input: "4\n[2,7,11,15]\ntarget = 9", expected_output: "[0,1]" },
                    { input: "3\n[3,2,4]\ntarget = 6", expected_output: "[1,2]" },
                    { input: "2\n[3,3]\ntarget = 6", expected_output: "[0,1]" }
                ]
            },
            {
                title: 'Reverse String',
                cases: [
                    { input: "tacocat", expected_output: "tacocat" },
                    { input: "racecar", expected_output: "racecar" },
                    { input: "A man", expected_output: "nam A" }
                ]
            },
            {
                title: 'Longest Substring Without Repeating Characters',
                cases: [
                    { input: "abcabcbb", expected_output: "3" },
                    { input: "bbbbb", expected_output: "1" },
                    { input: "pwwkew", expected_output: "3" },
                    { input: "", expected_output: "0" }
                ]
            },
            {
                title: 'Valid Parentheses',
                cases: [
                    { input: "((()))", expected_output: "true" },
                    { input: "([)]", expected_output: "false" },
                    { input: "{[]}", expected_output: "true" },
                    { input: "]", expected_output: "false" }
                ]
            },
            {
                title: 'Median of Two Sorted Arrays',
                cases: [
                    { input: "[1,3]\n[2]", expected_output: "2.0" },
                    { input: "[1,2]\n[3,4]", expected_output: "2.5" },
                    { input: "[0,0]\n[0,0]", expected_output: "0.0" }
                ]
            },
            {
                title: 'Trapping Rain Water',
                cases: [
                    { input: "12\n[0,1,0,2,1,0,1,3,2,1,2,1]", expected_output: "6" },
                    { input: "6\n[4,2,0,3,2,5]", expected_output: "9" },
                    { input: "0\n[]", expected_output: "0" }
                ]
            },
            {
                title: 'Merge k Sorted Lists',
                cases: [
                    { input: "[[1,4,5],[1,3,4],[2,6]]", expected_output: "[1,1,2,3,4,4,5,6]" },
                    { input: "[]", expected_output: "[]" },
                    { input: "[[]]", expected_output: "[]" }
                ]
            }
        ];

        for (const item of hiddenCases) {
            const qId = qMap[item.title];
            if (!qId) {
                console.log(`Question '${item.title}' not found in DB, skipping...`);
                continue;
            }

            // check if hidden cases already exist avoiding duplicates
            const existing = await pool.query('SELECT COUNT(*) FROM testcases WHERE question_id=$1 AND is_hidden=TRUE', [qId]);
            if (parseInt(existing.rows[0].count) > 0) {
                console.log(`Hidden cases already exist for '${item.title}'`);
                continue;
            }

            // Insert hidden cases
            for (const c of item.cases) {
                await pool.query(
                    `INSERT INTO testcases (question_id, input, expected_output, is_hidden) VALUES ($1, $2, $3, TRUE)`,
                    [qId, c.input, c.expected_output]
                );
            }
            console.log(`Added ${item.cases.length} hidden cases for '${item.title}'`);
        }

        console.log('Seeding hidden testcases complete.');
    } catch (e) {
        console.error('Error seeding hidden testcases:', e);
    } finally {
        pool.end();
    }
};

seedHiddenTestcases();
