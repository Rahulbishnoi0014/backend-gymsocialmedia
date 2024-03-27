const AWS = require('aws-sdk');

// AWS CONFIG
const awsconfig = {
    accessKeyId: process.env.AcessKey,
    secretAccessKey: process.env.Secretkey
}

const S3 = new AWS.S3(awsconfig);


// upload to s3 function
const uploadToS3 = async (fileData, filename) => {
    try{
        return new Promise((resolve, reject) => {
            const params = {
                Bucket: process.env.bucketName,
                Key: filename + ".jpg",
                ContentType: 'image/jpg',
                Body: fileData
            }
    
            S3.upload(params, (err, data) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                else {
                    // console.log(data);
                    return resolve(data);
                }
            })
    
        })
    }
    catch(err){
        console.log(err);
        
    }
}

module.exports=uploadToS3;