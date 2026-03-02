import 'dotenv/config';
import pool from '../src/db.js';

const seedReferenceSolutions = async () => {
    try {
        console.log('Seeding reference solutions...');

        const updates = [
            {
                title: 'Two Sum',
                reference_language: 'python',
                reference_code: `
def twoSum(nums, target):
    num_map = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in num_map:
            return [num_map[complement], i]
        num_map[num] = i
    return []

# Read inputs
import sys
import json

lines = sys.stdin.read().strip().split('\\n')
if len(lines) >= 3:
    n = int(lines[0])
    
    # Try parsing array, it might be space separated or JSON list
    nums_line = lines[1].strip()
    if nums_line.startswith('['):
        nums = json.loads(nums_line)
    else:
        nums = [int(x) for x in nums_line.split()]
        
    target_str = lines[2].replace('target = ', '').strip()
    target = int(target_str)
    
    res = twoSum(nums, target)
    print(json.dumps(res).replace(' ', ''))
`
            },
            {
                title: 'Reverse String',
                reference_language: 'python',
                reference_code: `
def reverseString(s):
    if isinstance(s, list):
        left, right = 0, len(s) - 1
        while left < right:
            s[left], s[right] = s[right], s[left]
            left += 1
            right -= 1
        return s
    else:
        return s[::-1]

import sys
import ast
import json

line = sys.stdin.read().strip()
if line:
    try:
        if line.startswith('[') and line.endswith(']'):
            s = ast.literal_eval(line)
            res = reverseString(s)
            print(json.dumps(res).replace(" ", ""))
        else:
            while len(line) >= 2 and ((line.startswith('"') and line.endswith('"')) or (line.startswith("'") and line.endswith("'"))):
                line = line[1:-1]
            res = reverseString(line)
            print(f'"{res}"')
    except Exception as e:
        print("Invalid input format")
`
            },
            {
                title: 'Longest Substring Without Repeating Characters',
                reference_language: 'python',
                reference_code: `
def lengthOfLongestSubstring(s: str) -> int:
    char_set = set()
    left = 0
    max_len = 0
    
    for right in range(len(s)):
        while s[right] in char_set:
            char_set.remove(s[left])
            left += 1
        char_set.add(s[right])
        max_len = max(max_len, right - left + 1)
        
    return max_len

import sys
s = sys.stdin.read().strip()
# remove surrounding quotes if exist
while len(s) >= 2 and ((s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'"))):
    s = s[1:-1]
    
print(lengthOfLongestSubstring(s))
`
            },
            {
                title: 'Valid Parentheses',
                reference_language: 'python',
                reference_code: `
def isValid(s: str) -> bool:
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    
    for char in s:
        if char in mapping:
            top_element = stack.pop() if stack else '#'
            if mapping[char] != top_element:
                return False
        else:
            stack.append(char)
            
    return not stack

import sys
s = sys.stdin.read().strip()
while len(s) >= 2 and ((s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'"))):
    s = s[1:-1]

if isValid(s):
    print("true")
else:
    print("false")
`
            },
            {
                title: 'Median of Two Sorted Arrays',
                reference_language: 'python',
                reference_code: `
def findMedianSortedArrays(nums1, nums2) -> float:
    nums = sorted(nums1 + nums2)
    n = len(nums)
    if n % 2 == 1:
        return float(nums[n//2])
    else:
        return (nums[n//2 - 1] + nums[n//2]) / 2.0

import sys
import json
lines = sys.stdin.read().strip().split('\\n')

# parse input which might be on multiple lines or single line
s = "".join(lines)
parts = s.split(']')
if len(parts) >= 2:
    n1_str = parts[0] + ']'
    n2_str = parts[1].strip()
    if n2_str.startswith(','):
        n2_str = n2_str[1:].strip()
        
    try:
        nums1 = json.loads(n1_str)
        nums2 = json.loads(n2_str)
        print(f"{findMedianSortedArrays(nums1, nums2):.1f}")
    except:
        print("0.0")
else:
    print("0.0")
`
            },
            {
                title: 'Trapping Rain Water',
                reference_language: 'python',
                reference_code: `
def trap(height) -> int:
    if not height:
        return 0
    ans = 0
    n = len(height)
    left, right = 0, n - 1
    left_max, right_max = height[left], height[right]
    
    while left < right:
        if height[left] < height[right]:
            if height[left] >= left_max:
                left_max = height[left]
            else:
                ans += left_max - height[left]
            left += 1
        else:
            if height[right] >= right_max:
                right_max = height[right]
            else:
                ans += right_max - height[right]
            right -= 1
    return ans

import sys
import json
data = sys.stdin.read().strip()
try:
    nums = json.loads(data)
    print(trap(nums))
except:
    print("0")
`
            },
            {
                title: 'Merge k Sorted Lists',
                reference_language: 'python',
                reference_code: `
import sys
import json

def mergeKLists(lists):
    all_nums = []
    for l in lists:
        all_nums.extend(l)
    all_nums.sort()
    return all_nums

data = sys.stdin.read().strip()
try:
    lists = json.loads(data)
    res = mergeKLists(lists)
    print(json.dumps(res).replace(' ', ''))
except:
    print("[]")
`
            }
        ];

        for (const update of updates) {
            const res = await pool.query(
                "UPDATE questions SET reference_code = $1, reference_language = $2 WHERE title = $3 RETURNING id",
                [update.reference_code, update.reference_language, update.title]
            );
            if (res.rowCount > 0) {
                console.log(`Updated reference solution for ${update.title}`);
            }
        }

        console.log('Seeding complete.');
    } catch (err) {
        console.error('Error seeding reference solutions:', err);
    } finally {
        pool.end();
    }
};

seedReferenceSolutions();
