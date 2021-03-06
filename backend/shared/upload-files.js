var url = require("url");
var path = require("path");
const AWS = require('aws-sdk');
const S3 = new AWS.S3({
  accessKeyId: process.env.s3AccessKeyId,
  secretAccessKey: process.env.s3SecretAccessKey
});
const fileSystem = require('fs');

async function uploadFile(file, fileKey) {
  const buf = Buffer.from(file.replace(/^data:image\/\w+;base64,/, ""),'base64')

  return new Promise(async function(resolve, reject) {
    // For any file types
    // const params = {
    //   Bucket: process.env.s3BucketName, // pass your bucket name
    //   Key: fileKey, // Name of the file
    //   ACL: 'public-read',
    //   Body: fileSystem.createReadStream(file.path),
    //   ContentType: file.type
    // };

    // For only images
    const params = {
      Bucket: process.env.s3BucketName,
      Key: fileKey,
      ACL: 'public-read',
      Body: Buffer.from(file.replace(/^data:image\/\w+;base64,/, ""),'base64'),
      ContentEncoding: 'base64',
      ContentType: 'image/jpeg'
    };
    await S3.upload(params, function(s3Err, data) {
      if (s3Err) {
        console.log("s3UploadFiles: " + s3Err)
        reject(s3Err);
        return;
      }

      console.log("s3UploadFiles: Uploaded file successfully");
      resolve(data);
    });
  });
}

exports.uploadFiles = async (files, fileNames) => {
  if (files.length == 0) {
    return [];
  }

  var uploadFilePromises = [];
  files.forEach((item, index) => {
    let ext = fileNames[index].substr(fileNames[index].lastIndexOf('.') + 1);
    let name = fileNames[index].toLowerCase().split(' ').join('-') + '-' + Date.now() + '.' + ext;
    uploadFilePromises.push(uploadFile(item, name)); // For any images
  })

  return await Promise.all(uploadFilePromises).then(values => {
      return values.map(item => item.Location);
    }, reason => {
      console.log("s3UploadFiles: " + reason);
    });
}

exports.deleteFiles = async files => {
  if (files.length == 0) {
    return [];
  }

  var filesToDelete = [];
  files.forEach(item => {
    var parsed = url.parse(item);
    filesToDelete.push({Key: path.basename(parsed.pathname)});
  });

  var params = {
    Bucket: process.env.s3BucketName,
    Delete: {
      Objects: filesToDelete,
      Quiet: false
    }
  }

  await S3.deleteObjects(params, async (err, data) => {
    if (err) {
       console.log("s3DeleteFiles: " + err);
       return;
    }// an error occurred
    console.log("s3DeleteFiles: " + "Deleted files successfully");
    // successful response
  });
}
