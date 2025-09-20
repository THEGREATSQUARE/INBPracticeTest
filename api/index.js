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

// Get flashcards
app.get('/api/flashcards', (req, res) => {
  try {
    const chapter = req.query.chapter;
    let flashcards = questionBank.questions;
    
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
    let questions = questionBank.questions;
    
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
