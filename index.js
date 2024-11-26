const express = require('express');
const mongoose = require('mongoose');
const app= express();
const bodyParser = require('body-parser');
const userRoute = require('./router/userRouter');
const testRoute = require('./router/testRouter')

const cookieParser = require('cookie-parser');
const { checkForAuthenticationCookie } = require('./middlewares/authentication');
const PORT = 3000;
mongoose.connect('mongodb://localhost:27017/ed-tech').then(e =>console.log("mongodb connected"));
app.use(express.json()); // This middleware parses incoming JSON requests
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser());

app.use(checkForAuthenticationCookie('token'))
app.use(bodyParser.json()); // This will parse JSON request bodies
app.use('/user', userRoute)
app.use('/test', testRoute);


app.listen(PORT,()=>console.log(`Server started at ${PORT}`));