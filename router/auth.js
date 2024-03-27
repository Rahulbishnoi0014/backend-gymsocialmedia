const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs');
const ObjectId = require('mongodb').ObjectId;
const bodyparser = require("body-parser");
router.use(bodyparser.json());
const multer = require('multer');
const fs = require('fs');
// const upload = multer({ dest: 'uploads/' })

const upload = multer({
    limits: 1024 * 1024 * 5,
    fileFilter: (req, file, done) => {
        if (file.mimetype === "image/gif" || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png') {
            done(null, true);
        } else {
            done("Multer--> file type not supported", false);
        }
    }
})

// ------MONGODB------

require("../DB/conn");

const User = require('../models/userSchema');
const Post = require('../models/postSchema');
const Event = require('../models/eventsSchema');

// ----MIDDLEWARE----
const authenticate = require('../middleware/authenticate');

const uploadToS3 = require('../middleware/S3');
const { log } = require('console');

// ---------GET------------ 


router.get("/posts/:page", authenticate, async (req, res) => {

    try {
        const page=req.params.page;

        const limit=3;
        let skip=0;

        if(page!==0){
            skip=(page-1)*limit;
        }
        // console.log(skip+ " "+ limit +" "+page);

        const posts = await Post.find().sort({_id:-1}).limit(limit).skip(skip);


        // const postarr = posts.reverse();

        if (posts) {
            res.status(200).send(posts);
        }

    }

    catch (err) {
        res.status(422).send({ "err": err });
        console.log(err);
    }



});

router.get("/users", authenticate, async (req, res) => {

    try {


        const userlist = await User.find();

        if (userlist) {
            return res.status(200).send({ count: userlist.length });
        }
        else
            throw Error;

    }
    catch (err) {

        return res.status(422).send({ "err": err });
    }


});

// -------users Total ---posts total.....

router.get("/postsTotal", async (req, res) => {

    try {


        const posts = await Post.find();

        if (posts) {
            res.status(200).send({ count: posts.length });
        }

    }

    catch (err) {
        res.status(422).send({ "err": err });
        // console.log(err);
    }



});

router.get("/usersTotal", authenticate, async (req, res) => {

    try {


        const userlist = await User.find();

        if (userlist) {
            return res.status(200).send({ count: userlist.length });
        }
        else
            throw Error;

    }
    catch (err) {

        return res.status(422).send({ "err": err });
    }


});


// -------------------------------------

router.get("/userinfo", authenticate, async (req, res) => {
    try {

        const userdata = await User.findOne({ _id: req.userId },{password:0});

        return res.status(200).send(userdata);


    }
    catch (err) {
        // console.log(err);
        return res.status(500).send({ error: "cannot get user details" });
    }
})

router.get("/myposts", authenticate, async (req, res) => {
    try {

        const userposts = await Post.find({ user: req.userId });

        return res.status(200).send(userposts);


    }
    catch (err) {
        // console.log(err);
        return res.status(500).send({ error: "cannot get user details" });
    }
})


router.get("/isadmin", authenticate, async (req, res) => {
    try {
        const result = await User.find({ _id: req.userId }, { password: 0 });


        if (result[0].admin === true)
            return res.status(200).send(result[0]);
        else
            return res.status(404).send({ admin: false });


    }
    catch (err) {
        // console.log(err);
        return res.status(422).send("cannot fetch data");

    }
})

router.get("/events", authenticate, async (req, res) => {
    try {

        const result = await Event.find().sort({ _id: -1 });




        if (result)
            return res.status(200).send(result);
        else
            return res.status(404).send("NOT found data events");



    }
    catch (err) {
        // console.log(err);
        return res.status(422).send("cannot fetch data");
    }
})


router.get("/postDetails/:postId", authenticate, async (req, res) => {
    try {

        const postid = req.params.postId;

        const data = await Post.findOne({ _id: postid });

        if (data)
            return res.status(200).send(data);
        else
            return res.status(404).send({ message: "post not found" });

    }
    catch (err) {
        // console.log(err);
        return res.status(422).send({ error: "cannot get post details" });

    }
})

router.get("/delete/:postId", authenticate, async function (req, res) {

    try {
        const postid = req.params.postId;

        await Post.findByIdAndDelete(postid);

        await User.updateOne({ _id: req.userId }, { $pull: { secrets: ObjectId(postid) } });

        return res.status(200).send({ message: "sucessfuly delete the post" });



    }
    catch (err) {
        // console.log(err);
        return res.status(422).send({ error: "cannot delete" });
    }

});

//API LIKE DISLIKE TREND
router.get("/like/:postid", authenticate, async function (req, res) {

    try {



        await Post.updateOne({ _id: req.params.postid }, { $inc: { like: 1 } }, { upsert: true });

        res.status(200).send({ liked: true });

        User.findOne({ _id: req.userId }, async (err, data) => {
            if (!err) {


                if (data.likedPosts.indexOf(req.params.postid) < 0) {

                    // console.log(req.params.postid);
                    data.likedPosts.push(req.params.postid);
                    await data.save();


                }

                // return res.status(200).send({ liked: true });

                // else {
                //     data.likedPosts.push(req.params.postid);
                //     console.log("1st like");
                //     await data.save();

                // }
            }

        });










    }
    catch (err) {
        // console.log(err);

        return res.status(422).send({ liked: false });
    }

});
router.get("/dislike/:postid", authenticate, async function (req, res) {

    try {

        await Post.updateOne({ _id: req.params.postid }, { $inc: { like: -1 } }, { upsert: true });
        res.status(200).send({ disliked: true });

        User.findOne({ _id: req.userId }, (err, data) => {
            if (!err) {

                data.likedPosts.pull(req.params.postid);

                data.save();
            } else {
                console.log("err");
            }

        })
        // return res.status(200).send({ disliked: true });
    }
    catch (err) {
        console.log("err");
        return res.status(422).send({ disliked: false });
    }

});
router.get("/userlikes", authenticate, async (req, res) => {
    try {

        var userId = req.userId;

        const userData = await User.find({ _id: userId }, { likedPosts: 1 });

        return res.status(200).json(userData[0].likedPosts);




    }
    catch (err) {
        console.log("err");
        return res.status(500).send({ "err": err });

    }
})

router.get("/trend", authenticate, async (req, res) => {

    try {

        const data = await Post.find().sort({ "like": -1 }).limit(3);

        if (data)
            return res.status(200).send(data);
        else
            return res.status(404).send({ message: "no data found" });

    }
    catch (err) {
        console.log(err);
        return res.status(404).send({ error: "no trend data found" });

    }


    Post.find({}).sort({ "like": -1 }).exec(function (err, data) {
        if (!err) {

            res.send(data.slice(0, 10));
        } else {
            res.send({ message: "NOT FOUND" });
        }
    })
});


router.get("/logout", (req, res) => {
    try {

        res.clearCookie('campustoken', { path: "/" });
        return res.status(200).send("user logout");

    }
    catch {
        console.log(err);
        return res.status(422).send({ error: "cannot logout" });
    }

})



// -----profile pic-----
router.post("/uploadProfilePic", authenticate, upload.single("image"), async (req, res) => {
    // console.log(req.file.buffer);
    try {
        // const fileStream =fs.createReadStream();
        const result = await uploadToS3(req.file.buffer, req.userId);

        await User.updateOne({ _id: req.userId }, { $set: { profilePic: result.Location } }, { upsert: true });

        return res.status(200).send(result.Location);
    }
    catch (err) {
        console.log(err);
        return res.status(422).send({ error: "failed to upload" });
    }
})

// -----------POST-----------




router.post("/signup", async (req, res) => {
    // console.log(req.body);
    try {
        const { firstname, lastname, username, password, email, phone } = req.body;
        if (!firstname || !lastname || !username || !password || !email || !phone) {
            return res.status(422).send({ message: "complete info is not provided" });
        }

        const founduser = await User.findOne({ username });

        if (founduser) {
            return res.status(403).send({ error: "user already exist" })
        }
        else {

            const profilePic = 'https://img.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg?w=740&t=st=1682345841~exp=1682346441~hmac=7b238d9da79975a4e09b40e41341e671936b3d48bfbbc57754c5e4903d1969bd';

            const admin = false;

            const user = new User({ firstname, lastname, username, password, email, phone, profilePic, admin });
            // console.log(user);
            await user.save();
            return res.status(200).send({ message: "sucessfully registered" });

        }

    }

    catch (err) {
        console.log(err);
        return res.status(500).send({ error: "server error" });

    }




});

router.post("/signin", async (req, res) => {

    try {
        const { username, password } = req.body;

        if (!username || !password)
            return res.status(400).json({ message: "fill all fields" });

        const user = await User.findOne({ username });

        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);

            const token = await user.generateAuthToken();

            res.cookie("campustoken", token, {
                expires: new Date(Date.now() + 2589200000),
                httpOnly: true
            })

            if (isMatch) {

                return res.status(200).json({ Message: "USER FOUND-> SUCESS LOGIN" });
            }
            else
                return res.status(404).json({ message: "Invalid credentials" });

        }
        else {
            return res.status(404).json({ message: "Invalid credentials" });
        }



    }
    catch (err) {
        console.log(err);
    }

});


router.post("/submit",authenticate,  async (req, res) => {
    // console.log("submit is triggred");
    try {
        if (!req.body.secret)
            return res.status(404).send({ err: "not get a secret to post" });

        var today = new Date();
        var date = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        var datetime = time + ' - ' + date;

        const post = new Post({ user: req.body.userId || req.userId, like: 0, text: req.body.secret, datetime });

        // console.log(post);


        await post.save();

        User.findOne({ _id: req.userId || req.body.userId }, (err, user) => {
            if (!err) {
                user.secrets.push(post._id);

                user.save();
            }
        });





        return res.status(200).send({ message: "post sucessfull", _id: post._id });





    }
    catch (err) {
        console.log(err);
        return res.status(422).send({ message: "cannot post" });
    }

})

router.post("/updateUserInfo", authenticate, async function (req, res) {


    try {

        const { firstname, lastname, email, phone,gymname } = req.body;

        // console.log(firstname + lastname + email + phone);

        if (!firstname || !lastname || !email || !phone || !gymname)
            return res.status(422).send({ message: false });


        const user = await User.updateOne({ _id: req.userId }, { $set: { firstname, lastname, email, phone,gymname } }, { upsert: true });
        if (user)
            return res.status(200).send({ message: true })
        else
            return res.status(404).send({ message: false });

    }

    catch (err) {
        console.log(err);
        return res.status(500).send({ error: "cannot set new data" });
    }



})


router.post("/addevent", authenticate, async (req, res) => {
    try {



        const { name, eventby, eventdatestart, eventdateend, eventtimefrom, eventtimeupto, discription } = req.body;


        

        // console.log(name + " "+ discription);

        if (!name || !discription || !eventby || !eventdatestart || !eventdateend || !eventtimefrom || !eventtimeupto) {
            return res.status(204).send("fill complete info about event");
        }
        const date = new Date();
        const eventstart = eventdatestart + "T" + eventtimefrom + ":00.000Z";
        const eventend = eventdateend + "T" + eventtimeupto + ":00.000Z";

        const d1=new Date(eventstart),
              d2=new Date(eventend);


        if(d1>d2){
            return res.status(422).send("fill correct date and time");

        };

        const adminId=req.userId;

        const image = "https://cdn.pixabay.com/photo/2016/04/01/09/00/animal-1299106_1280.png"
        const event = new Event({ name, discription, date, image, eventby, eventstart,eventend ,adminId});

        // Event.index({"expireAt":1},{expire:10});



        await event.save();
        // console.log("sucess added");
        return res.status(200).send({ message: "event added sucessfully" });



    }
    catch (err) {
        // console.log(err);

        return res.status(422).send("failed to fetch");
    }
})







module.exports = router;