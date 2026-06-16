const fs = require('fs').promises;
const path = require('path');
const cloudinary = require('cloudinary').v2;

let isConfigured = false;

const ensureCloudinaryConfigured = () => {
  if (isConfigured) return;

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn("Cloudinary is not configured properly in .env");
    return;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });

  isConfigured = true;
};

const removeTemporaryFile = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore cleanup errors
  }
};

const uploadFileToCloudinary = async (file, { folder = 'lost2found' } = {}) => {
  if (!file) {
    throw new Error("No file received for Cloudinary upload");
  }

  ensureCloudinaryConfigured();

  const uploadOptions = {
    folder,
    resource_type: "auto",
  };

  if (file.path) {
    try {
      const result = await cloudinary.uploader.upload(file.path, uploadOptions);
      return result;
    } finally {
      // Clean up local temp file created by multer
      await removeTemporaryFile(file.path);
    }
  }

  throw new Error("Unsupported file payload for Cloudinary upload");
};

module.exports = {
  uploadFileToCloudinary,
};
