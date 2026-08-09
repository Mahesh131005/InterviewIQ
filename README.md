# PrepPilot

PrepPilot is an AI-powered technical interview simulator that provides real-time, interactive coding practice and behavioral feedback. It leverages a modern microservices architecture to securely execute user code, analyze algorithmic complexity, and evaluate performance using local LLMs.

[![CI](https://github.com/username/preppilot/actions/workflows/ci.yml/badge.svg)](https://github.com/username/preppilot/actions/workflows/ci.yml)

## Architecture

```text
+-------------------+
|                   |
|   React Frontend  |
|                   |
+---------+---------+
          |
          | REST / JSON
          v
+---------+----------------------------------------+
|                                                  |
|   Node.js API                                    |
|   (JWT Auth, Rate Limiting, JSONB Persistence)   |
|                                                  |
+---------+----------------------------------------+
          |
          | REST / JSON
          v
+---------+----------------------------------------+
|                                                  |
|   Flask Execution Microservice                   |
|   (Subprocess Execution + AST Analysis)          |
|                                                  |
+---------+----------------------------------------+
          |
          | HTTP
          v
+---------+----------------------------------------+
|                                                  |
|   Mistral 7B (via Ollama)                        |
|   (LLM Evaluation & Scoring)                     |
|                                                  |
+--------------------------------------------------+
```

## Design Decisions

### Microservice Isolation for Code Execution
Code execution is decoupled from the Node.js API into a dedicated Flask microservice. Node.js is single-threaded and heavily relies on its asynchronous event loop; performing blocking compilation and running untrusted CPU-bound code inline would degrade the API's concurrency and responsiveness. 

**Implementation & Gap:** The sandboxing mechanism currently isolates executions into temporary directories (`tempfile.TemporaryDirectory()`) and relies on `subprocess.run` with a hard timeout (e.g., 5 seconds for compilation, 2 seconds for execution). **Note:** There is a significant security gap in the current implementation. The code accepts a `memory_limit_mb` parameter but never actually enforces it or restricts system calls (via mechanisms like `ulimit`, cgroups, or Docker containers). Thus, a malicious submission could potentially execute a fork bomb or exhaust system memory.

### PostgreSQL JSONB for Session Persistence
We use PostgreSQL's `JSONB` data type for flexible, schema-less storage where rigid relational modeling is unnecessary. Most notably, the `interviewer_sessions` table uses a `conversation_history` JSONB column to natively store the ongoing AI chat log. Other uses include `companies.difficulty_bias` (storing dynamic difficulty weights) and `questions.hints`. This allows us to query and update nested JSON objects efficiently without requiring constant schema migrations.

### AST-Based Big-O Complexity Prediction
To complement the Mistral 7B LLM scoring, the Python microservice implements an objective `ComplexityAnalyzer`. 
- For Python, it parses the code into an Abstract Syntax Tree (AST) to traverse nodes. 
- For C++/Java, it relies on regex pattern matching.
It actively counts `for`/`while` loops, tracks nested loop depths, detects recursive function calls (flagging them conservatively as `O(2^n)` or `O(n log n)`), and identifies data structures like HashMaps or Arrays. This structural analysis provides a reliable baseline for time and space complexity, preventing cases where an LLM might be tricked by misleading comments or variable names into giving an incorrect Big-O evaluation.

## Testing

Currently, testing relies on custom execution scripts. To align with industry standards, formal test suites should be configured:

- **Node.js API:** Uses custom scripts like `node test_api.js`. (Note: `Jest` is not yet configured in `package.json`).
- **Flask Execution Microservice:** Uses custom scripts like `python test_executor.py`. (Note: `pytest` is not yet present in `requirements.txt`).

*Note: Specific latency and benchmark metrics are not claimed here. A benchmark script should be added to the repository to properly substantiate any performance claims (e.g., "<200ms" execution latency).*

## Local Setup

### 1. Node.js API
```bash
cd backend
# Install dependencies
npm install
# Run database migrations
npm run migrate:up
# Start the development server (runs on port 5000 by default)
npm run dev
```

### 2. Flask Execution Microservice
```bash
cd python-service
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt
# Start the Flask app
python app.py
```
