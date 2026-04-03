const express = require('express');
const router = express.Router();
const { 
  upload, 
  uploadMultiple,
  deleteImage,
  getOptimizedImageUrl,
  getResponsiveImageUrls,
  generatePlaceholderUrl 
} = require('../config/cloudinary');
const { protect, admin } = require('../middleware/auth');
const Product = require('../models/Product');

/**
 * POST /api/images/upload
 * Upload single image
 * Protected: Admin only
 */
router.post('/upload', protect, admin, upload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const imageUrl = req.file.path;
    const publicId = req.file.filename;

    res.status(200).json({
      success: true,
      url: imageUrl,
      optimized: getResponsiveImageUrls(imageUrl),
      publicId: publicId,
    });
  } catch (error) {
    res.status(500).json({ message: 'Image upload failed', error: error.message });
  }
});

/**
 * POST /api/images/upload-multiple
 * Upload multiple images
 * Protected: Admin only
 */
router.post('/upload-multiple', protect, admin, uploadMultiple, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No image files provided' });
    }

    const uploadedImages = req.files.map(file => ({
      url: file.path,
      publicId: file.filename,
      optimized: getResponsiveImageUrls(file.path),
    }));

    res.status(200).json({
      success: true,
      images: uploadedImages,
    });
  } catch (error) {
    res.status(500).json({ message: 'Batch upload failed', error: error.message });
  }
});

/**
 * POST /api/images/delete
 * Delete image from Cloudinary
 * Protected: Admin only
 */
router.post('/delete', protect, admin, async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }

    const result = await deleteImage(publicId);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      result,
    });
  } catch (error) {
    res.status(500).json({ message: 'Image deletion failed', error: error.message });
  }
});

/**
 * GET /api/images/optimize
 * Get optimized image URLs for different breakpoints
 */
router.get('/optimize', async (req, res) => {
  try {
    const { imageUrl } = req.query;

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    const optimized = getResponsiveImageUrls(imageUrl);

    res.status(200).json({
      success: true,
      optimized,
    });
  } catch (error) {
    res.status(500).json({ message: 'Image optimization failed', error: error.message });
  }
});

/**
 * PUTapi/images/product/:id
 * Update product image and get optimized URLs
 * Protected: Admin only
 */
router.put('/product/:id', protect, admin, async (req, res) => {
  try {
    const { imageUrl, publicId } = req.body;
    const productId = req.params.id;

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete old image if it exists
    if (product.imagePublicId) {
      await deleteImage(product.imagePublicId);
    }

    // Update product with new image
    product.image = imageUrl;
    product.imagePublicId = publicId;
    product.imageOptimized = getResponsiveImageUrls(imageUrl);

    await product.save();

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product image', error: error.message });
  }
});

/**
 * GET /api/images/placeholder
 * Generate placeholder image
 */
router.get('/placeholder', (req, res) => {
  try {
    const { text } = req.query;

    if (!text) {
      return res.status(400).json({ message: 'Text parameter is required' });
    }

    const placeholderUrl = generatePlaceholderUrl(text);

    res.status(200).json({
      success: true,
      url: placeholderUrl,
    });
  } catch (error) {
    res.status(500).json({ message: 'Placeholder generation failed', error: error.message });
  }
});

module.exports = router;
