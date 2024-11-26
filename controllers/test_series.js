const User = require('../models/user');
const { TestSeries} = require('../models/test_series');
// Middleware to check if the user is authenticated
async function add(req,res)
{  
    if (req.user && req.user.role === 'ADMIN')
 {  
     const { title,description,category,difficultyLevel,questions,totalMarks,duration} = req.body;
        try {
        // Log questions separately for debugging
        console.log("Questions received:", questions);
     
  
      // Create the test_series
      const addTest_Series = await TestSeries.create({
        title,
        description,
        category, 
        difficultyLevel,
        questions: questions,
        totalMarks,
        duration
      });
       // Log the created test_series
    console.log(questions);
    console.log("test_series added:", addTest_Series);
    return res.status(200).json({ message: "Added test_series", addTest_Series });  
   } catch (error) {
     console.error("Error adding test_series:", error);
     return res.status(500).json({ error: "Could not add test_series" });  
   }
}
else
return res.status(400).json({error : "You are not admin"})
}
async function get(req,res){
    try {
        const testseries = await TestSeries.find({});
        res.status(200).json({ message: "View testseries", testseries });
      } catch (error) {
        console.error("Error fetching testseries:", error);
        return res.status(500).json({ error: "Could not get all testseries" });
      }
    }
    async function getById(req,res){
        try {
            const id = req.params.id;
            const testseriesbyID = await TestSeries.findById(id);
            res.status(200).json({ message: "View testseries by id", testseriesbyID });
          } catch (error) {
            console.error("Error fetching testseries by id:", error);
            return res.status(500).json({ error: "Could not get testseries by id" });
          }
    }
    async function updateById(req,res){
        if (req.user && req.user.role === 'ADMIN')
        {
            try {
                const { title, description, category, difficultyLevel, questions, totalMarks, duration } = req.body;
    
                // Ensure questions is an array of objects
                if (!Array.isArray(questions)) {
                    return res.status(400).json({ error: "Questions must be an array of objects" });
                }
    
                const updatedSeries = await TestSeries.findByIdAndUpdate(req.params.id, {
                    title,
                    description,
                    category,
                    difficultyLevel,
                    questions, // Ensure this is an array of objects
                    totalMarks,
                    duration
                }, { new: true });
              
                res.status(200).json({ message: "Updated successfully", updatedSeries });
            } catch (error) {
                console.error("Error updating testseries:", error);
                return res.status(500).json({ error: "Could not update testseries by id" });
            }
        }
            else
           return res.status(400).json({error : "You are not admin"})
    }
    async function deleteById(req,res)
    {
        if (req.user && req.user.role === 'ADMIN')
            {
        try {
            await TestSeries.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: "Deleted successfully" });
          } catch (error) {
            console.error("Error deleting recipe:", error);
            return res.status(500).json({ error: "Could not delete recipe by id" });
          }
        }
        else
        return res.status(400).json({error : "You are not admin"})
    }
    
    
  
    //calculate score
    async function calculateScore(answers,testSeriesId,userId) {
        const testSeries = await TestSeries.findById("673b2b219e0fd9b09f810205");
        if (!testSeries) {
            throw new Error('Test Series not found');
        }
        const user = await User.findById(userId);
    let score = 0; // Initialize score
    let questionScores = []; // Initialize an array for question-level scores
    
    for (let i = 0; i < testSeries.questions.length; i++) {
        const correctAnswer = testSeries.questions[i].correctAnswer;
        const userAnswer = answers[i];

        let questionScore = 0; // Variable to track the score for the current question
       
        // Check if the user's answer matches the correct answer
        if (userAnswer == correctAnswer) {
            questionScore = 1; // Mark the question as correct (score 1)
            score += testSeries.questions[i].marks || 1; // Add the question's marks (default to 1 if not specified)
        }
       
        // Push the question's score into the array with the expected structure
        questionScores.push({
            score: questionScore,
            categories: [
                {
                    category: testSeries.questions[i].category, // Assuming you have a category field in each question
                    categoryScore: questionScore, // Here you can use the same questionScore or compute differently
                },
            ],
        });
    }
     // Update user document with the calculated questionScores
    user.questionScores = questionScores; 
    await user.save();
    console.log(user.questionScores);
    console.log('questionScores:', user.questionScores);
console.log('scores:', user.scores);

    console.log("length",user.questionScores.length)
    
    
    const userStats = await User.aggregate([
        { $unwind: "$questionScores" },
        { $unwind: "$questionScores.categories" },
        {
            $group: {
              _id: "$questionScores.categories.category", // Group by category name
              totalScore: { $sum: "$questionScores.categories.categoryScore" }, // Sum the scores
            },
          },
          { $sort: { totalScore: -1 } },  // Optional sorting to show strongest subject first
     
    ])
    console.log("userstats", userStats);
    
    await user.save();
        return (score)
}
    



   // Function to handle the completion of a test and update highest score
async function handleTestCompletion(testSeriesId, answers,userId) {
    try {
        const score = await calculateScore(answers, testSeriesId, userId); // Calculate score
        const testSeries = await TestSeries.findById(testSeriesId); // Fetch the test series
        
        if (score > testSeries.highestScore) {
            console.log(`New highest score: ${score}`);  // For debugging
            testSeries.highestScore = score;  // Update the highest score
           
        }
         // Update totalScore and numberOfAttempts
         testSeries.totalScore =  (testSeries.totalScore || 0) + score;
         testSeries.numberOfAttempts = (testSeries.numberOfAttempts || 0) + 1;
         console.log("score",testSeries.totalScore);
         console.log("attempts",testSeries.numberOfAttempts); 
         //Calculate performance improvement
        
         // Calculate average score
         testSeries.averageScore = testSeries.totalScore / testSeries.numberOfAttempts;
         console.log("avg",testSeries.averageScore );
         await testSeries.save();  // Save the test series document with the new highest score
         return score;  // Return the final score (can be used for UI or response)
    } catch (error) {
        console.error('Error handling test completion:', error);
        throw new Error('Error completing the test');
    }
}
async function handleUserAnalytics(req,res) {
    const {testSeriesId, answers, userId} = req.body;
    try {
        const score = await calculateScore(answers, testSeriesId, userId); // Calculate score
        const testSeries = await TestSeries.findById(testSeriesId); // Fetch the test series
        
        if (!testSeries) {
            throw new Error('Test Series not found');
        }

        // Update user's total tests attempted
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User  not found');
        }
       
        user.totalTests += 1; // Increment total tests attempted
       const totaltests = user.totalTests;
        // Check for skipped answers
        const skippedCount = answers.filter(answer => answer === null).length; // Assuming null indicates a skipped answer
        user.skippedTests += skippedCount; // Increment skipped tests
         // Other logic for calculating highest score, updating test series stats, etc.
        // ...
          const attemptRate = ((totaltests - skippedCount)/totaltests)*100 + "%";
          user.scores.push(score);
          console.log("Array of user's scores:", user.scores);
        let perform =0;
         if(user.scores[user.scores.length-1] !== undefined){
         perform = ((user.scores[user.scores.length-2] - user.scores[0])/user.scores.length)*100;
         console.log("perform %age",perform+" %");
         }
        await user.save(); // Save the updated user document
        res.status(200).json({
            message: 'Attempt Rate',
            skippedCount,
            totaltests,
            attemptRate, 
            performanceImprovement: perform+" %" 
        })
        return score;  // Return the final score (can be used for UI or response)
    } catch (error) {
        console.error('Error handling test completion:', error);
        throw new Error('Error completing the test');
    }
}
async function validateInput(req) {
    const { userId, testSeriesId, answers } = req.body;
    if (!userId || !testSeriesId || !answers) {
        throw new Error('Invalid input');
    }
}
async function updateUserScores(userId,testSeriesId,score)
{
    const user = await User.findById(userId);
    const testSeries = await TestSeries.findById(testSeriesId)
  
    if (!user) {
        return res.status(404).json({ error: 'User  not found' });
    }
     // Ensure testScores is initialized
     if (!user.testScores) {
        user.testScores = new Map(); // Initialize if it doesn't exist
    }
    if (score > (user.testScores.get(testSeriesId) || 0)) {
        user.testScores.set(testSeriesId, score); // Update the user's highest score for the specific test series
    }
   
    user.testAttempts = user.testAttempts || new Map();
    user.totalScores = user.totalScores || new Map();
   // console.log("user testscores", user.testScores);
   // console.log("user testattempts", user.testAttempts);
   // Save the updated user document
   // Update the score

 const currentTotalScore = user.totalScores.get(testSeriesId) || 0; // Get current total score or default to 0
  user.totalScores.set(testSeriesId, currentTotalScore + score);
 const attempts = user.testAttempts.get(testSeriesId) || 1; // Number of attempts (default to 1 to avoid division by zero)
 user.testAttempts.set(testSeriesId, attempts + 1)
 //const userAverage = totalScore / attempts; // Calculate average

    console.log("user testScores:", user.testScores); 
    console.log("user testAttempts:", attempts); 
    console.log("individual question scores",questionScores);
     // Get the highest score and average score for the specific test series
    await user.save();

}
async function getTestSeriesStats(userId,testSeriesId)
{    const user = await User.findById(userId);
    const testSeriesStats = await TestSeries.aggregate([
        { $match: { _id: testSeriesId } },
        {
            $group: {
                _id: null,
                highestScore: { $max: "$highestScore" },
                averageScore: { $avg: "$averageScore" }
            }
        }
    ]);
   console.log(testSeriesStats[0])
    const highestScore = testSeriesStats[0] ? testSeriesStats[0].highestScore : 0;
    const averageScore = testSeriesStats[0] ? testSeriesStats[0].averageScore : 0;
    console.log("Total Score for Test Series:", user.totalScores.get(testSeriesId));
    console.log("Total Attempts for Test Series:", user.testAttempts.get(testSeriesId));
    
   /* const totalTestSeries = await TestSeries.countDocuments();
    const completionRate = Math.min((user.completedTestsCount / totalTestSeries) * 100, 100);
     console.log("completed",user.completedTests)
     console.log("completedTest",user.completedTestsCount)
     console.log("rate",completionRate);
     console.log("Total Test Series:", totalTestSeries);*/

}
async function complete(req, res) {
    try {
        await validateInput(req);
        const start = performance.now(); // Start time
        const score = await handleTestCompletion(req.body.testSeriesId, req.body.answers, req.body.userId);
        const end = performance.now(); // End time

        const duration = end - start; // Calculate duration
        const user = await User.findById(req.body.userId);
        if (!user) {
            return res.status(404).json({ error: 'User  not found' });
        }

        // Update user scores and attempts
        await updateUserScores( req.body.userId, req.body.testSeriesId, score);

        // Fetch test series stats
        const testSeriesStats = await getTestSeriesStats( req.body.userId,req.body.testSeriesId);

        // Respond with data
        res.status(200).json({
            message: 'Test completed successfully',
            score,
            ...testSeriesStats,
            userHighest: user.testScores.get(req.body.testSeriesId), 
            userAverage: user.totalScores.get(req.body.testSeriesId) / user.testAttempts.get(req.body.testSeriesId),
            duration,
        });
    } catch (error) {
        console.error('Error completing test:', error);
        res.status(500).json({ error: error.message });
    }
}


  




module.exports = {add,get,getById,updateById,deleteById,complete,handleUserAnalytics};