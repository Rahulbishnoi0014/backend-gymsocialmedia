const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const ObjectId = require('mongodb').ObjectId;


const eventsSchema = new mongoose.Schema({
    

    name:String,
    discription:String,
    image:String,
    eventby:String,
    // "expireAt": { type: Date}
    eventstart:Date,
    eventend:Date,

    adminId:ObjectId

});



const Event = new mongoose.model("event", eventsSchema);

module.exports=Event;
