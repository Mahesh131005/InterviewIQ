# AI Code Interviewer

An AI-powered interview preparation platform that helps developers practice coding problems, receive real-time feedback, and master behavioral interview skills.

## Features

- **Coding Interview Practice**: Solve real-world coding problems with difficulty levels (Easy, Medium, Hard)
- **Solution Explanation**: Explain your approach and receive AI feedback on code quality and complexity
- **Behavioral Interview**: Practice behavioral questions with AI evaluation
- **Real-time Analytics**: Track performance across sessions with detailed insights
- **Progress Tracking**: Monitor your learning journey with comprehensive statistics
- **Dark/Light Mode**: Personalized theme preferences
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Project Structure

```
ai-code-interviewer/
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── components/      # Reusable components (Button, Input, Card, Layout)
│   │   ├── context/         # Theme and Auth context providers
│   │   ├── pages/           # Page components (Landing, Dashboard, Interviews, etc.)
│   │   ├── App.jsx          # Router configuration
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Global styles with design tokens
│   ├── vite.config.js       # Vite configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   ├── postcss.config.js    # PostCSS configuration
│   ├── index.html           # HTML template
│   └── package.json
│
├── backend/                 # Express API server
│   ├── src/
│   │   └── server.js        # Express app with all routes
│   ├── .env.example         # Environment variables template
│   └── package.json
│
├── .gitignore              # Git ignore rules
├── package.json            # Root package.json (monorepo scripts)
└── README.md               # This file
```

## Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **Zod** - Schema validation

### Backend
- **Express.js** - Web framework
- **Node.js** - Runtime environment
- **CORS** - Cross-origin resource sharing
- **Body Parser** - Request parsing

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm, yarn, or pnpm

### Installation

1. **Clone the repository and install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment variables**
   
   Backend (.env in `backend/` folder):
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env as needed
   ```

### Development

Start both frontend and backend with a single command:
```bash
npm run dev
```

Or run them separately:
```bash
# Terminal 1: Frontend
npm run dev:frontend

# Terminal 2: Backend
npm run dev:backend
```

Frontend will be available at `http://localhost:5173`
Backend will be available at `http://localhost:5000`

### Production Build

```bash
npm run build
```

This will build both frontend and backend.

## Pages & Features

### Authentication
- **Landing** - Home page with feature overview
- **Login** - User authentication
- **Register** - New user registration

### Core Features
- **Dashboard** - Overview of performance and quick statistics
- **Coding Interview** - Practice coding problems with editor
- **Explanation Submission** - Explain solution approach to interviewer
- **Behavioral Round** - Answer behavioral questions
- **Result** - Performance feedback and AI recommendations

### Analytics & Management
- **Analytics** - Detailed performance charts and insights
- **Past Sessions** - History of all interview attempts
- **Settings** - User preferences and account management

## Design System

### Color Palette
- **Primary**: `#5a7cff` (Blue)
- **Secondary**: `#9b88ff` (Purple)
- **Accent**: `#ff9580` (Orange)
- **Success**: `#10b981` (Green)
- **Warning**: `#f59e0b` (Amber)
- **Danger**: `#ef4444` (Red)
- **Background**: `#0f1419` (Dark)
- **Surface**: `#1a1f2e` (Lighter Dark)

### Typography
- **Font**: Inter (sans-serif)
- **Mono Font**: Fira Code (for code blocks)
- **Headings**: Bold, tracking-tight
- **Body**: Regular weight, 1.4-1.6 line-height

### Components
- Button (variants: primary, secondary, outline, ghost, danger)
- Input (with label and error support)
- Card (with glass effect option)
- Layout (with responsive sidebar)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Interviews
- `GET /api/interviews/problems` - Get coding problems
- `GET /api/interviews/problems/:id` - Get problem details
- `POST /api/interviews/submit` - Submit solution

### Behavioral
- `GET /api/behavioral/questions` - Get behavioral questions
- `POST /api/behavioral/evaluate` - Evaluate answers

### Analytics
- `GET /api/analytics/performance/:userId` - User performance data
- `GET /api/sessions/:userId` - User sessions
- `GET /api/sessions/:userId/:sessionId` - Session details

## Features Overview

### 🎯 Smart Problem Matching
- Curated coding problems at various difficulty levels
- Real-time code execution feedback
- Detailed complexity analysis

### 📊 Analytics Dashboard
- Track performance trends
- Category-wise mastery levels
- Time spent on each problem
- Success rate statistics

### 🤖 AI-Powered Feedback
- Code quality evaluation
- Complexity analysis
- Communication assessment
- Personalized recommendations

### 💡 Behavioral Interview
- Practice STAR method
- AI evaluation of responses
- Communication improvement tips
- Confidence building

## Deployment

### Deploy to Vercel

1. **Frontend**: Push the frontend to a GitHub repository and deploy using Vercel's Git integration
2. **Backend**: Deploy backend using Vercel Functions or a standalone Node.js hosting service

### Environment Variables
Make sure to set environment variables on your hosting platform:
- `FRONTEND_URL` - Frontend URL for CORS
- `NODE_ENV` - Production/development
- `PORT` - Server port

## Contributing

Contributions are welcome! Please follow these guidelines:
1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions, please:
- Open an issue on GitHub
- Contact the development team
- Check the documentation on our website

## Roadmap

- [ ] Integration with real LeetCode/HackerRank problems
- [ ] Video recording of explanations
- [ ] Machine learning-based difficulty prediction
- [ ] Real-time multiplayer interviews
- [ ] Integration with companies' hiring platforms
- [ ] Mobile app (iOS/Android)
- [ ] Advanced resume building
- [ ] Interview scheduling

## Acknowledgments

- Built with React, Vite, and Express
- Styled with Tailwind CSS
- Icons from Lucide React
- Charts powered by Recharts

---

**Happy practicing! Good luck with your interviews! 🚀**
