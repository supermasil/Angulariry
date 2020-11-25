var url = require("url");
var path = require("path");
const AWS = require('aws-sdk');
const S3 = new AWS.S3({
  accessKeyId: 'AKIAZTDDKMEE3MACJHXC',
  secretAccessKey: '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'
});
const fileSystem = require('fs');

async function uploadFile(file, fileKey) {
  return new Promise(async function(resolve, reject) {
    const params = {
      Bucket: process.env.s3BucketName, // pass your bucket name
      Key: fileKey, // Name of the file
      ACL: 'public-read',
      Body: fileSystem.createReadStream(file.path),
      ContentType: file.type
    };
    await S3.upload(params, function(s3Err, data) {
      if (s3Err) {
        console.log("s3UploadFiles: " + s3Err)
        reject(s3Err);
      }

      console.log("s3UploadFiles: Uploaded file successfully");
      resolve(data);
    });
  });
}

exports.uploadFiles = async files => {
  var uploadFilePromises = [];
  files.forEach(item => {
    uploadFilePromises.push(uploadFile(item, item.filename));
  })

  return await Promise.all(uploadFilePromises).then(values => {
      return values.map(item => item.Location);
    }, reason => {
      console.log("s3UploadFiles: " + reason);
    });
}

exports.deleteFiles = files => {
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

  S3.deleteObjects(params, async (err, data) => {
    if (err) {
       console.log("s3DeleteFiles: " + err);
    }// an error occurred
    console.log("s3DeleteFiles: " + "Deleted files successfully");
    // successful response
  });
}
