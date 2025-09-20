# INB 300 Study Guide Website

A comprehensive, interactive study guide website for INB 300 International Business course. This application provides multiple study modes including practice tests, flashcards, matching games, and chapter-specific quizzes to help you ace your exam.

## 🚀 Features

### 📚 Study Modes
- **Practice Tests**: Customizable quizzes with multiple choice and true/false questions
- **Flashcards**: Interactive card-based learning with explanations
- **Matching Game**: Drag-and-drop style term-definition matching
- **Chapter Quizzes**: Focused practice on specific chapters
- **Random Questions**: Mixed practice from all chapters

### 📊 Progress Tracking
- Real-time statistics and performance metrics
- Chapter-wise progress tracking
- Study session history
- Accuracy percentages and improvement tracking

### 🎯 Question Bank
- **140+ Questions** covering all 4 chapters
- Multiple choice questions (MCQ)
- True/False questions
- Detailed explanations for each answer
- Chapter-specific filtering

### 📱 Responsive Design
- Mobile-friendly interface
- Modern, clean UI design
- Intuitive navigation
- Progress visualization

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone or Download** the project files to your local machine

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

4. **Open in Browser**
   Navigate to `http://localhost:3000` in your web browser

### Development Mode
For development with auto-restart on file changes:
```bash
npm run dev
```

## 📖 Usage Guide

### Getting Started
1. **Dashboard**: Start here for an overview of your progress and quick access to all study modes
2. **Quick Practice**: Jump into a 10-question random quiz to warm up
3. **Chapter Focus**: Select specific chapters to study in depth

### Study Modes Explained

#### 🧪 Practice Tests
- Choose chapter, question type, and number of questions
- Navigate through questions with Previous/Next buttons
- Submit when complete to see detailed results
- Review explanations for each question

#### 🃏 Flashcards
- Click cards to flip between question and answer
- Mark cards as "Got it!" or "Need more practice"
- Navigate through cards with Previous/Next buttons
- Filter by chapter for focused study

#### 🧩 Matching Game
- Match terms with their definitions
- Click to select items, automatic matching when pairs are found
- Timer tracks your speed
- Complete all matches to finish the game

#### 📖 Chapter Quizzes
- Dedicated quizzes for each of the 4 chapters:
  - **Chapter 1**: Global Business
  - **Chapter 2**: Institutions & Business Environment  
  - **Chapter 3**: Culture, Ethics & Informal Institutions
  - **Chapter 4**: Resources, Capabilities & Strategy

#### 📈 Statistics
- View overall performance metrics
- Track progress by chapter
- Review recent study sessions
- Monitor accuracy improvements

## 📚 Course Content Coverage

### Chapter 1: Global Business
- International vs. Global Business definitions
- Multinational Enterprises (MNEs) and FDI
- Globalization concepts and debates
- Risk management and scenario planning
- BRIC/BRICS economies
- Base of the Pyramid (BoP)

### Chapter 2: Institutions & Business Environment
- Institution-based view of business
- Political systems (Democracy, Totalitarianism, Authoritarianism)
- Legal systems (Civil Law, Common Law, Theocratic Law)
- Economic systems (Market, Command, Mixed)
- Property rights and intellectual property
- State-owned enterprises and state capitalism

### Chapter 3: Culture, Ethics & Informal Institutions
- Cultural dimensions (Hofstede's framework)
- High-context vs. Low-context cultures
- Ethics in international business
- Corruption and FCPA
- Cultural intelligence
- Ethical decision-making frameworks

### Chapter 4: Resources, Capabilities & Strategy
- Resource-based view
- VRIO framework (Value, Rarity, Imitability, Organization)
- Value chain analysis
- Outsourcing decisions (Offshoring, Onshoring, Captive sourcing)
- Dynamic capabilities
- 3D printing and additive manufacturing

## 🎯 Study Tips

### Effective Study Strategies
1. **Start with Flashcards**: Use flashcards to familiarize yourself with key terms and concepts
2. **Practice Tests**: Take practice tests regularly to identify knowledge gaps
3. **Chapter Focus**: Study one chapter at a time for deeper understanding
4. **Review Mistakes**: Always review incorrect answers and their explanations
5. **Track Progress**: Monitor your statistics to see improvement over time

### Recommended Study Flow
1. **Initial Learning**: Use flashcards to learn new concepts
2. **Practice**: Take chapter-specific quizzes
3. **Assessment**: Complete full practice tests
4. **Review**: Use matching games to reinforce learning
5. **Final Prep**: Take random question tests to simulate exam conditions

## 🔧 Technical Details

### File Structure
```
INBstudyguide/
├── package.json          # Project dependencies and scripts
├── server.js             # Express server and API endpoints
├── questionbank.json     # Question database
├── public/               # Frontend files
│   ├── index.html        # Main HTML file
│   ├── css/
│   │   └── style.css     # Styling and responsive design
│   ├── js/
│   │   └── app.js        # Frontend JavaScript functionality
│   └── images/           # Image assets (if any)
└── README.md             # This file
```

### API Endpoints
- `GET /api/questions` - Get all questions
- `GET /api/questions/chapter/:chapter` - Get questions by chapter
- `GET /api/questions/type/:type` - Get questions by type
- `GET /api/questions/random/:count` - Get random questions
- `GET /api/flashcards` - Get flashcard data
- `GET /api/matching` - Get matching game data
- `POST /api/submit-quiz` - Submit quiz results
- `GET /api/statistics` - Get user statistics
- `GET /api/sessions` - Get recent study sessions

## 🚀 Getting Ready for Your Exam

### Pre-Exam Checklist
- [ ] Complete practice tests for all chapters
- [ ] Review flashcards for key terms
- [ ] Achieve 80%+ accuracy on practice tests
- [ ] Complete matching games for each chapter
- [ ] Review statistics to identify weak areas
- [ ] Take final random question tests

### Exam Day Tips
- Review flashcards 30 minutes before the exam
- Focus on chapters where your accuracy is lowest
- Trust your preparation and stay confident
- Read questions carefully and eliminate obviously wrong answers
- Use the process of elimination for multiple choice questions

## 🆘 Troubleshooting

### Common Issues

**Server won't start**
- Ensure Node.js is installed: `node --version`
- Check if port 3000 is available
- Try running: `npm install` to ensure all dependencies are installed

**Questions not loading**
- Check browser console for errors
- Ensure `questionbank.json` is in the root directory
- Verify server is running on `http://localhost:3000`

**Progress not saving**
- Progress is stored in memory and resets when server restarts
- For persistent storage, consider implementing a database

### Browser Compatibility
- Chrome (recommended)
- Firefox
- Safari
- Edge

## 📝 License

This project is created for educational purposes. Feel free to modify and adapt for your study needs.

## 🤝 Contributing

This is a personal study tool, but suggestions for improvements are welcome!

---

**Good luck with your INB 300 exam! 🎓**

*Remember: Consistent practice and regular review are key to success. Use this tool regularly in the weeks leading up to your exam for the best results.*
