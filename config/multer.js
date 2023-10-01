const multer = require('multer')
const aws = require('aws-sdk')
const multerS3 = require('multer-s3')

aws.config.update(
    {
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.ACCESS_KEY_SECRET,
        region: process.env.DEFAULT_REGION
    }
)


const upload = multer({
    storage: multerS3({
        s3: new aws.S3(),
        bucket: 'upload-gmbordados',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        acl: 'public-read',
        key: function(req, file, cb)
        {
            let nome = Date.now()+"-"+file.originalname
            cb(null, nome)
        }
    })
})



const storageTypes = {
    local: multer.diskStorage({
        filename: function(req, file, cb)
        {
            let nome = Date.now()+"-"+file.originalname
            cb(null, nome)
        },
        destination: function(req, file, cb)
        {
            let path = "./public/images"
            cb(null, path)
        }
    }),

    s3: multerS3({
        s3: new aws.S3(),
        bucket: 'upload-gmbordados',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        acl: 'private',
        key: function(req, file, cb)
        {
            let nome = Date.now()+"-"+file.originalname
            cb(null, nome)
        }

    })
}

module.exports = {
    storage: storageTypes['s3'],
    filename: function(req, file, cb)
    {
        let nome = Date.now()+"-"+file.originalname
        cb(null, nome)
    }
}


