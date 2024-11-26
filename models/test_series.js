const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String }, // Explanation for correct answer, optional
    marks: { type: Number, default: 1 }, // Marks assigned for the question
    category: { type: String, required: true },
}, { _id: false });

const testSeriesSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    //category: { type: String, required: true }, // e.g., "Mathematics", "Physics"
    difficultyLevel: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    questions: [questionSchema],
    totalMarks: { type: Number }, // Calculated from question marks
    duration: { type: Number }, // Duration in minutes
    tags: [{ type: String }], // e.g., ["Engineering", "Entrance Exam"]

    // Settings and statistics
    passingMarks: { type: Number},
    totalAttempts: { type: Number, default: 0 },
    highestScore: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    
}, { timestamps: true }
);


// Exporting the models
const TestSeries = mongoose.model('TestSeries', testSeriesSchema);

module.exports = { TestSeries };
