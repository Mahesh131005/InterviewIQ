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
