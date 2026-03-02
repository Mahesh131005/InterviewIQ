import requests

url = "http://localhost:5001/execute-code"
headers = {"Content-Type": "application/json"}
data = {
    "code": "#include <iostream>\nusing namespace std;\nint main() { cuot << \"Hello\" << endl; return 0; }",
    "language": "cpp",
    "testCases": [
        {"input": "1 2", "expectedOutput": ""}
    ]
}

try:
    response = requests.post(url, json=data, headers=headers)
    print("errorMessage:", response.json().get('errorMessage'))
except Exception as e:
    print("ERROR:", e)
