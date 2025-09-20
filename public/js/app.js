// Global variables
let currentMode = 'dashboard';
let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let testStartTime;
let testTimer;
let currentFlashcards = [];
let currentFlashcardIndex = 0;
let currentMatchingPairs = [];
let selectedMatchingItems = [];
let matchingMatches = 0;
let matchingStartTime;
let matchingTimer;
let currentDifficulty = 'easy';

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadStatistics();
});

function initializeApp() {
    // Set initial mode
    switchMode('dashboard');
    
    // Load course metadata
    loadCourseMeta();
    
    // Load current difficulty
    loadCurrentDifficulty();
}

function setupEventListeners() {
    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const mode = this.dataset.mode;
            switchMode(mode);
        });
    });
    
    // Form inputs
    document.getElementById('practiceChapter')?.addEventListener('change', updatePracticeOptions);
    document.getElementById('practiceType')?.addEventListener('change', updatePracticeOptions);
    document.getElementById('practiceCount')?.addEventListener('input', updatePracticeOptions);
}

function switchMode(mode) {
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.mode-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(mode).classList.add('active');
    
    currentMode = mode;
    
    // Load mode-specific data
    if (mode === 'statistics') {
        loadStatistics();
    }
}

// Dashboard functions
function startQuickPractice() {
    showLoading();
    fetch('/api/questions/random/10')
        .then(response => response.json())
        .then(questions => {
            hideLoading();
            startPracticeTest(questions);
        })
        .catch(error => {
            hideLoading();
            console.error('Error loading questions:', error);
        });
}

function startChapterQuiz(chapter) {
    showLoading();
    fetch(`/api/questions/chapter/${chapter}`)
        .then(response => response.json())
        .then(questions => {
            hideLoading();
            startPracticeTest(questions);
        })
        .catch(error => {
            hideLoading();
            console.error('Error loading chapter questions:', error);
        });
}

// Practice Test functions
function startPracticeTest(questions = null) {
    if (questions) {
        currentQuestions = questions;
    } else {
        const chapter = document.getElementById('practiceChapter').value;
        const type = document.getElementById('practiceType').value;
        const count = parseInt(document.getElementById('practiceCount').value) || 10;
        
        let url = `/api/questions/random/${count}`;
        if (chapter) {
            url = `/api/questions/chapter/${chapter}`;
        }
        
        showLoading();
        fetch(url)
            .then(response => response.json())
            .then(data => {
                hideLoading();
                let filteredQuestions = data;
                if (type) {
                    filteredQuestions = data.filter(q => q.type === type);
                }
                if (count && filteredQuestions.length > count) {
                    filteredQuestions = filteredQuestions.slice(0, count);
                }
                currentQuestions = filteredQuestions;
                displayPracticeTest();
            })
            .catch(error => {
                hideLoading();
                console.error('Error loading questions:', error);
            });
        return;
    }
    
    displayPracticeTest();
}

function displayPracticeTest() {
    // Switch to practice mode
    switchMode('practice');
    
    // Show test container
    document.getElementById('practiceTest').style.display = 'block';
    document.getElementById('testResults').style.display = 'none';
    
    // Reset test state
    currentQuestionIndex = 0;
    userAnswers = {};
    testStartTime = Date.now();
    
    // Start timer
    startTestTimer();
    
    // Display first question
    displayQuestion();
}

function displayQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    const testContent = document.getElementById('testContent');
    
    // Update progress
    document.getElementById('testProgress').textContent = 
        `Question ${currentQuestionIndex + 1} of ${currentQuestions.length}`;
    document.getElementById('testProgressBar').style.width = 
        `${((currentQuestionIndex + 1) / currentQuestions.length) * 100}%`;
    
    // Display question
    testContent.innerHTML = `
        <div class="question">
            <h3>${question.q}</h3>
            <div class="question-options">
                ${generateQuestionOptions(question)}
            </div>
        </div>
    `;
    
    // Set current answer if exists
    if (userAnswers[question.id]) {
        const selectedOption = document.querySelector(`input[value="${userAnswers[question.id]}"]`);
        if (selectedOption) {
            selectedOption.checked = true;
            selectedOption.parentElement.classList.add('selected');
        }
    }
    
    // Update navigation buttons
    updateNavigationButtons();
    
    // Add option click handlers
    document.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', function() {
            const input = this.querySelector('input');
            input.checked = true;
            
            // Update visual state
            document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            
            // Store answer
            userAnswers[question.id] = input.value;
        });
    });
}

function generateQuestionOptions(question) {
    if (question.type === 'MCQ') {
        return question.opts.map((opt, index) => `
            <label class="option">
                <input type="radio" name="question_${question.id}" value="${String.fromCharCode(65 + index)}">
                <span>${String.fromCharCode(65 + index)}) ${opt}</span>
            </label>
        `).join('');
    } else if (question.type === 'TF') {
        return `
            <label class="option">
                <input type="radio" name="question_${question.id}" value="True">
                <span>True</span>
            </label>
            <label class="option">
                <input type="radio" name="question_${question.id}" value="False">
                <span>False</span>
            </label>
        `;
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    prevBtn.disabled = currentQuestionIndex === 0;
    
    if (currentQuestionIndex === currentQuestions.length - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-flex';
    } else {
        nextBtn.style.display = 'inline-flex';
        submitBtn.style.display = 'none';
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

function nextQuestion() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
}

function submitTest() {
    // Stop timer
    clearInterval(testTimer);
    
    // Prepare answers
    const answers = Object.keys(userAnswers).map(questionId => ({
        questionId: questionId,
        answer: userAnswers[questionId]
    }));
    
    // Submit results
    fetch('/api/submit-quiz', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            answers: answers,
            sessionId: generateSessionId(),
            chapter: document.getElementById('practiceChapter').value || null
        })
    })
    .then(response => response.json())
    .then(results => {
        displayTestResults(results);
        updateStatistics();
    })
    .catch(error => {
        console.error('Error submitting quiz:', error);
    });
}

function displayTestResults(results) {
    const resultsContainer = document.getElementById('testResults');
    const testContainer = document.getElementById('practiceTest');
    
    testContainer.style.display = 'none';
    resultsContainer.style.display = 'block';
    
    // Determine score class
    let scoreClass = 'score-poor';
    if (results.score >= 90) scoreClass = 'score-excellent';
    else if (results.score >= 80) scoreClass = 'score-good';
    else if (results.score >= 70) scoreClass = 'score-fair';
    
    resultsContainer.innerHTML = `
        <div class="results-header">
            <div class="score-circle ${scoreClass}">
                ${results.score}%
            </div>
            <h2>Test Complete!</h2>
            <p>You scored ${results.correct} out of ${results.total} questions correctly.</p>
        </div>
        
        <div class="results-summary">
            <div class="result-item">
                <div class="number">${results.correct}</div>
                <div class="label">Correct</div>
            </div>
            <div class="result-item">
                <div class="number">${results.total - results.correct}</div>
                <div class="label">Incorrect</div>
            </div>
            <div class="result-item">
                <div class="number">${results.score}%</div>
                <div class="label">Score</div>
            </div>
            <div class="result-item">
                <div class="number">${Math.round((Date.now() - testStartTime) / 1000)}s</div>
                <div class="label">Time</div>
            </div>
        </div>
        
        <div class="question-review">
            <h3>Question Review</h3>
            ${results.results.map(result => `
                <div class="review-item ${result.isCorrect ? 'correct' : 'incorrect'}">
                    <div class="review-question">
                        <strong>${result.question}</strong>
                    </div>
                    <div class="review-answers">
                        <span class="user-answer ${result.isCorrect ? 'correct' : 'incorrect'}">
                            Your answer: ${result.userAnswer}
                        </span>
                        ${!result.isCorrect ? `<span class="correct-answer">Correct answer: ${result.correctAnswer}</span>` : ''}
                    </div>
                    <div class="review-explanation">
                        ${result.explanation}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="results-actions">
            <button class="btn btn-primary" onclick="startPracticeTest()">
                <i class="fas fa-redo"></i> Try Again
            </button>
            <button class="btn btn-secondary" onclick="switchMode('dashboard')">
                <i class="fas fa-home"></i> Back to Dashboard
            </button>
        </div>
    `;
}

function startTestTimer() {
    testTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - testStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('testTimer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// Flashcard functions
function startFlashcards() {
    const chapter = document.getElementById('flashcardChapter').value;
    
    let url = '/api/flashcards';
    if (chapter) {
        url += `?chapter=${chapter}`;
    }
    
    showLoading();
    fetch(url)
        .then(response => response.json())
        .then(flashcards => {
            hideLoading();
            currentFlashcards = flashcards;
            currentFlashcardIndex = 0;
            displayFlashcards();
        })
        .catch(error => {
            hideLoading();
            console.error('Error loading flashcards:', error);
        });
}

function displayFlashcards() {
    document.getElementById('flashcardContainer').style.display = 'block';
    displayCurrentFlashcard();
}

function displayCurrentFlashcard() {
    const flashcard = currentFlashcards[currentFlashcardIndex];
    
    document.getElementById('flashcardQuestion').textContent = flashcard.front;
    document.getElementById('flashcardAnswer').textContent = flashcard.back.answer;
    document.getElementById('flashcardExplanation').textContent = flashcard.back.explanation;
    
    // Reset flip state
    document.querySelector('.flashcard-inner').classList.remove('flipped');
    
    // Update progress
    document.getElementById('flashcardProgress').textContent = 
        `${currentFlashcardIndex + 1} of ${currentFlashcards.length}`;
    
    // Add click handler for flipping
    const flashcardInner = document.querySelector('.flashcard-inner');
    flashcardInner.onclick = function() {
        this.classList.toggle('flipped');
    };
}

function previousFlashcard() {
    if (currentFlashcardIndex > 0) {
        currentFlashcardIndex--;
        displayCurrentFlashcard();
    }
}

function nextFlashcard() {
    if (currentFlashcardIndex < currentFlashcards.length - 1) {
        currentFlashcardIndex++;
        displayCurrentFlashcard();
    }
}

function markFlashcardCorrect() {
    // Add visual feedback
    const flashcard = document.querySelector('.flashcard-inner');
    flashcard.style.border = '3px solid #10b981';
    
    setTimeout(() => {
        flashcard.style.border = '';
        nextFlashcard();
    }, 500);
}

function markFlashcardIncorrect() {
    // Add visual feedback
    const flashcard = document.querySelector('.flashcard-inner');
    flashcard.style.border = '3px solid #ef4444';
    
    setTimeout(() => {
        flashcard.style.border = '';
        // Show answer
        flashcard.classList.add('flipped');
    }, 500);
}

// Matching Game functions
function startMatching() {
    const chapter = document.getElementById('matchingChapter').value;
    
    let url = '/api/matching';
    if (chapter) {
        url += `?chapter=${chapter}`;
    }
    
    showLoading();
    fetch(url)
        .then(response => response.json())
        .then(pairs => {
            hideLoading();
            currentMatchingPairs = pairs.slice(0, 10); // Limit to 10 pairs
            setupMatchingGame();
        })
        .catch(error => {
            hideLoading();
            console.error('Error loading matching pairs:', error);
        });
}

function setupMatchingGame() {
    document.getElementById('matchingContainer').style.display = 'block';
    
    // Reset game state
    selectedMatchingItems = [];
    matchingMatches = 0;
    matchingStartTime = Date.now();
    
    // Shuffle pairs
    const shuffledPairs = [...currentMatchingPairs].sort(() => Math.random() - 0.5);
    const shuffledDefinitions = [...currentMatchingPairs].sort(() => Math.random() - 0.5);
    
    // Display terms
    const termsContainer = document.getElementById('matchingTerms');
    termsContainer.innerHTML = shuffledPairs.map((pair, index) => `
        <div class="matching-item" data-id="${pair.id}" onclick="selectMatchingItem(this, 'term')">
            ${pair.term}
        </div>
    `).join('');
    
    // Display definitions
    const definitionsContainer = document.getElementById('matchingDefinitions');
    definitionsContainer.innerHTML = shuffledDefinitions.map((pair, index) => `
        <div class="matching-item" data-id="${pair.id}" onclick="selectMatchingItem(this, 'definition')">
            ${pair.definition}
        </div>
    `).join('');
    
    // Start timer
    startMatchingTimer();
    
    // Update score
    updateMatchingScore();
}

function selectMatchingItem(element, type) {
    if (element.classList.contains('matched')) return;
    
    // Remove previous selections
    document.querySelectorAll('.matching-item.selected').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Add selection
    element.classList.add('selected');
    selectedMatchingItems.push({
        element: element,
        id: element.dataset.id,
        type: type
    });
    
    // Check for match
    if (selectedMatchingItems.length === 2) {
        setTimeout(checkMatchingPair, 300);
    }
}

function checkMatchingPair() {
    const [item1, item2] = selectedMatchingItems;
    
    if (item1.id === item2.id && item1.type !== item2.type) {
        // Match found!
        item1.element.classList.add('matched');
        item2.element.classList.add('matched');
        matchingMatches++;
        updateMatchingScore();
        
        // Check if game is complete
        if (matchingMatches === currentMatchingPairs.length) {
            endMatchingGame();
        }
    } else {
        // No match
        item1.element.classList.add('no-match');
        item2.element.classList.add('no-match');
        
        setTimeout(() => {
            item1.element.classList.remove('no-match', 'selected');
            item2.element.classList.remove('no-match', 'selected');
        }, 1000);
    }
    
    selectedMatchingItems = [];
}

function updateMatchingScore() {
    document.getElementById('matchingScore').textContent = matchingMatches;
}

function endMatchingGame() {
    clearInterval(matchingTimer);
    
    const timeElapsed = Math.floor((Date.now() - matchingStartTime) / 1000);
    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;
    
    document.getElementById('matchingResults').style.display = 'block';
    document.getElementById('matchingResults').innerHTML = `
        <div class="matching-complete">
            <h3>🎉 Matching Complete!</h3>
            <p>You matched ${matchingMatches} out of ${currentMatchingPairs.length} pairs</p>
            <p>Time: ${minutes}:${seconds.toString().padStart(2, '0')}</p>
            <div class="matching-actions">
                <button class="btn btn-primary" onclick="startMatching()">
                    <i class="fas fa-redo"></i> Play Again
                </button>
                <button class="btn btn-secondary" onclick="switchMode('dashboard')">
                    <i class="fas fa-home"></i> Back to Dashboard
                </button>
            </div>
        </div>
    `;
}

function startMatchingTimer() {
    matchingTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - matchingStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('matchingTimer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// Statistics functions
function loadStatistics() {
    fetch('/api/statistics')
        .then(response => response.json())
        .then(stats => {
            updateStatisticsDisplay(stats);
        })
        .catch(error => {
            console.error('Error loading statistics:', error);
        });
    
    // Load recent sessions
    fetch('/api/sessions?limit=5')
        .then(response => response.json())
        .then(sessions => {
            displayRecentSessions(sessions);
        })
        .catch(error => {
            console.error('Error loading sessions:', error);
        });
}

function updateStatisticsDisplay(stats) {
    // Update header stats
    document.getElementById('totalQuestions').textContent = stats.totalQuestions;
    document.getElementById('correctAnswers').textContent = stats.correctAnswers;
    
    const accuracy = stats.totalQuestions > 0 ? 
        Math.round((stats.correctAnswers / stats.totalQuestions) * 100) : 0;
    document.getElementById('accuracy').textContent = accuracy + '%';
    
    // Update statistics page
    document.getElementById('overallAccuracy').textContent = accuracy + '%';
    document.getElementById('totalQuestionsStat').textContent = stats.totalQuestions;
    
    // Update chapter progress
    Object.keys(stats.chapters).forEach(chapter => {
        const chapterStats = stats.chapters[chapter];
        const chapterAccuracy = chapterStats.attempted > 0 ? 
            Math.round((chapterStats.correct / chapterStats.attempted) * 100) : 0;
        
        // Update progress bars
        document.getElementById(`progress-ch${chapter}`).style.width = 
            Math.min((chapterStats.attempted / 20) * 100, 100) + '%';
        document.getElementById(`perf-ch${chapter}`).style.width = chapterAccuracy + '%';
        document.getElementById(`perf-ch${chapter}-text`).textContent = chapterAccuracy + '%';
        
        // Update chapter stats
        document.getElementById(`ch${chapter}-stats`).textContent = 
            `${chapterStats.correct}/${chapterStats.attempted} questions`;
    });
}

function displayRecentSessions(sessions) {
    const container = document.getElementById('recentSessions');
    
    if (sessions.length === 0) {
        container.innerHTML = '<p>No recent sessions found.</p>';
        return;
    }
    
    container.innerHTML = sessions.map(session => `
        <div class="session-item">
            <div class="session-info">
                <div class="session-date">${new Date(session.timestamp).toLocaleDateString()}</div>
                <div>Chapter ${session.chapter || 'All'} - ${session.totalQuestions} questions</div>
            </div>
            <div class="session-score">${session.score}%</div>
        </div>
    `).join('');
}

function updateStatistics() {
    loadStatistics();
}

// Utility functions
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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

// Difficulty toggle functions
function toggleDifficulty() {
    const toggle = document.getElementById('difficultyToggle');
    const newDifficulty = toggle.checked ? 'hard' : 'easy';
    
    if (newDifficulty !== currentDifficulty) {
        switchDifficulty(newDifficulty);
    }
}

function switchDifficulty(difficulty) {
    showLoading();
    
    fetch('/api/switch-difficulty', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ difficulty: difficulty })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentDifficulty = difficulty;
            updateDifficultyUI();
            loadCourseMeta(); // Reload metadata for new question bank
            hideLoading();
            
            // Show success message
            showNotification(`Switched to ${difficulty} questions!`, 'success');
        } else {
            hideLoading();
            showNotification('Failed to switch difficulty', 'error');
        }
    })
    .catch(error => {
        hideLoading();
        console.error('Error switching difficulty:', error);
        showNotification('Error switching difficulty', 'error');
    });
}

function loadCurrentDifficulty() {
    fetch('/api/difficulty')
        .then(response => response.json())
        .then(data => {
            currentDifficulty = data.difficulty;
            updateDifficultyUI();
        })
        .catch(error => {
            console.error('Error loading current difficulty:', error);
        });
}

function updateDifficultyUI() {
    const toggle = document.getElementById('difficultyToggle');
    toggle.checked = currentDifficulty === 'hard';
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    // Set background color based on type
    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

function updatePracticeOptions() {
    // This function can be used to update practice test options dynamically
    // For now, it's a placeholder for future enhancements
}

// Add CSS for review items
const reviewStyles = `
<style>
.review-item {
    margin-bottom: 1rem;
    padding: 1rem;
    border-radius: 8px;
    border-left: 4px solid #e2e8f0;
}

.review-item.correct {
    background-color: #d1fae5;
    border-left-color: #10b981;
}

.review-item.incorrect {
    background-color: #fee2e2;
    border-left-color: #ef4444;
}

.review-question {
    margin-bottom: 0.5rem;
}

.review-answers {
    margin-bottom: 0.5rem;
}

.user-answer.correct {
    color: #10b981;
    font-weight: 600;
}

.user-answer.incorrect {
    color: #ef4444;
    font-weight: 600;
}

.correct-answer {
    color: #10b981;
    font-weight: 600;
    margin-left: 1rem;
}

.review-explanation {
    font-size: 0.9rem;
    color: #64748b;
    font-style: italic;
}

.results-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 2rem;
}

.matching-complete {
    text-align: center;
    padding: 2rem;
    background: #f8fafc;
    border-radius: 12px;
    margin-top: 2rem;
}

.matching-complete h3 {
    color: #10b981;
    margin-bottom: 1rem;
}

.matching-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 1rem;
}

.matching-item.no-match {
    border-color: #ef4444 !important;
    background-color: #fee2e2 !important;
}

.question-review {
    margin-top: 2rem;
}

.question-review h3 {
    margin-bottom: 1rem;
    color: #1e293b;
}
</style>
`;

// Inject review styles
document.head.insertAdjacentHTML('beforeend', reviewStyles);
