-- Sample Questions and Test Cases
-- This file contains sample data for testing the system

-- Easy Questions
-- Google: Two Sum Easy
INSERT INTO questions (title, description, difficulty, expected_complexity, topic, company_id, constraints, sample_input, sample_output, hints, input_format, output_format)
SELECT 'Two Sum', 
       'Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target. You may assume each input has exactly one solution, and you cannot use the same element twice.',
       'easy',
       'O(n)',
       'array',
       id,
       '2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9, -10^9 <= target <= 10^9',
       '[2,7,11,15], target = 9',
       '[0,1]',
       '["Use a hash map", "Single pass solution"]',
       'The first line contains an integer N (the size of the array).\nThe second line contains N space-separated integers representing the array elements.\nThe third line contains an integer target.',
       'Output two space-separated integers representing the indices of the two numbers.'
FROM companies WHERE name = 'Google'
LIMIT 1;

-- Add test cases for Two Sum
INSERT INTO testcases (question_id, input, expected_output, is_hidden)
SELECT q.id, '[2,7,11,15]', '[0,1]', FALSE
FROM questions q WHERE q.title = 'Two Sum' LIMIT 1;

INSERT INTO testcases (question_id, input, expected_output, is_hidden)
SELECT q.id, '[3,2,4]', '[1,2]', FALSE
FROM questions q WHERE q.title = 'Two Sum' LIMIT 1;

INSERT INTO testcases (question_id, input, expected_output, is_hidden)
SELECT q.id, '[3,3]', '[0,1]', TRUE
FROM questions q WHERE q.title = 'Two Sum' LIMIT 1;

-- Amazon: Reverse String Easy
INSERT INTO questions (title, description, difficulty, expected_complexity, topic, company_id, constraints, sample_input, sample_output, input_format, output_format)
SELECT 'Reverse String',
       'Write a function that reverses a string. The input string is given as an array of characters s.',
       'easy',
       'O(n)',
       'string',
       id,
       '1 <= s.length <= 10^5',
       '[''h'',''e'',''l'',''l'',''o'']',
       '[''o'',''l'',''l'',''e'',''h'']',
       'A single line containing the string characters separated by spaces.',
       'Output the reversed string characters separated by spaces.'
FROM companies WHERE name = 'Amazon'
LIMIT 1;

-- Medium Questions
-- Google: Longest Substring Medium
INSERT INTO questions (title, description, difficulty, expected_complexity, topic, company_id, constraints, sample_input, sample_output, input_format, output_format)
SELECT 'Longest Substring Without Repeating Characters',
       'Given a string s, find the length of the longest substring without repeating characters.',
       'medium',
       'O(n)',
       'string',
       id,
       '0 <= s.length <= 5 * 10^4, s consists of English letters, digits, symbols and spaces',
       'abcabcbb',
       '3',
       'A single line containing the string s.',
       'Output a single integer representing the length of the longest substring.'
FROM companies WHERE name = 'Google'
LIMIT 1;

-- Meta: Valid Parentheses Medium
INSERT INTO questions (title, description, difficulty, expected_complexity, topic, company_id, constraints, sample_input, sample_output, input_format, output_format)
SELECT 'Valid Parentheses',
       'Given a string s containing just the characters ''('' '')'', ''{'' ''}'' ''['' and '']'', determine if the input string is valid.',
       'medium',
       'O(n)',
       'stack',
       id,
       '1 <= s.length <= 10^4',
       '()[]{}',
       'true',
       'A single line containing the string of parentheses.',
       'Output "true" if the parentheses are valid, otherwise output "false".'
FROM companies WHERE name = 'Meta'
LIMIT 1;

-- Hard Questions
-- Google: Median of Two Sorted Arrays Hard
INSERT INTO questions (title, description, difficulty, expected_complexity, topic, company_id, constraints, sample_input, sample_output, input_format, output_format)
SELECT 'Median of Two Sorted Arrays',
       'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall runtime complexity should be O(log(m+n)).',
       'hard',
       'O(log(m+n))',
       'array',
       id,
       'nums1.length == m, nums2.length == n, 0 <= m <= 1000, 0 <= n <= 1000',
       '[1,3], [2]',
       '2.0',
       'The first line contains N and M (the sizes of the arrays). The second line contains N sorted integers. The third line contains M sorted integers.',
       'Output a single float/double representing the median.'
FROM companies WHERE name = 'Google'
LIMIT 1;

-- Microsoft: Trapping Rain Water Hard
INSERT INTO questions (title, description, difficulty, expected_complexity, topic, company_id, constraints, sample_input, sample_output, input_format, output_format)
SELECT 'Trapping Rain Water',
       'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
       'hard',
       'O(n)',
       'array',
       id,
       '1 <= height.length <= 2 * 10^4, 0 <= height[i] <= 10^5',
       '[0,1,0,2,1,0,1,3,2,1,2,1]',
       '6',
       'The first line contains N. The second line contains N space-separated integers representing the bar heights.',
       'Output a single integer representing the total water trapped.'
FROM companies WHERE name = 'Microsoft'
LIMIT 1;

-- Amazon: Merge k Sorted Lists Hard
INSERT INTO questions (title, description, difficulty, expected_complexity, topic, company_id, constraints, sample_input, sample_output, input_format, output_format)
SELECT 'Merge k Sorted Lists',
       'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.',
       'hard',
       'O(n log k)',
       'linked-list',
       id,
       '0 <= k <= 10^4, 0 <= nums of each list <= 500',
       '[[1,4,5],[1,3,4],[2,6]]',
       '[1,1,2,3,4,4,5,6]',
       'The first line contains K. The next K lines represent the sorted linked-lists.',
       'Output a single line containing the merged sorted list separated by spaces.'
FROM companies WHERE name = 'Amazon'
LIMIT 1;

-- Add Testcases for Reverse String
INSERT INTO testcases (question_id, input, expected_output, is_hidden)
SELECT q.id, '["h","e","l","l","o"]', '["o","l","l","e","h"]', FALSE
FROM questions q WHERE q.title = 'Reverse String' LIMIT 1;

-- Add Testcases for Longest Substring Without Repeating Characters
INSERT INTO testcases (question_id, input, expected_output, is_hidden)
SELECT q.id, 'abcabcbb', '3', FALSE
FROM questions q WHERE q.title = 'Longest Substring Without Repeating Characters' LIMIT 1;

-- Add Testcases for Valid Parentheses
INSERT INTO testcases (question_id, input, expected_output, is_hidden)
SELECT q.id, '()[]{}', 'true', FALSE
FROM questions q WHERE q.title = 'Valid Parentheses' LIMIT 1;

INSERT INTO testcases (question_id, input, expected_output, is_hidden)
SELECT q.id, '(]', 'false', TRUE
FROM questions q WHERE q.title = 'Valid Parentheses' LIMIT 1;

-- Add Testcases for Median of Two Sorted Arrays
INSERT INTO testcases (question_id, input, expected_output, is_hidden)
SELECT q.id, '[1,3], [2]', '2.0', FALSE
FROM questions q WHERE q.title = 'Median of Two Sorted Arrays' LIMIT 1;

-- Add Testcases for Trapping Rain Water
INSERT INTO testcases (question_id, input, expected_output, is_hidden)
SELECT q.id, '[0,1,0,2,1,0,1,3,2,1,2,1]', '6', FALSE
FROM questions q WHERE q.title = 'Trapping Rain Water' LIMIT 1;

-- Add Testcases for Merge k Sorted Lists
INSERT INTO testcases (question_id, input, expected_output, is_hidden)
SELECT q.id, '[[1,4,5],[1,3,4],[2,6]]', '[1,1,2,3,4,4,5,6]', FALSE
FROM questions q WHERE q.title = 'Merge k Sorted Lists' LIMIT 1;
-- Sample Practice Problems

INSERT INTO practice_problems (id, title, description, difficulty, expected_complexity, constraints, sample_input, sample_output, hints, input_format, output_format, reference_code, reference_language, total_attempts, accepted_attempts) VALUES
('11111111-1111-1111-1111-111111111111', 'Two Sum', 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.', 'easy', 'O(n)', '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9', 'nums = [2,7,11,15], target = 9', '[0,1]', '["Use a hash map to store the elements you have seen so far."]', 'The first line contains N. The second line contains N integers. The third line contains the target.', 'Two space-separated integers representing indices.', 'def twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        if target - num in seen:\n            return [seen[target-num], i]\n        seen[num] = i\n    return []', 'python', 125, 95),
('22222222-2222-2222-2222-222222222222', 'Longest Substring Without Repeating Characters', 'Given a string s, find the length of the longest substring without repeating characters.', 'medium', 'O(n)', '0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.', 's = "abcabcbb"', '3', '["Use a sliding window approach with two pointers."]', 'A single string s.', 'An integer representing the length.', 'def lengthOfLongestSubstring(s):\n    seen = {}\n    max_len = 0\n    start = 0\n    for i, char in enumerate(s):\n        if char in seen and start <= seen[char]:\n            start = seen[char] + 1\n        else:\n            max_len = max(max_len, i - start + 1)\n        seen[char] = i\n    return max_len', 'python', 80, 45),
('33333333-3333-3333-3333-333333333333', 'Merge k Sorted Lists', 'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.', 'hard', 'O(N log k)', 'k == lists.length\n0 <= k <= 10^4\n0 <= lists[i].length <= 500\n-10^4 <= lists[i][j] <= 10^4', 'lists = [[1,4,5],[1,3,4],[2,6]]', '[1,1,2,3,4,4,5,6]', '["Use a priority queue (min-heap) to keep track of the smallest element among the k lists."]', 'The first line contains k. The next k lines represent each list.', 'A single line of space-separated integers.', 'import heapq\ndef mergeKLists(lists):\n    # implementation here\n    pass', 'python', 40, 15);

INSERT INTO problem_topics (problem_id, topic) VALUES
('11111111-1111-1111-1111-111111111111', 'Array'),
('11111111-1111-1111-1111-111111111111', 'Hash Table'),
('22222222-2222-2222-2222-222222222222', 'String'),
('22222222-2222-2222-2222-222222222222', 'Sliding Window'),
('33333333-3333-3333-3333-333333333333', 'Linked List'),
('33333333-3333-3333-3333-333333333333', 'Heap');

INSERT INTO problem_companies (problem_id, company) VALUES
('11111111-1111-1111-1111-111111111111', 'Google'),
('11111111-1111-1111-1111-111111111111', 'Amazon'),
('22222222-2222-2222-2222-222222222222', 'Amazon'),
('22222222-2222-2222-2222-222222222222', 'Meta'),
('33333333-3333-3333-3333-333333333333', 'Google'),
('33333333-3333-3333-3333-333333333333', 'Apple');

-- Testcases
INSERT INTO practice_testcases (problem_id, input, expected_output, is_hidden) VALUES
('11111111-1111-1111-1111-111111111111', '4\n2 7 11 15\n9', '0 1', false),
('11111111-1111-1111-1111-111111111111', '3\n3 2 4\n6', '1 2', false),
('11111111-1111-1111-1111-111111111111', '2\n3 3\n6', '0 1', true),
('22222222-2222-2222-2222-222222222222', 'abcabcbb', '3', false),
('22222222-2222-2222-2222-222222222222', 'bbbbb', '1', false),
('22222222-2222-2222-2222-222222222222', 'pwwkew', '3', true),
('33333333-3333-3333-3333-333333333333', '3\n3\n1 4 5\n3\n1 3 4\n2\n2 6', '1 1 2 3 4 4 5 6', false);
