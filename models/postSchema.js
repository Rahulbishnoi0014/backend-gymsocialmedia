const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const ObjectId = require('mongodb').ObjectId;


const postSchema = new mongoose.Schema({
    text: String,
    like: Number,
    user: String,
    datetime:String

});

const Post = new mongoose.model("post", postSchema);

module.exports=Post;
