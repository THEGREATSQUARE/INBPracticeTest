const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Load question bank
let questionBank;
try {
  const data = fs.readFileSync('questionbank.json', 'utf8');
  questionBank = JSON.parse(data);
} catch (error) {
  console.error('Error loading question bank:', error);
}

// Store user progress (in production, use a database)
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

// Get all questions
app.get('/api/questions', (req, res) => {
  res.json(questionBank.questions);
});

// Get questions by chapter
app.get('/api/questions/chapter/:chapter', (req, res) => {
  const chapter = req.params.chapter;
  const chapterQuestions = questionBank.questions.filter(q => q.ch === chapter);
  res.json(chapterQuestions);
});

// Get questions by type
app.get('/api/questions/type/:type', (req, res) => {
  const type = req.params.type.toUpperCase();
  const typeQuestions = questionBank.questions.filter(q => q.type === type);
  res.json(typeQuestions);
});

// Get random questions for practice
app.get('/api/questions/random/:count', (req, res) => {
  const count = parseInt(req.params.count) || 10;
  const shuffled = [...questionBank.questions].sort(() => 0.5 - Math.random());
  res.json(shuffled.slice(0, count));
});

// Get course metadata
app.get('/api/meta', (req, res) => {
  res.json(questionBank.meta);
});

// Submit quiz results
app.post('/api/submit-quiz', (req, res) => {
  const { answers, sessionId, chapter } = req.body;
  
  let correct = 0;
  const results = [];
  
  answers.forEach(answer => {
    const question = questionBank.questions.find(q => q.id === answer.questionId);
    const isCorrect = question.ans === answer.answer;
    if (isCorrect) correct++;
    
    results.push({
      questionId: answer.questionId,
      question: question.q,
      userAnswer: answer.answer,
      correctAnswer: question.ans,
      isCorrect: isCorrect,
      explanation: question.exp
    });
  });
  
  // Update statistics
  userProgress.statistics.totalQuestions += answers.length;
  userProgress.statistics.correctAnswers += correct;
  if (chapter) {
    userProgress.statistics.chapters[chapter].attempted += answers.length;
    userProgress.statistics.chapters[chapter].correct += correct;
  }
  
  // Store session
  userProgress.sessions.push({
    id: sessionId,
    timestamp: new Date().toISOString(),
    chapter: chapter,
    totalQuestions: answers.length,
    correctAnswers: correct,
    score: Math.round((correct / answers.length) * 100),
    results: results
  });
  
  res.json({
    score: Math.round((correct / answers.length) * 100),
    correct: correct,
    total: answers.length,
    results: results
  });
});

// Get user statistics
app.get('/api/statistics', (req, res) => {
  res.json(userProgress.statistics);
});

// Get recent sessions
app.get('/api/sessions', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  res.json(userProgress.sessions.slice(-limit).reverse());
});

// Get flashcards data
app.get('/api/flashcards', (req, res) => {
  const chapter = req.query.chapter;
  let questions = questionBank.questions;
  
  if (chapter) {
    questions = questions.filter(q => q.ch === chapter);
  }
  
  const flashcards = questions.map(q => ({
    id: q.id,
    front: q.q,
    back: {
      answer: q.ans,
      explanation: q.exp,
      type: q.type,
      chapter: q.ch
    }
  }));
  
  res.json(flashcards);
});

// Get matching game data
app.get('/api/matching', (req, res) => {
  const chapter = req.query.chapter;
  let questions = questionBank.questions;
  
  if (chapter) {
    questions = questions.filter(q => q.ch === chapter);
  }
  
  // Create term-definition pairs from MCQ questions
  const matchingPairs = questions
    .filter(q => q.type === 'MCQ')
    .map(q => ({
      id: q.id,
      term: q.q,
      definition: q.exp.split(':')[0] || q.exp, // Use first part of explanation
      chapter: q.ch
    }));
  
  res.json(matchingPairs);
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export for Vercel
module.exports = app;
