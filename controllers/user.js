const User = require('../models/user')
async function userSignup(req, res) {
    const { fullName, email, password, role } = req.body;
    try {
        await User.create({
            fullName,
            email,
            password,
            role
        });
        res.status(201).json({ message: "User created successfully" });
        } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({ error: "Signup failed, please try again" });
    }
}
 async function userLogin(req, res) {
    const { email, password } = req.body;
    try {
        const token = await User.matchPassword(email, password);
        console.log("token",token);
      // Set the cookie
      res.cookie("token", token, { httpOnly: true });
       // Mark the cookie as httpOnly for security
       console.log("req.user",req.user)
        return res.status(201).json({ message: "Login successful" });
    } catch (error) {
        console.error("Signin error:", error);
        return res.status(400).json({
            error: "Incorrect Email or Password"
        });
    }
}
async function userLogout(req,res){
    res.clearCookie("token");
    return res.status(200).json({ message:"logged out successfully" });
}
module.exports = {userSignup,userLogin,userLogout}