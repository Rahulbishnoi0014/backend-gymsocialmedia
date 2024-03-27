require('dotenv').config();

const express=require('express');
const cookieparse=require("cookie-parser")
const bodyParser = require("body-parser");
const cors = require('cors');


const app=express();
app.use(express.json());
app.use(cookieparse());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(require('./router/auth'));
app.use(cors());
//enable cors



app.listen(process.env.PORT || 5000,()=>{
    console.log("server is running on port :-"+process.env.PORT);
})