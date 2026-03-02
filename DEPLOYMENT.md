# AI Code Interviewer - Deployment & Setup Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│              (Port 5173 - Vite Dev Server)                  │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           Backend (Node.js + Express)                       │
│              (Port 5000 - Main API)                         │
├─────────────────────────────────────────────────────────────┤
│  - Authentication & JWT                                     │
│  - Company Management                                       │
│  - Interview Flow Control                                   │
│  - Submission Handling                                      │
│  - Analytics & Tracking                                     │
└────────────────┬──────────────────────┬─────────────────────┘
                 │                      │
        HTTP/REST API          HTTP/REST API
                 │                      │
        ┌────────▼────────┐    ┌────────▼────────┐
        │   PostgreSQL    │    │  Python Service │
        │      (5432)     │    │     (5001)      │
        └─────────────────┘    ├─────────────────┤
                               │ - Code Executor │
                               │ - Complexity    │
                               │   Analysis      │
                               │ - Explanation   │
                               │   Evaluation    │
                               │ - Behavioral    │
                               │   Scoring       │
                               └─────────────────┘
```

## Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Docker & Docker Compose (optional but recommended)
- Git

## Quick Start (Local Development)

### 1. Setup PostgreSQL Database

```bash
# On Windows with PostgreSQL installed:
psql -U postgres

# Create database
CREATE DATABASE coding_interview;

# Exit psql
\q

# Run schema
psql -U postgres -d coding_interview -f backend/db/schema.sql
psql -U postgres -d coding_interview -f backend/db/sample-data.sql
```

### 2. Backend Setup

```bash
cd backend

# Copy .env file
cp .env.example .env

# Edit .env with your PostgreSQL credentials
nano .env  # or use VS Code

# Install dependencies
npm install

# Run development server
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Python Microservice Setup

```bash
cd python-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run Flask app
python app.py
```

Python service runs on `http://localhost:5001`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local (optional)
echo "VITE_API_URL=http://localhost:5000/api" > .env.local

# Run development server
npm run dev
```

Frontend runs on `http://localhost:5173`

## Docker Setup (Recommended)

### Build and Run with Docker Compose

```bash
# From project root

# Create .env file at root
cp backend/.env.example .env

# Edit .env with desired configuration
nano .env

# Build and start all services
docker-compose up --build

# Alternatively, run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services will be available at:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Python Service: http://localhost:5001
- PostgreSQL: localhost:5432

### Database Migration with Docker

```bash
# Initialize database
docker-compose exec postgres psql -U postgres -d coding_interview -f /docker-entrypoint-initdb.d/01-schema.sql

# Load sample data
docker-compose exec postgres psql -U postgres -d coding_interview -f backend/db/sample-data.sql
```

## Environment Configuration

### Backend (.env)

```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coding_interview
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET=your_really_secret_key_change_this_in_production
JWT_EXPIRY=7d
PYTHON_SERVICE_URL=http://localhost:5001
CODE_EXECUTION_TIMEOUT=2000
CODE_MEMORY_LIMIT=256m
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=debug
```

### Frontend (.env.local)

```
VITE_API_URL=http://localhost:5000/api
```

### Python Service

Set via environment variables:

- `PORT=5001`
- `CODE_TIMEOUT=2000`
- `MEMORY_LIMIT=256`
- `DEBUG=False`

## API Endpoints Summary

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Company Endpoints

- `GET /api/companies` - Get all companies
- `GET /api/companies/:companyId` - Get company details
- `GET /api/companies/:companyId/questions` - Get company questions

### Interview Endpoints

- `POST /api/interviews` - Start new interview
- `GET /api/interviews/:interviewId` - Get interview details
- `GET /api/interviews/:interviewId/next-question` - Get next question
- `GET /api/interviews/:interviewId/questions` - Get all interview questions
- `GET /api/interviews/history` - Get user interview history
- `POST /api/interviews/:interviewId/complete` - Complete interview

### Submission Endpoints

- `POST /api/submissions/code` - Submit code solution
- `POST /api/submissions/behavioral` - Submit behavioral response
- `GET /api/submissions/:submissionId` - Get submission details
- `GET /api/submissions/interview/:interviewId` - Get all interview submissions

### Analytics Endpoints

- `GET /api/analytics/dashboard` - Get user analytics
- `GET /api/analytics/topic/:topic` - Get topic-specific analytics
- `GET /api/analytics/company/:companyId` - Get company-specific analytics
- `GET /api/analytics/comparison` - Get performance comparison

## Code Execution Security

- All code executes in isolated processes with:
  - 2-second timeout
  - 256MB memory limit
  - No network access
  - No file system access to sensitive areas
- Supported languages: C++, Python, Java
- All output is captured and sanitized

## Deploying to Vercel

### Prerequisites

- Vercel account (https://vercel.com)
- GitHub account with repository push access
- Node.js environment variables configured

### Frontend Deployment

1. **Push your code to GitHub**

   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import project in Vercel**
   - Go to https://vercel.com/new
   - Select your GitHub repository
   - Configure build settings:
     - **Build Command**: `cd frontend && npm run build`
     - **Output Directory**: `frontend/dist`
     - **Install Command**: `npm install`

3. **Add Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add `VITE_API_URL` pointing to your backend API URL

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

### Backend Deployment

#### Option 1: Deploy to Vercel Functions (Serverless)

1. **Update package.json in backend**

   ```json
   {
     "scripts": {
       "build": "echo 'Backend ready'",
       "start": "node src/server.js"
     }
   }
   ```

2. **Create vercel.json in root**

   ```json
   {
     "functions": {
       "backend/src/server.js": {
         "runtime": "nodejs18.x"
       }
     }
   }
   ```

3. **Deploy using Vercel CLI**
   ```bash
   npm install -g vercel
   vercel
   ```

#### Option 2: Deploy to Railway/Render (Recommended for full Node.js server)

**Railway.app:**

1. Push code to GitHub
2. Go to https://railway.app
3. Create new project → Import from GitHub
4. Select your repository
5. Add environment variables:
   - `NODE_ENV=production`
   - `PORT=5000`
6. Railway automatically detects package.json and starts server

**Render.com:**

1. Go to https://render.com
2. Create new Web Service
3. Connect GitHub repository
4. Configure:
   - **Build Command**: `npm install && cd backend && npm install`
   - **Start Command**: `node backend/src/server.js`
5. Add environment variables
6. Deploy

#### Option 3: Deploy to AWS, GCP, or DigitalOcean

These require more configuration. Use Docker for containerization:

1. **Create Dockerfile**

   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   EXPOSE 5000
   CMD ["node", "backend/src/server.js"]
   ```

2. Push to your cloud provider and deploy

## Environment Variables

### Frontend (`frontend/.env.local`)

```
VITE_API_URL=https://your-backend-url.com/api
```

### Backend (`backend/.env`)

```
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-url.com
```

## Database Setup (Optional)

If you want to add a real database:

### PostgreSQL + Prisma

1. **Install Prisma**

   ```bash
   cd backend
   npm install @prisma/client
   npm install -D prisma
   ```

2. **Initialize Prisma**

   ```bash
   npx prisma init
   ```

3. **Update .env with database URL**

   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/ai_interviewer"
   ```

4. **Define models in schema.prisma**

5. **Run migrations**
   ```bash
   npx prisma migrate dev
   ```

### MongoDB + Mongoose

1. **Install Mongoose**

   ```bash
   cd backend
   npm install mongoose
   ```

2. **Add MongoDB connection**

   ```javascript
   import mongoose from "mongoose";

   mongoose.connect(process.env.MONGODB_URI);
   ```

## Performance Optimization

### Frontend

- Enable compression
- Optimize images
- Minimize bundle size
- Enable caching headers

### Backend

- Add rate limiting
- Implement caching (Redis)
- Use compression middleware
- Monitor performance

## SSL/HTTPS

Both Vercel and Railway provide free SSL certificates automatically.

For custom domains:

1. Add domain in service settings
2. Update DNS records as instructed
3. SSL certificate auto-provisions (within 24-48 hours)

## Monitoring & Logging

### Vercel

- Built-in analytics and logs
- Real-time error tracking
- Performance metrics

### Backend (if self-hosted)

- Use Winston or Morgan for logging
- Integrate with Sentry for error tracking
- Set up uptime monitoring (UptimeRobot)

## Rollback

If deployment fails:

**Vercel:**

- Dashboard → Deployments → Select previous version → Redeploy

**Railway/Render:**

- Dashboard → Recent Deployments → Redeploy previous

## Common Issues

### CORS Errors

- Verify `FRONTEND_URL` matches your frontend domain
- Check browser console for exact error
- Ensure API calls use correct endpoint

### 404 on Frontend Routes

- Vercel automatically handles SPA routing
- For custom hosting, configure rewrites to serve index.html

### API Timeouts

- Check backend logs
- Verify database connections
- Monitor server resources

### Build Failures

- Check build logs for specific errors
- Verify all dependencies are in package.json
- Ensure Node.js version compatibility (14+)

## Next Steps

1. Set up monitoring and alerting
2. Implement database for persistent storage
3. Add automated tests and CI/CD pipeline
4. Set up backup and disaster recovery
5. Monitor costs and optimize resource usage

## Support

For issues with specific platforms:

- **Vercel**: https://vercel.com/support
- **Railway**: https://railway.app/support
- **Render**: https://render.com/support

---

Happy deploying! 🚀
