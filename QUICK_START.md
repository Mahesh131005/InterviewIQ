# Quick Start Guide

## ⚡ 5-Minute Setup (Docker)

```bash
# 1. From project root, start everything
docker-compose up --build

# 2. Wait for services to be healthy (~2 min)
# Check: docker-compose ps

# 3. Access the app
# Frontend: http://localhost:5173
# Backend: http://localhost:5000
# Python: http://localhost:5001
```

## 🔧 30-Minute Local Setup (Without Docker)

### 1. PostgreSQL Database (5 min)

```bash
# Start PostgreSQL service
# Windows: Services app or PostgreSQL start
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Create database
psql -U postgres
CREATE DATABASE coding_interview;
\q

# Load schema
psql -U postgres -d coding_interview -f backend/db/schema.sql
psql -U postgres -d coding_interview -f backend/db/sample-data.sql
```

### 2. Backend (8 min)

```bash
cd backend

# Setup environment
cp .env.example .env
# Edit .env - change DB_PASSWORD to match your PostgreSQL password

# Install & run
npm install
npm run dev
# Runs on http://localhost:5000
```

### 3. Python Service (5 min)

```bash
cd python-service

# Create & activate virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# Install & run
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5001
```

### 4. Frontend (5 min)

```bash
cd frontend

npm install
npm run dev
# Runs on http://localhost:5173
```

## 🧪 Testing the System

### 1. Create User Account

```bash
# In browser: http://localhost:5173/register
# Fill in: name, email, password
# Redirect to dashboard
```

### 2. Start Interview

```bash
# Click "Start Interview"
# Select company (e.g., "Google")
# Get first question
```

### 3. Submit Code

```
Question: Two Sum
Language: Python
Code:
  def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
      complement = target - num
      if complement in seen:
        return [seen[complement], i]
      seen[num] = i
    return []

Explanation:
  I used a hash map to store seen numbers. For each number,
  I calculate the complement needed and check if it's already
  in the map. This gives O(n) time complexity.
```

### 4. Check Results

- See: Correctness Score, Efficiency Score, Explanation Score
- Test Cases: Passed/Total
- Feedback from analysis

### 5. View Analytics

```bash
# Dashboard shows:
- Overall average score
- Topic performance
- Weak topics
- Company performance
- Score history
```

## 📋 File Structure Reference

```
backend/
  ├── src/
  │   ├── server.js          ← Main Express app
  │   ├── db.js              ← Database connection
  │   ├── controllers/       ← Business logic
  │   ├── routes/            ← API endpoints
  │   ├── models/            ← Database queries
  │   ├── middleware/        ← Auth, error handling
  │   └── utils/             ← Helpers, scoring
  └── db/
      └── schema.sql         ← Database tables

python-service/
  ├── app.py                 ← Flask application
  ├── executor.py            ← Code execution
  ├── complexity_analyzer.py ← Complexity detection
  └── evaluator.py           ← Scoring logic

frontend/
  └── src/
      ├── services/api.js    ← ⚠️ Update this for new endpoints
      ├── pages/
      ├── components/
      └── ...
```

## 🔐 Login Credentials (Sample)

When testing with seed data:

```
Email: test@example.com
Password: Test123@
```

(Create your own account instead - no default user in seed)

## 🐛 Troubleshooting

### PostgreSQL Connection Failed

```
Error: ECONNREFUSED 127.0.0.1:5432

Fix:
1. Check PostgreSQL is running: pg_isready
2. Verify credentials in backend/.env
3. Verify database exists: psql -U postgres -l
```

### Python Service Won't Start

```
Error: ModuleNotFoundError

Fix:
1. Activate venv: venv\Scripts\activate
2. Reinstall: pip install -r requirements.txt
3. Check Python 3.11+: python --version
```

### Port Already in Use

```
Error: EADDRINUSE :::5000

Fix:
# Find process using port 5000
netstat -tlnp | grep:5000  # Linux
lsof -i :5000              # Mac
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess  # Windows

# Kill the process
kill -9 <PID>              # Linux/Mac
taskkill /PID <PID> /F     # Windows
```

### CORS Errors

```
Error: Cross-Origin Request Blocked

Fix:
Check backend/.env:
CORS_ORIGIN=http://localhost:5173
CORS_ORIGIN=http://localhost:3000

Restart backend: npm run dev
```

## 📊 Database Quick Reference

### View All Users

```sql
psql -U postgres -d coding_interview
SELECT id, name, email FROM users;
```

### View All Companies

```sql
SELECT id, name, difficulty_bias FROM companies;
```

### View Interview History

```sql
SELECT i.id, u.name, c.name, i.overall_score, i.created_at
FROM interviews i
JOIN users u ON i.user_id = u.id
JOIN companies c ON i.company_id = c.id
ORDER BY i.created_at DESC;
```

### View Submissions

```sql
SELECT s.id, q.title, s.language, s.correctness_score, s.passed_testcases
FROM submissions s
JOIN questions q ON s.question_id = q.id
ORDER BY s.created_at DESC;
```

## 🚀 Deployment

### For production:

See [DEPLOYMENT.md](../DEPLOYMENT.md)

### Quick production checklist:

- [ ] Change JWT_SECRET to strong random value
- [ ] Change DB_PASSWORD to strong value
- [ ] Set NODE_ENV=production
- [ ] Update CORS_ORIGIN to actual domain
- [ ] Setup SSL/TLS with Nginx
- [ ] Setup database backups
- [ ] Setup monitoring/logging
- [ ] Use PM2 for process management

## 📚 Documentation

- **BACKEND_README.md** - Architecture & features
- **DEPLOYMENT.md** - Full deployment guide
- **BACKEND_IMPLEMENTATION.md** - Technical implementation details
- **backend/db/schema.sql** - Database structure
- **OpenAPI/Postman collection** - (Create for API testing)

## 🔄 Development Workflow

### Make a Change

```bash
# 1. Edit code in backend/src/
# 2. Save - auto-reload via nodemon
# 3. Test in http://localhost:5000/api/health
```

### Update Database

```bash
# 1. Create new migration file
# 2. Run: psql -U postgres -d coding_interview -f migration.sql
# 3. Test queries work
```

### Add New API Endpoint

```bash
# 1. Add controller method in backend/src/controllers/
# 2. Add route in backend/src/routes/
# 3. Mount route in backend/src/server.js
# 4. Test endpoint with curl or Postman
```

## 📞 API Testing

### Health Check

```bash
curl http://localhost:5000/api/health
```

### Get Companies

```bash
curl http://localhost:5000/api/companies
```

### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123",
    "confirmPassword": "TestPass123"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

## ✅ Verification Checklist

- [ ] All 3 services running (frontend, backend, python)
- [ ] PostgreSQL database initialized
- [ ] Can register new account
- [ ] Can login with account
- [ ] Can start interview
- [ ] Can see questions
- [ ] Can submit code
- [ ] Scores calculated
- [ ] Analytics dashboard works
- [ ] Docker compose runs all services

## 🎓 Next Steps

1. **Frontend Integration**
   - Update api.js service (already started)
   - Create CompanySelection page
   - Wire up interview flow
   - Display results & analytics

2. **Testing**
   - Add test cases for each controller
   - Add Python service tests
   - Add frontend component tests

3. **Enhancements**
   - Real LLM integration (GPT-4, Claude)
   - Live collaboration for pair interviews
   - Video recording/playback
   - Interview templates by company
   - Difficulty calibration

4. **Production**
   - Database backups
   - Monitoring & alerting
   - Load testing
   - CDN for frontend
   - API rate limiting tuning

## 🆘 Need Help?

Check logs:

```bash
# Backend
docker-compose logs backend

# Python
docker-compose logs python-service

# Database
docker-compose logs postgres

# Frontend (in browser console)
F12 → Console tab
```

---

**You're all set! Start with `docker-compose up --build` and celebrate! 🎉**
