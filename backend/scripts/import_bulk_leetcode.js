import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import pool from '../src/db.js';

// Configuration
const BASE_DIR = "E:\\company wise quesitons\\Leetcode Company Wise Problems - Updated as of March 2025 - Krishan Kumar";
// To avoid hitting API limits immediately, let's just process a specific company or limit the max questions
const TARGET_COMPANY = "Arcesium";  // You can change this or set it to null to process everything
const TARGET_CSV = "5. All.csv"; // You can target "5. All.csv" for all.
const MAX_QUESTIONS_TO_PROCESS = 10; // FOR TESTING: Only process 10 questions to avoid massive API charges/time. Increase this later!
const START_DELAY_MS = 4500; // 4.5 seconds per request (keeps us under 15 Requests-Per-Minute free tier)

// Initialize Gemini
if (!process.env.GEMINI_API_KEY) {
    console.error("CRITICAL ERROR: GEMINI_API_KEY is not set in .env");
    process.exit(1);
}
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 1. Read CSV File and Extract Questions
 */
const parseCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                if (data.Link && data.Link.includes('leetcode.com/problems/')) {
                    const titleSlug = data.Link.split('/problems/')[1].split('/')[0];
                    results.push({
                        title: data.Title,
                        titleSlug: titleSlug,
                        difficulty: data.Difficulty || 'Medium',
                        topics: data.Topics || '',
                        link: data.Link
                    });
                }
            })
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
};

/**
 * 2. Fetch Problem Details from LeetCode GraphQL
 */
const fetchLeetCodeData = async (titleSlug) => {
    const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        title
        content
        difficulty
        exampleTestcases
        hints
      }
    }
  `;

    try {
        const response = await axios.post('https://leetcode.com/graphql', {
            query,
            variables: { titleSlug }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            }
        });
        return response.data.data.question;
    } catch (error) {
        console.error(`Failed to fetch LeetCode data for ${titleSlug}:`, error.message);
        return null;
    }
};

/**
 * 3. Generate Reference Code & Hidden Testcases using Gemini
 */
const generateSolutionAndTests = async (problemData) => {
    const prompt = `
You are an expert competitive programmer and backend engineer.
I am building an AI Interview platform. I need you to generate a pure, syntactically perfect Python 3 reference solution and test cases for a specific programming problem.

Problem Name: ${problemData.title}
Problem HTML Description:
${problemData.content}

Requirements:
1. Write a perfect Python 3 reference solution.
2. The code MUST read from sys.stdin properly, parse the string input correctly according to the problem, and print the resulting string output to sys.stdout.
3. Keep the "expected_complexity" inside 20 characters (Format exactly like: "O(N)", or "O(N log N)").
4. Provide exactly 4 hidden test cases that evaluate edge cases and average cases.
5. Provide a sample input and sample output format for the "sample_input" and "sample_output" columns.

RETURN STRICT JSON ONLY. NO MARKDOWN. NO BACKTICKS. FORMAT:
{
  "reference_code": "def solve()... \\n\\nimport sys...",
  "expected_complexity": "O(N)",
  "sample_input": "...",
  "sample_output": "...",
  "input_format": "...",
  "output_format": "...",
  "hidden_testcases": [
    { "input": "...", "expected_output": "...", "is_hidden": true }
  ]
}
`;

    const MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-3-flash-preview'];
    let currentModelIndex = 0;
    const MAX_RETRIES = 5;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        attempt++;
        const currentModel = MODELS[currentModelIndex];

        // Create a timeout promise to prevent infinite hangs on LLM Generation
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('LLM Generation Timeout exceeded (45s)')), 45000)
        );

        try {
            const generationPromise = ai.models.generateContent({
                model: currentModel,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                }
            });

            const response = await Promise.race([generationPromise, timeoutPromise]);
            let text = response.text;

            // Sometimes LLMs wrap JSON in ```json or ``` markers. Strip them.
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();

            // Find the first { and last } to avoid trailing conversational text
            const firstBrace = text.indexOf('{');
            const lastBrace = text.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                text = text.substring(firstBrace, lastBrace + 1);
            }

            return JSON.parse(text);
        } catch (e) {
            const errorMessage = e.message || String(e);
            console.error(`Attempt ${attempt}/${MAX_RETRIES} - Gemini Failed for ${problemData.title} using ${currentModel}:`, errorMessage);

            if (attempt < MAX_RETRIES && (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED'))) {
                // Before sleeping, try switching to the next available model
                if (currentModelIndex < MODELS.length - 1) {
                    currentModelIndex++;
                    console.log(`Rate limit reached for ${currentModel}. Switching to fallback model: ${MODELS[currentModelIndex]}...`);
                    // Retry immediately with the new model
                    continue;
                }

                // If we've exhausted all fallback models, then we must sleep
                currentModelIndex = 0; // Reset back to the start of the list for the next attempt after sleep

                // Try to dynamically extract exact retry delay from Gemini error payload (e.g. "retryDelay":"57s")
                let sleepTimeMs = 65000;
                try {
                    const match = errorMessage.match(/"retryDelay"\s*:\s*"(\d+)s"/);
                    if (match && match[1]) {
                        // Add an extra 2 seconds buffer
                        sleepTimeMs = (parseInt(match[1], 10) + 2) * 1000;
                    }
                } catch (err) { /* ignore parse errors */ }

                console.log(`All fallback models exhausted. Sleeping for ${sleepTimeMs / 1000} seconds to clear sliding window before retry...`);
                await delay(sleepTimeMs);
            } else if (attempt === MAX_RETRIES) {
                return null;
            }
        }
    }
};

/**
 * 4. Insert into Database
 */
const dbInsert = async (companyName, questionMeta, lcData, generatedData) => {
    // 1. Ensure Company Exists
    let compId;
    const compRes = await pool.query('SELECT id FROM companies WHERE name=$1', [companyName]);
    if (compRes.rows.length > 0) {
        compId = compRes.rows[0].id;
    } else {
        const newComp = await pool.query(
            "INSERT INTO companies (name, description, total_questions) VALUES ($1, $2, 0) RETURNING id",
            [companyName, `Interview questions for ${companyName}`]
        );
        compId = newComp.rows[0].id;
    }

    // 2. Insert/Update Question
    const existingQ = await pool.query('SELECT id FROM questions WHERE title=$1', [questionMeta.title]);
    let qId;

    // Grab all topics from CSV as a lowered, CSV string
    const allTopics = questionMeta.topics ? questionMeta.topics.toLowerCase() : 'algorithm';

    if (existingQ.rows.length > 0) {
        qId = existingQ.rows[0].id;
        await pool.query(
            `UPDATE questions SET 
                description=$1, difficulty=$2, expected_complexity=$3, sample_input=$4,
                sample_output=$5, input_format=$6, output_format=$7, topic=$8, 
                company_id=$9, reference_code=$10, reference_language='python' 
             WHERE id=$11`,
            [
                lcData.content, questionMeta.difficulty.toLowerCase(), generatedData.expected_complexity.substring(0, 20),
                generatedData.sample_input, generatedData.sample_output, generatedData.input_format,
                generatedData.output_format, allTopics, compId, generatedData.reference_code, qId
            ]
        );
        console.log(`  -> Updated existing question: ${questionMeta.title}`);
    } else {
        const newQ = await pool.query(
            `INSERT INTO questions (
                title, description, difficulty, expected_complexity, sample_input,
                sample_output, input_format, output_format, topic, company_id,
                reference_code, reference_language
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'python') RETURNING id`,
            [
                questionMeta.title, lcData.content, questionMeta.difficulty.toLowerCase(),
                generatedData.expected_complexity.substring(0, 20), generatedData.sample_input,
                generatedData.sample_output, generatedData.input_format, generatedData.output_format,
                allTopics, compId, generatedData.reference_code
            ]
        );
        qId = newQ.rows[0].id;
        console.log(`  -> Inserted new question: ${questionMeta.title}`);

        // Update company count
        await pool.query('UPDATE companies SET total_questions = total_questions + 1 WHERE id=$1', [compId]);
    }

    // 3. Insert Test Cases
    const allTestcases = [...generatedData.hidden_testcases];

    // Attempt to grab visible testcases from LeetCode examples strings
    if (lcData.exampleTestcases) {
        const testCaseLines = lcData.exampleTestcases.split('\n');
        // This is a naive split. Complete visible outputs are hard to deduce perfectly without LLM.
        // For simplicity, we mostly rely on hidden test cases or the sample input/output for exact matching.
        // We'll push the sample input/output as the first visible baseline:
    }

    // Add explicitly given sample as first visible testcase
    allTestcases.unshift({
        input: generatedData.sample_input,
        expected_output: generatedData.sample_output,
        is_hidden: false
    });

    for (const tc of allTestcases) {
        const tcExists = await pool.query(
            'SELECT id FROM testcases WHERE question_id=$1 AND input=$2',
            [qId, tc.input]
        );
        if (tcExists.rows.length === 0) {
            await pool.query(
                `INSERT INTO testcases (question_id, input, expected_output, is_hidden) VALUES ($1, $2, $3, $4)`,
                [qId, tc.input, String(tc.expected_output), !!tc.is_hidden]
            );
        }
    }
    console.log(`  -> Inserted ${allTestcases.length} test cases.`);
};

const runPipeline = async () => {
    try {
        console.log(`Starting Bulk Importer. Target Company: ${TARGET_COMPANY}`);

        // Resolve Target Path
        const companyPath = path.join(BASE_DIR, TARGET_COMPANY);
        const targetCsvPath = path.join(companyPath, TARGET_CSV);

        if (!fs.existsSync(targetCsvPath)) {
            console.error(`Cannot find CSV File: ${targetCsvPath}`);
            process.exit(1);
        }

        console.log(`Parsing CSV: ${targetCsvPath}`);
        const questionsMeta = await parseCSV(targetCsvPath);
        console.log(`Found ${questionsMeta.length} valid links.`);

        const limit = Math.min(questionsMeta.length, MAX_QUESTIONS_TO_PROCESS);
        console.log(`Processing first ${limit} questions to respect limits...`);

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < limit; i++) {
            const q = questionsMeta[i];
            console.log(`\n[${i + 1}/${limit}] Processing: ${q.title} (${q.titleSlug})`);

            // 1. Fetch LeetCode Data
            const lcData = await fetchLeetCodeData(q.titleSlug);
            if (!lcData || !lcData.content) {
                console.log(`  X Skipping: Failed to parse LeetCode Graphql`);
                failCount++;
                continue;
            }

            // 2. Call LLM
            console.log(`  * Generating Solution with Gemini...`);
            const generatedData = await generateSolutionAndTests(lcData, q);
            if (!generatedData) {
                console.log(`  X Skipping: LLM Generation failed`);
                failCount++;
                continue;
            }

            // 3. Insert into Database
            await dbInsert(TARGET_COMPANY, q, lcData, generatedData);
            successCount++;

            // Wait to avoid rate limits
            if (i < limit - 1) {
                await delay(START_DELAY_MS);
            }
        }

        console.log(`\n=== Pipeline Finished ===`);
        console.log(`Success: ${successCount}`);
        console.log(`Failed: ${failCount}`);

    } catch (e) {
        console.error("Pipeline crashed:", e);
    } finally {
        pool.end();
        process.exit(0);
    }
};

runPipeline();
