const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');


const userSchema = new mongoose.Schema({
    lastupdate: Date,
    firstname: String,
    lastname: String,
    username: String,
    gymname:String,
    profilePic: String,
    email: String,
    phone: Number,
    password: String,
    admin:Boolean,
    secrets: Array,
    likedPosts:Array
    
});

userSchema.pre('save',async function(next){
    if(this.isModified('password')){
        this.password=await bcrypt.hash(this.password,12);
        // console.log(this.password);
    }

    next();
})

userSchema.methods.generateAuthToken=async function(){
    try{
        let token=jwt.sign({_id:this._id},process.env.JWTsecret)
        // this.tokens=this.tokens.concat({token:token});
        
        // await this.save();

        return token;


    }
    catch(err){
        console.log(err);
    }
}
const User=new mongoose.model("user",userSchema);

module.exports=User;
