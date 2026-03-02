from executor import CodeExecutor

executor = CodeExecutor()

py_code = """
def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        if target - num in seen:
            return [seen[target - num], i]
        seen[num] = i
    return []
"""

js_code = """
function twoSum(nums, target) {
    const map = new Map();
    for(let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if(map.has(diff)) {
            return [map.get(diff), i];
        }
        map.set(nums[i], i);
    }
    return [];
}
"""

test_cases = [
    {"input": "[2,7,11,15], target=9", "expectedOutput": "[0,1]"},
    {"input": "[3,2,4], target=6", "expectedOutput": "[1,2]"},
    {"input": "[3,3], target=6", "expectedOutput": "[0,1]"}
]

print("Testing Python...")
print(executor.execute(code=py_code, language="python", test_cases=test_cases))

print("Testing JS...")
print(executor.execute(code=js_code, language="javascript", test_cases=test_cases))

