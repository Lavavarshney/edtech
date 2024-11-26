const express=require('express')
const {add,get,getById, updateById, deleteById, complete, handleUserAnalytics} = require('../controllers/test_series') 
const router = express.Router();
const isAuthenticated = (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ error: "Forbidden: User not authenticated" });
    }
    next();
  };
router.post("/add-new",isAuthenticated, add);
router.get("/",isAuthenticated, get);
router.get("/:id",isAuthenticated, getById);
router.put("/:id",isAuthenticated, updateById);
router.delete("/:id",isAuthenticated, deleteById);
router.post('/complete',isAuthenticated, complete);
router.post('/userAnalytics',isAuthenticated,handleUserAnalytics);

module.exports = router;