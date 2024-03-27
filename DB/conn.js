const mongoose=require('mongoose');

mongoose.set('strictQuery',false);

// "mongodb://127.0.0.1:27017/campusReact"

// mongoose.connect(process.env.DB )
// .then(()=>{
//     console.log("mongoDB is connected");
// })
// .catch(()=>{
//     console.log('failed to connect MONGODB');
// })


const connectDB=async ()=>{
    try{
        await mongoose.connect(process.env.DB)

        console.log("mongoDB is connected");

    }
    catch(err){
        console.log('failed to connect MONGODB');

    }
}

connectDB();