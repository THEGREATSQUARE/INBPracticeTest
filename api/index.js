const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Load question bank
let questionBank;
try {
  const possiblePaths = [
    path.join(__dirname, 'questionbank.json'),
    path.join(__dirname, '..', 'questionbank.json'),
    path.join(process.cwd(), 'questionbank.json'),
    './questionbank.json'
  ];
  
  let data;
  for (const filePath of possiblePaths) {
    try {
      data = fs.readFileSync(filePath, 'utf8');
      console.log('Found questionbank.json at:', filePath);
      break;
    } catch (err) {
      console.log('Tried path:', filePath, '- not found');
    }
  }
  
  if (!data) {
    throw new Error('Could not find questionbank.json');
  }
  
  questionBank = JSON.parse(data);
  console.log('Question bank loaded successfully with', questionBank.questions.length, 'questions');
} catch (error) {
  console.error('Error loading question bank:', error);
  questionBank = {
    meta: {
      course: "INB 300 - International Business",
      chapters: {
        "1": "Global Business",
        "2": "Institutions & Business Environment", 
        "3": "Culture, Ethics & Informal Institutions",
        "4": "Resources, Capabilities & Strategy"
      }
    },
    questions: [
      {
        id: "FALLBACK-001",
        ch: "1",
        type: "MCQ",
        q: "What is International Business?",
        opts: ["Business within one country", "Business across borders", "Only exports", "Only imports"],
        ans: "B",
        exp: "International business involves business activities across national borders."
      }
    ]
  };
}

// Store user progress
let userProgress = {
  sessions: [],
  statistics: {
    totalQuestions: 0,
    correctAnswers: 0,
    chapters: {
      '1': { attempted: 0, correct: 0 },
      '2': { attempted: 0, correct: 0 },
      '3': { attempted: 0, correct: 0 },
      '4': { attempted: 0, correct: 0 }
    }
  }
};

// API Routes
app.get('/api/questions', (req, res) => {
  res.json(questionBank.questions);
});

app.get('/api/questions/chapter/:chapter', (req, res) => {
  const chapter = req.params.chapter;
  const chapterQuestions = questionBank.questions.filter(q => q.ch === chapter);
  res.json(chapterQuestions);
});

app.get('/api/questions/random/:count', (req, res) => {
  const count = parseInt(req.params.count) || 10;
  const shuffled = [...questionBank.questions].sort(() => 0.5 - Math.random());
  res.json(shuffled.slice(0, count));
});

app.get('/api/meta', (req, res) => {
  res.json(questionBank.meta);
});

app.get('/api/statistics', (req, res) => {
  res.json(userProgress.statistics);
});

app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API is working',
    questionCount: questionBank.questions.length,
    timestamp: new Date().toISOString()
  });
});

// Serve the complete HTML page with embedded CSS and JS
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>INB 300 Study Guide</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; background-color: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1rem 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header-content { display: flex; justify-content: space-between; align-items: center; }
        .header h1 { font-size: 1.8rem; font-weight: 700; }
        .header h1 i { margin-right: 0.5rem; }
        .header-stats { display: flex; gap: 2rem; }
        .stat { text-align: center; }
        .stat-label { display: block; font-size: 0.8rem; opacity: 0.8; }
        .stat-value { display: block; font-size: 1.2rem; font-weight: 600; }
        .nav { background: white; border-bottom: 1px solid #e2e8f0; padding: 0; }
        .nav-content { display: flex; gap: 0.5rem; overflow-x: auto; }
        .nav-btn { background: none; border: none; padding: 1rem 1.5rem; cursor: pointer; color: #64748b; font-weight: 500; transition: all 0.2s; white-space: nowrap; border-bottom: 3px solid transparent; }
        .nav-btn:hover { color: #667eea; background-color: #f1f5f9; }
        .nav-btn.active { color: #667eea; border-bottom-color: #667eea; background-color: #f1f5f9; }
        .nav-btn i { margin-right: 0.5rem; }
        .main { padding: 2rem 0; min-height: calc(100vh - 140px); }
        .mode-content { display: none; }
        .mode-content.active { display: block; }
        .mode-header { margin-bottom: 2rem; }
        .mode-header h2 { font-size: 2rem; margin-bottom: 0.5rem; color: #1e293b; }
        .mode-header p { color: #64748b; margin-bottom: 1rem; }
        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .dashboard-card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .dashboard-card h2 { font-size: 1.3rem; margin-bottom: 1rem; color: #1e293b; }
        .dashboard-card h2 i { margin-right: 0.5rem; color: #667eea; }
        .chapter-buttons, .mode-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem; }
        .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 500; cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; }
        .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
        .btn-secondary { background: #64748b; color: white; }
        .btn-secondary:hover { background: #475569; }
        .btn-outline { background: transparent; color: #667eea; border: 2px solid #667eea; }
        .btn-outline:hover { background: #667eea; color: white; }
        .loading-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .loading-spinner { background: white; padding: 2rem; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .loading-spinner i { font-size: 2rem; color: #667eea; margin-bottom: 1rem; }
        @media (max-width: 768px) {
            .header-content { flex-direction: column; gap: 1rem; }
            .header-stats { gap: 1rem; }
            .nav-content { padding: 0 1rem; }
            .nav-btn { padding: 0.75rem 1rem; font-size: 0.9rem; }
            .dashboard-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div id="app">
        <header class="header">
            <div class="container">
                <div class="header-content">
                    <h1><i class="fas fa-globe"></i> INB 300 Study Guide</h1>
                    <div class="header-stats">
                        <div class="stat">
                            <span class="stat-label">Total Questions</span>
                            <span class="stat-value" id="totalQuestions">0</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Correct</span>
                            <span class="stat-value" id="correctAnswers">0</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Accuracy</span>
                            <span class="stat-value" id="accuracy">0%</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <nav class="nav">
            <div class="container">
                <div class="nav-content">
                    <button class="nav-btn active" data-mode="dashboard">
                        <i class="fas fa-home"></i> Dashboard
                    </button>
                    <button class="nav-btn" data-mode="practice">
                        <i class="fas fa-clipboard-list"></i> Practice Tests
                    </button>
                    <button class="nav-btn" data-mode="flashcards">
                        <i class="fas fa-layer-group"></i> Flashcards
                    </button>
                    <button class="nav-btn" data-mode="matching">
                        <i class="fas fa-puzzle-piece"></i> Matching
                    </button>
                    <button class="nav-btn" data-mode="chapters">
                        <i class="fas fa-book"></i> Chapter Quizzes
                    </button>
                    <button class="nav-btn" data-mode="statistics">
                        <i class="fas fa-chart-bar"></i> Statistics
                    </button>
                </div>
            </div>
        </nav>

        <main class="main">
            <div class="container">
                <div id="dashboard" class="mode-content active">
                    <div class="dashboard-grid">
                        <div class="dashboard-card">
                            <h2><i class="fas fa-rocket"></i> Quick Start</h2>
                            <p>Jump into practice with random questions from all chapters</p>
                            <button class="btn btn-primary" onclick="startQuickPractice()">
                                Start Quick Practice
                            </button>
                        </div>
                        
                        <div class="dashboard-card">
                            <h2><i class="fas fa-book"></i> Chapter Focus</h2>
                            <p>Study specific chapters in depth</p>
                            <div class="chapter-buttons">
                                <button class="btn btn-secondary" onclick="startChapterQuiz(1)">Chapter 1</button>
                                <button class="btn btn-secondary" onclick="startChapterQuiz(2)">Chapter 2</button>
                                <button class="btn btn-secondary" onclick="startChapterQuiz(3)">Chapter 3</button>
                                <button class="btn btn-secondary" onclick="startChapterQuiz(4)">Chapter 4</button>
                            </div>
                        </div>
                        
                        <div class="dashboard-card">
                            <h2><i class="fas fa-layer-group"></i> Study Modes</h2>
                            <p>Choose your preferred study method</p>
                            <div class="mode-buttons">
                                <button class="btn btn-outline" onclick="switchMode('flashcards')">
                                    <i class="fas fa-layer-group"></i> Flashcards
                                </button>
                                <button class="btn btn-outline" onclick="switchMode('matching')">
                                    <i class="fas fa-puzzle-piece"></i> Matching
                                </button>
                            </div>
                        </div>
                        
                        <div class="dashboard-card">
                            <h2><i class="fas fa-chart-line"></i> Progress</h2>
                            <p>Track your learning progress</p>
                            <p><strong>Questions Available:</strong> ${questionBank.questions.length}</p>
                            <p><strong>Chapters:</strong> ${Object.keys(questionBank.meta.chapters).length}</p>
                        </div>
                    </div>
                </div>

                <div id="practice" class="mode-content">
                    <div class="mode-header">
                        <h2><i class="fas fa-clipboard-list"></i> Practice Tests</h2>
                        <p>Practice test functionality will be loaded dynamically</p>
                    </div>
                </div>

                <div id="flashcards" class="mode-content">
                    <div class="mode-header">
                        <h2><i class="fas fa-layer-group"></i> Flashcards</h2>
                        <p>Flashcard functionality will be loaded dynamically</p>
                    </div>
                </div>

                <div id="matching" class="mode-content">
                    <div class="mode-header">
                        <h2><i class="fas fa-puzzle-piece"></i> Matching Game</h2>
                        <p>Matching game functionality will be loaded dynamically</p>
                    </div>
                </div>

                <div id="chapters" class="mode-content">
                    <div class="mode-header">
                        <h2><i class="fas fa-book"></i> Chapter Quizzes</h2>
                        <p>Chapter quiz functionality will be loaded dynamically</p>
                    </div>
                </div>

                <div id="statistics" class="mode-content">
                    <div class="mode-header">
                        <h2><i class="fas fa-chart-bar"></i> Statistics</h2>
                        <p>Statistics functionality will be loaded dynamically</p>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script>
        let currentMode = 'dashboard';

        document.addEventListener('DOMContentLoaded', function() {
            initializeApp();
            setupEventListeners();
            loadStatistics();
        });

        function initializeApp() {
            switchMode('dashboard');
            loadCourseMeta();
        }

        function setupEventListeners() {
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const mode = this.dataset.mode;
                    switchMode(mode);
                });
            });
        }

        function switchMode(mode) {
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(\`[data-mode="\${mode}"]\`).classList.add('active');
            
            document.querySelectorAll('.mode-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(mode).classList.add('active');
            
            currentMode = mode;
        }

        function startQuickPractice() {
            alert('Quick Practice - This will load practice questions dynamically');
        }

        function startChapterQuiz(chapter) {
            alert(\`Chapter \${chapter} Quiz - This will load chapter-specific questions dynamically\`);
        }

        function loadStatistics() {
            fetch('/api/statistics')
                .then(response => response.json())
                .then(stats => {
                    updateStatisticsDisplay(stats);
                })
                .catch(error => {
                    console.error('Error loading statistics:', error);
                });
        }

        function updateStatisticsDisplay(stats) {
            document.getElementById('totalQuestions').textContent = stats.totalQuestions;
            document.getElementById('correctAnswers').textContent = stats.correctAnswers;
            
            const accuracy = stats.totalQuestions > 0 ? 
                Math.round((stats.correctAnswers / stats.totalQuestions) * 100) : 0;
            document.getElementById('accuracy').textContent = accuracy + '%';
        }

        function loadCourseMeta() {
            fetch('/api/meta')
                .then(response => response.json())
                .then(meta => {
                    console.log('Course metadata loaded:', meta);
                })
                .catch(error => {
                    console.error('Error loading course metadata:', error);
                });
        }
    </script>
</body>
</html>
  `);
});

module.exports = app;
