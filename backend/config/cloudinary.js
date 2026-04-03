const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Multer storage configuration for Cloudinary
 */
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'gamatch/products',
    resource_type: 'auto',
    format: async (req, file) => 'webp', // Convert to WebP for optimization
    public_id: (req, file) => {
      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1e9);
      return `${timestamp}-${random}`;
    },
  },
});

/**
 * Create multer upload instance
 */
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(file.mimetype)) {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    } else {
      cb(null, true);
    }
  },
});

/**
 * Delete image from Cloudinary
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

/**
 * Optimize and transform image URLs
 */
const getOptimizedImageUrl = (imageUrl, options = {}) => {
  if (!imageUrl) return null;

  const defaultOptions = {
    width: options.width || 800,
    height: options.height || 600,
    crop: options.crop || 'fill',
    quality: options.quality || 'auto',
    fetch_format: options.format || 'auto',
    ...options,
  };

  // Parse Cloudinary URL and build transformation
  const url = new URL(imageUrl);
  const pathParts = url.pathname.split('/upload/');
  
  if (pathParts.length < 2) return imageUrl;

  const transformations = [];
  
  // Build transformation string
  if (defaultOptions.width || defaultOptions.height) {
    transformations.push(`w_${defaultOptions.width},h_${defaultOptions.height},c_${defaultOptions.crop}`);
  }
  
  transformations.push(`q_${defaultOptions.quality},f_${defaultOptions.fetch_format}`);

  const transformString = transformations.join('/');
  const fileName = pathParts[1];

  return `${url.protocol}//${url.host}${pathParts[0]}/upload/${transformString}/${fileName}`;
};

/**
 * Generate responsive image URLs (srcset)
 */
const getResponsiveImageUrls = (imageUrl) => {
  return {
    small: getOptimizedImageUrl(imageUrl, { width: 300, height: 300, crop: 'fill', quality: 80 }),
    medium: getOptimizedImageUrl(imageUrl, { width: 600, height: 600, crop: 'fill', quality: 85 }),
    large: getOptimizedImageUrl(imageUrl, { width: 1200, height: 900, crop: 'fill', quality: 90 }),
    xlarge: getOptimizedImageUrl(imageUrl, { width: 1920, height: 1440, crop: 'fill', quality: 95 }),
  };
};

/**
 * Create placeholder image (gradient with initials)
 */
const generatePlaceholderUrl = (productName) => {
  const initials = productName
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();

  const randomColor = Math.floor(Math.random() * 16777215).toString(16);

  return `https://via.placeholder.com/400x300?text=${encodeURIComponent(initials)}&bg=${randomColor}&textColor=ffffff&fontSize=50`;
};

/**
 * Batch upload multiple images
 */
const batchUploadImages = async (files) => {
  const results = [];

  for (const file of files) {
    try {
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = 'data:' + file.mimetype + ';base64,' + b64;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'gamatch/products',
        resource_type: 'auto',
        format: 'webp',
      });

      results.push({
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (error) {
      results.push({
        success: false,
        error: error.message,
      });
    }
  }

  return results;
};

module.exports = {
  cloudinary,
  upload: upload.single('image'),
  uploadMultiple: upload.array('images', 5),
  deleteImage,
  getOptimizedImageUrl,
  getResponsiveImageUrls,
  generatePlaceholderUrl,
  batchUploadImages,
};
