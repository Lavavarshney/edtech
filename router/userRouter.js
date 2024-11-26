const express=require('express')
const {userSignup,userLogin,userLogout} = require('../controllers/user') 
const router = express.Router();
router.post("/signup", userSignup);
router.post("/login", userLogin);
router.post("/logout", userLogout);
module.exports=router;