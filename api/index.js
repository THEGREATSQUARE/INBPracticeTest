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

// Serve the original HTML page
app.get('/', (req, res) => {
  try {
    const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
    res.sendFile(htmlPath);
  } catch (error) {
    console.error('Error serving main page:', error);
    res.status(500).send('Error loading page');
  }
});

module.exports = app;
