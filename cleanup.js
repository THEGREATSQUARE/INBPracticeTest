const fs = require('fs');

// Read the questionbank.json file
const data = fs.readFileSync('questionbank.json', 'utf8');
const questionBank = JSON.parse(data);

// Clean up explanations by removing citation references
questionBank.questions.forEach(question => {
    if (question.exp) {
        // Remove citation patterns like ":contentReference[oaicite:11]{index=11}"
        // This regex matches the colon followed by contentReference and everything after it
        question.exp = question.exp.replace(/:contentReference.*$/g, '');
        // Also remove any trailing colons or spaces
        question.exp = question.exp.replace(/:\s*$/, '').trim();
    }
});

// Write the cleaned data back to the file
fs.writeFileSync('questionbank.json', JSON.stringify(questionBank, null, 2));

console.log('✅ Cleaned up questionbank.json - removed citation references from explanations');
console.log('📝 Sample cleaned explanation:', questionBank.questions[0].exp);
