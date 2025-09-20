const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Load question banks
let easyQuestionBank, hardQuestionBank;
let currentQuestionBank = 'easy';

// Function to load question bank from file
function loadQuestionBank(fileName, fallbackName) {
  const possiblePaths = [
    path.join(__dirname, fileName),
    path.join(__dirname, '..', fileName),
    path.join(process.cwd(), fileName),
    `./${fileName}`
  ];
  
  let data;
  for (const filePath of possiblePaths) {
    try {
      data = fs.readFileSync(filePath, 'utf8');
      console.log(`Found ${fileName} at:`, filePath);
      break;
    } catch (err) {
      console.log(`Tried path:`, filePath, '- not found');
    }
  }
  
  if (!data) {
    throw new Error(`Could not find ${fileName}`);
  }
  
  return JSON.parse(data);
}

// Load easy question bank
try {
  easyQuestionBank = loadQuestionBank('questionbank.json', 'Easy Questions');
  console.log('Easy question bank loaded successfully with', easyQuestionBank.questions.length, 'questions');
} catch (error) {
  console.error('Error loading easy question bank:', error);
  easyQuestionBank = {
    meta: {
      course: "INB 300 - International Business",
      edition: "Easy Questions",
      chapters: {
        "1": "Global Business",
        "2": "Institutions & Business Environment", 
        "3": "Culture, Ethics & Informal Institutions",
        "4": "Resources, Capabilities & Strategy"
      }
    },
    questions: [
      {
        id: "EASY-001",
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

// Load hard question bank
try {
  hardQuestionBank = loadQuestionBank('hardquestions.json', 'Hard Questions');
  console.log('Hard question bank loaded successfully with', hardQuestionBank.questions.length, 'questions');
} catch (error) {
  console.error('Error loading hard question bank:', error);
  hardQuestionBank = {
    meta: {
      course: "INB 300 - International Business",
      edition: "Hard Questions",
      chapters: {
        "1": "Global Business",
        "2": "Institutions & Business Environment", 
        "3": "Culture, Ethics & Informal Institutions",
        "4": "Resources, Capabilities & Strategy"
      }
    },
    questions: [
      {
        id: "HARD-001",
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

// Get current question bank
function getCurrentQuestionBank() {
  return currentQuestionBank === 'easy' ? easyQuestionBank : hardQuestionBank;
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
  res.json(getCurrentQuestionBank().questions);
});

app.get('/api/questions/chapter/:chapter', (req, res) => {
  const chapter = req.params.chapter;
  const chapterQuestions = getCurrentQuestionBank().questions.filter(q => q.ch === chapter);
  res.json(chapterQuestions);
});

app.get('/api/questions/random/:count', (req, res) => {
  const count = parseInt(req.params.count) || 10;
  const shuffled = [...getCurrentQuestionBank().questions].sort(() => 0.5 - Math.random());
  res.json(shuffled.slice(0, count));
});

app.get('/api/meta', (req, res) => {
  res.json(getCurrentQuestionBank().meta);
});

// Switch question bank difficulty
app.post('/api/switch-difficulty', (req, res) => {
  const { difficulty } = req.body;
  if (difficulty === 'easy' || difficulty === 'hard') {
    currentQuestionBank = difficulty;
    res.json({ 
      success: true, 
      difficulty: currentQuestionBank,
      questionCount: getCurrentQuestionBank().questions.length,
      edition: getCurrentQuestionBank().meta.edition
    });
  } else {
    res.status(400).json({ error: 'Invalid difficulty. Use "easy" or "hard"' });
  }
});

// Get current difficulty
app.get('/api/difficulty', (req, res) => {
  res.json({ 
    difficulty: currentQuestionBank,
    questionCount: getCurrentQuestionBank().questions.length,
    edition: getCurrentQuestionBank().meta.edition
  });
});

app.get('/api/statistics', (req, res) => {
  res.json(userProgress.statistics);
});

app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API is working',
    questionCount: getCurrentQuestionBank().questions.length,
    difficulty: currentQuestionBank,
    edition: getCurrentQuestionBank().meta.edition,
    timestamp: new Date().toISOString()
  });
});

// Get flashcards
app.get('/api/flashcards', (req, res) => {
  try {
    const chapter = req.query.chapter;
    let flashcards = getCurrentQuestionBank().questions;
    
    // Filter by chapter if specified
    if (chapter) {
      flashcards = flashcards.filter(q => q.ch === chapter);
    }
    
    // Convert questions to flashcard format
    const flashcardData = flashcards.map(q => ({
      front: q.q,
      back: {
        answer: q.opts ? q.opts[q.ans.charCodeAt(0) - 65] : q.ans,
        explanation: q.exp || 'No explanation available'
      }
    }));
    
    res.json(flashcardData);
  } catch (error) {
    console.error('Error loading flashcards:', error);
    res.status(500).json({ error: 'Failed to load flashcards' });
  }
});

// Get matching game data
app.get('/api/matching', (req, res) => {
  try {
    const chapter = req.query.chapter;
    let questions = getCurrentQuestionBank().questions;
    
    // Filter by chapter if specified
    if (chapter) {
      questions = questions.filter(q => q.ch === chapter);
    }
    
    // Create matching pairs from questions
    const matchingPairs = questions.slice(0, 8).map(q => ({
      term: q.q,
      definition: q.exp || 'No definition available'
    }));
    
    res.json(matchingPairs);
  } catch (error) {
    console.error('Error loading matching data:', error);
    res.status(500).json({ error: 'Failed to load matching data' });
  }
});

// Submit quiz results
app.post('/api/submit-quiz', (req, res) => {
  try {
    const { answers, timeSpent, chapter } = req.body;
    
    // Calculate score
    const totalQuestions = Object.keys(answers).length;
    const correctAnswers = Object.values(answers).filter(answer => answer.correct).length;
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    
    // Update user progress
    userProgress.statistics.totalQuestions += totalQuestions;
    userProgress.statistics.correctAnswers += correctAnswers;
    
    if (chapter && userProgress.statistics.chapters[chapter]) {
      userProgress.statistics.chapters[chapter].attempted += totalQuestions;
      userProgress.statistics.chapters[chapter].correct += correctAnswers;
    }
    
    // Store session
    userProgress.sessions.push({
      score,
      correctAnswers,
      totalQuestions,
      timeSpent,
      chapter,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      score,
      correctAnswers,
      totalQuestions,
      timeSpent,
      chapter,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// Serve the HTML page with embedded CSS and JS for Vercel
app.get('/', (req, res) => {
  try {
    // Read the HTML file
    const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Read CSS file
    const cssPath = path.join(__dirname, '..', 'public', 'css', 'style.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Read JS file
    const jsPath = path.join(__dirname, '..', 'public', 'js', 'app.js');
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    
    // Replace CSS link with embedded CSS
    htmlContent = htmlContent.replace(
      '<link rel="stylesheet" href="css/style.css">',
      `<style>${cssContent}</style>`
    );
    
    // Replace JS script with embedded JS
    htmlContent = htmlContent.replace(
      '<script src="js/app.js"></script>',
      `<script>${jsContent}</script>`
    );
    
    res.send(htmlContent);
  } catch (error) {
    console.error('Error serving main page:', error);
    res.status(500).send('Error loading page');
  }
});

module.exports = app;
