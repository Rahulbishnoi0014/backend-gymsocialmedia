const jwt =require('jsonwebtoken');

const User = require('../models/userSchema');


const authenticate=async (req,res,next)=>{
    try{

        const token=req.cookies.campustoken;
        const userToken=jwt.verify(token,process.env.JWTsecret) ;

        const userData= await User.findOne({_id:userToken._id});

        if(userData){
            req.rootUser=userData;
            req.userId=userData._id;
            next();
        }else{
            console.log("user not found with this token");
            const error=new Error("user not found with this token");
             throw error;

        }

    }
    catch(err){
        console.log(err);
        res.status(401).send({"message":"not authenticated"});
        
    }
}


module.exports=authenticate;