const { Schema, model } = require('mongoose');
const { createHmac, randomBytes } = require('node:crypto');
const {createToken} = require('../services/authentication')
const questionAnalysisSchema = new Schema({
    testId: { type: String, required: true }, // ID of the test
    //questionId: { type: String, required: true }, // ID of the question
    selectedOption: { type: String }, // Option selected by the user
    isCorrect: { type: Boolean }, // Whether the answer was correct
    timeSpent: { type: Number, default: 0 }, // Time spent on this question in seconds
});
const userSchema = new Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    salt: {
        type: String,
       
    },
    password: {
        type: String,
        required: true,
    },
    profileImageURL: {
        type: String,
    },
    role: {
        type: String,
        enum: ['USER', 'ADMIN'],
        required: true,
    },
    testAttempts: {
        type: Map,
        of: Number, // This will store the number of attempts per test series
    },
    testScores : { 
        type: Map,
         of: Number,
     }, 
     totalScores : { 
        type: Map,
         of: Number,
     },
     scores: [
       { type: Number }, // Total score for a specific test series
    
     ],
     duration:{
    type: Number,
    default: 0
     },
    totalTests: { type: Number, default: 0 }, // Total tests attempted
    skippedTests: { type: Number, default: 0 },// Total tests skipped
    questionScores: [
        {
            score: { type: Number, default: 0 },
            categories: [
                 {
                    category: String, // Category name
                    categoryScore: { type: Number }, // Total score in the category
                },
            ],
        },
    ],
    }, { timestamps: true }); // Corrected 'timestamps'

userSchema.pre("save", function (next) {
    const user = this;
    if (!user.isModified("password")) return next(); // Call next() here

    const salt = randomBytes(16).toString('hex'); // Specified 'hex' encoding
    console.log("Generated salt:", salt);  // Log the generated salt
    const hashedPassword = createHmac('sha256', salt)
        .update(user.password)
        .digest('hex');
    
    this.salt = salt;
    
    this.password = hashedPassword;
    next(); // Call next() after setting salt and password
});

userSchema.static("matchPassword",async function(email,password){
  const user= await this.findOne({email}); 
  console.log(user)//user is coming correctly
  if(!user) throw new Error("User not found");
  const salt = user.salt;
  const hashedPassword = user.password;
  const userProvidedHash= createHmac('sha256', salt)
.update(password)
.digest('hex');


console.log("User's salt:", salt);
console.log("Stored hashedPassword:", hashedPassword);
console.log("Provided hashed password:", userProvidedHash);
if(hashedPassword !== userProvidedHash)
    throw new Error("Incorrect password");
const token = createToken(user);

return token
});
const User = model('user', userSchema);
module.exports = User;
