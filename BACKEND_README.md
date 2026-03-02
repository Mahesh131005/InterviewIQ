# AI Code Interviewer - Production-Ready System

A comprehensive full-stack interview platform featuring adaptive difficulty, real-time code execution, complexity analysis, and multi-dimensional scoring.

## ✨ Features

### Core Interview System

- **Company-Based Selection**: Choose from 8+ companies (Google, Amazon, Meta, etc.)
- **Adaptive Difficulty**: Questions adjust based on user performance
- **Intelligent Question Selection**: Prioritizes user weak topics
- **Real-Time Code Execution**: Sandbox for C++, Python, Java

### Code Evaluation

- **Correctness Scoring**: Validates against test cases
- **Complexity Analysis**: Predicts time/space complexity
- **Execution Metrics**: Runtime and memory consumption
- **Edge Case Testing**: Both visible and hidden test cases

### Comprehensive Scoring

- **Correctness Score** (40%): Test case pass rate
- **Efficiency Score** (20%): Complexity vs expected
- **Explanation Score** (20%): Code explanation clarity and logic
- **Behavioral Score** (20%): STAR method interview technique

### Performance Analytics

- **Topic Breakdown**: Performance by algorithm topic
- **Company Comparison**: Track performance across different companies
- **Trend Analysis**: Historical score tracking
- **Weak Topic Identification**: Focus areas for improvement

## 🏗️ Technology Stack

### Frontend

- **React** 18.2 (JavaScript only, no TypeScript)
- **Vite** - Lightning-fast bundler
- **React Router** - Client-side routing
- **Recharts** - Data visualization
- **Tailwind CSS** - Utility-first styling

### Backend

- **Node.js** 18+
- **Express.js** - REST API framework
- **PostgreSQL** 15 - Main database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Rate Limiting** - DDoS protection

### Python Microservice

- **Flask** - Lightweight HTTP server
- **AST Module** - Code complexity analysis
- **Subprocess** - Secure code execution
- **Custom Complexity Analyzer** - Algorithm analysis

### Infrastructure

- **Docker & Docker Compose** - Containerization
- **PostgreSQL** - Persistent storage
- **Linux** - Production deployment

## 📦 Project Structure

```
ai-code-interviewer/
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── context/            # React contexts
│   │   ├── hooks/              # Custom hooks
│   │   ├── services/           # API integration
│   │   └── utils/              # Helper functions
│   ├── package.json
│   └── vite.config.js
│
├── backend/                     # Node.js Express backend
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── companyController.js
│   │   │   ├── interviewController.js
│   │   │   ├── submissionController.js
│   │   │   └── analyticsController.js
│   │   ├── routes/             # API routes
│   │   ├── middleware/         # Express middleware
│   │   ├── models/             # Database queries
│   │   ├── utils/              # Helper functions
│   │   ├── services/           # Business logic
│   │   ├── db.js              # Database connection
│   │   └── server.js          # App entry point
│   ├── db/
│   │   ├── schema.sql         # Database tables
│   │   └── sample-data.sql    # Sample questions
│   ├── package.json
│   └── Dockerfile
│
├── python-service/             # Python microservice
│   ├── executor.py            # Code execution engine
│   ├── complexity_analyzer.py # Complexity detection
│   ├── evaluator.py           # LLM evaluation (heuristic-based)
│   ├── app.py                 # Flask application
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml         # Container orchestration
├── DEPLOYMENT.md              # Deployment guide
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Docker & Docker Compose (recommended)

### Local Development

**1. Database Setup**

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE coding_interview;
\q

# Load schema
psql -U postgres -d coding_interview -f backend/db/schema.sql
psql -U postgres -d coding_interview -f backend/db/sample-data.sql
```

**2. Backend**

```bash
cd backend
cp .env.example .env
# Edit .env with PostgreSQL credentials
npm install
npm run dev
# Runs on http://localhost:5000
```

**3. Python Service**

```bash
cd python-service
python -m venv venv
source venv/bin/activate  # Mac/Linux: venv\Scripts\activate (Windows)
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5001
```

**4. Frontend**

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Docker Setup (Recommended)

```bash
# From project root
docker-compose up --build

# Access services:
# Frontend: http://localhost:5173
# Backend: http://localhost:5000
# Python: http://localhost:5001
# Database: localhost:5432
```

## 📋 Database Schema

### Core Tables

**users**

- UUID id (PK)
- name, email (UNIQUE), password_hash
- created_at, updated_at

**companies**

- UUID id (PK)
- name (UNIQUE)
- difficulty_bias (JSONB: easy/medium/hard percentages)
- description, logo_url, total_questions

**questions**

- UUID id (PK)
- title, description
- difficulty (easy/medium/hard)
- expected_complexity (O notation)
- topic (array, dp, graph, string, etc)
- company_id (FK)
- constraints, sample_input, sample_output
- hints (JSONB)

**testcases**

- UUID id (PK)
- question_id (FK)
- input, expected_output
- is_hidden (for validation)

**interviews**

- UUID id (PK)
- user_id (FK), company_id (FK)
- status (in_progress/completed/abandoned)
- overall_score, confidence_score
- total_questions, completed_questions
- created_at, completed_at

**submissions**

- UUID id (PK)
- interview_id (FK), question_id (FK)
- code, language (cpp/python/java)
- Scores: correctness, efficiency, explanation, behavioral
- runtime_ms, memory_mb
- predicted_complexity, expected_complexity
- passed_testcases, total_testcases
- error_message

**topic_performance**

- UUID id (PK)
- user_id (FK), topic (UNIQUE per user)
- avg_score, total_attempts, correct_attempts
- last_updated

**company_performance**

- UUID id (PK)
- user_id (FK), company_id (FK) (UNIQUE pair)
- total_interviews, avg_score
- last_interview_at, last_updated

**session_history**

- UUID id (PK)
- user_id (FK), interview_id (FK)
- score, timestamp

## 🔌 API Reference

### Authentication

```
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

### Companies

```
GET /api/companies
GET /api/companies/:companyId
GET /api/companies/:companyId/questions
```

### Interviews

```
POST /api/interviews
GET /api/interviews/:interviewId
GET /api/interviews/:interviewId/next-question
GET /api/interviews/history
POST /api/interviews/:interviewId/complete
```

### Submissions

```
POST /api/submissions/code
POST /api/submissions/behavioral
GET /api/submissions/:submissionId
GET /api/submissions/interview/:interviewId
```

### Analytics

```
GET /api/analytics/dashboard
GET /api/analytics/topic/:topic
GET /api/analytics/company/:companyId
GET /api/analytics/comparison
```

Full API documentation available in [DEPLOYMENT.md](DEPLOYMENT.md).

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: Bcrypt with salt rounds
- **Rate Limiting**: 100 requests per 15 minutes
- **CORS Protection**: Configurable origins
- **Input Sanitization**: Preventing injection attacks
- **Secure Code Execution**:
  - Isolated subprocess with timeout
  - Memory limits enforced
  - No file system access
  - Output sanitization

## 📊 Scoring Algorithm

### Individual Scores (0-1 scale)

**Correctness Score**

```
= passed_testcases / total_testcases
```

**Efficiency Score**

```
Based on predicted complexity vs expected:
- Match: 1.0
- 1 level worse: 0.7
- 2 levels worse: 0.4
- 3+ levels worse: 0.2
```

**Explanation Score**

```
Average of:
- Clarity: Structure, transitions
- Logic: Algorithm discussion, design rationale
- Depth: Edge cases, complexity awareness
```

**Behavioral Score**

```
Based on STAR (Situation-Task-Action-Result):
- Situation setup (15%)
- Task definition (15%)
- Action detail (15%)
- Result clarity (15%)
- Leadership/Ownership (40%)
```

### Overall Score

```
overall_score =
  0.4 × correctness_score +
  0.2 × efficiency_score +
  0.2 × explanation_score +
  0.2 × behavioral_score

confidence_score = sigmoid(score_variance)
```

## 🧠 Complexity Analysis

The Python service analyzes code to predict time/space complexity:

**Detection Methods**

- Loop counting (nested loop depth)
- Recursion detection
- Hash map/data structure usage
- Array access patterns

**Supported Complexities**

- O(1), O(log n), O(n), O(n log n)
- O(n²), O(n³)
- O(2^n), O(n!)

## 🎯 Adaptive Learning

### Difficulty Adjustment

```javascript
if (user_avg_score > 0.8) → Hard questions
if (user_avg_score > 0.6) → Medium questions
if (user_avg_score ≤ 0.6) → Easy questions
```

### Topic Prioritization

```javascript
// Select from weakest topics with weighted random distribution
// Lower score topics get higher probability
probability ∝ (max_score - topic_score)
```

## 🐳 Docker Deployment

### Build All Services

```bash
docker-compose build
```

### Run Services

```bash
docker-compose up -d
```

### View Logs

```bash
docker-compose logs -f service_name
```

### Stop All Services

```bash
docker-compose down
```

### Health Checks

```bash
# All services include health checks
docker-compose ps
```

## 📈 Performance Metrics

- Query response time: <100ms average
- Test case execution: <2s timeout
- Database queries: Indexed for all common operations
- API rate limiting: 100 req/15min per IP
- Memory usage: <500MB per service

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Python Tests

```bash
cd python-service
pytest
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 🚢 Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for:

- VM deployment instructions
- SSL/TLS setup with Nginx
- Process management with PM2
- Database backups
- Monitoring setup

## 📝 Environment Variables

### Backend (.env)

```
PORT=5000
NODE_ENV=production
DB_HOST=db.example.com
DB_PORT=5432
DB_NAME=coding_interview
DB_USER=dbuser
DB_PASSWORD=strong_password
JWT_SECRET=randomly_generated_secret
PYTHON_SERVICE_URL=http://python-service:5001
CORS_ORIGIN=https://yourdomain.com
```

### Frontend (.env.local)

```
VITE_API_URL=https://api.yourdomain.com
```

## 🔧 Architecture Decisions

### Why Python Microservice?

- Security isolation for code execution
- Easy AST-based complexity analysis
- Specialized ML capabilities for future enhancements
- Independent scaling for heavy computation

### Why Multiple Score Components?

- Comprehensive skill assessment
- Reflects real interview expectations
- Balanced weighting for diverse skills
- Adaptive feedback generation

### Why PostgreSQL?

- JSONB support (difficulty_bias, hints)
- Strong consistency for financial/commercial data
- Powerful indexing for analytics queries
- ACID compliance for transaction safety

## 🛠️ Development Workflow

1. **Create feature branch**

   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make changes** and test locally

3. **Run tests**

   ```bash
   npm test  # Frontend
   pytest    # Python
   ```

4. **Commit with clear messages**

   ```bash
   git commit -m "feat: add new feature"
   ```

5. **Push and create pull request**

## 📚 Additional Resources

- [DEPLOYMENT.md](DEPLOYMENT.md) - Full deployment guide
- Database schema: [backend/db/schema.sql](backend/db/schema.sql)
- Sample data: [backend/db/sample-data.sql](backend/db/sample-data.sql)
- Docker config: [docker-compose.yml](docker-compose.yml)

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📞 Support

For issues, questions, or suggestions:

- Create an issue on GitHub
- Contact: support@example.com

---

**Built with ❤️ for technical interviews**
