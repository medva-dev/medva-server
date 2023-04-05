const { S3Client } = require('@aws-sdk/client-s3');
const { v4 } = require('uuid');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { supabase } = require('../../helpers/supabase');

const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

const s3Storage = multerS3({
  s3: s3,
  bucket: process.env.S3_BUCKET,
  key: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = path.parse(file.originalname).name;

    cb(null, `${process.env.S3_RAW_VIDEOS_FOLDER}/${name} - ${v4()}${ext}`);
  },
});

const upload = multer({
  storage: s3Storage,
  fileFilter: function (req, file, callback) {
    const ext = String(path.extname(file.originalname)).toLowerCase();
    if (ext !== '.mp4') {
      return callback(new Error('Only .mp4 is allowed'));
    }
    callback(null, true);
  },
}).single('video');

module.exports = async (db, data, user, req, res) => {
  const response = await new Promise((resolve, reject) => {
    upload(req, res, function (err) {
      if (err) {
        return reject(err);
      }
      const { location, originalname } = req.file ?? {};
      if (!location) {
        throw new Error('No location found after uploading');
      }

      if (!originalname) {
        throw new Error('No original name found after uploading');
      }

      resolve({ location, originalname });
    });
  });

  // get the duration of the video
  const duration = await new Promise((resolve, reject) => {
    ffmpeg.ffprobe(response.location, function (err, metadata) {
      if (err) {
        return reject(err);
      }
      resolve(Number(Number(metadata.format.duration || 0).toFixed(0)));
    });
  });

  const uploadedVideo = {
    fileName: response.originalname,
    rawVideoLocation: response.location,
    duration,
  };

  const { error } = await supabase.from('videoUploads').insert(uploadedVideo);

  if (error) {
    throw error;
  }

  return { successMessage: 'Successfully uploaded the video' };
};
