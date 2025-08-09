const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for payment proof uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/payment-proofs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.random().toString(36).substring(2, 15) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// File filter for payment proof images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed.'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Upload payment proof
const uploadPaymentProof = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Generate the public URL
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-vercel-domain.vercel.app' 
      : 'http://localhost:5000';
    
    const fileUrl = `${baseUrl}/uploads/payment-proofs/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Payment proof uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: fileUrl
      }
    });

  } catch (error) {
    console.error('Payment proof upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload payment proof',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get payment proof by filename
const getPaymentProof = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/payment-proofs', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Payment proof not found'
      });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Get payment proof error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment proof'
    });
  }
};

// Delete payment proof
const deletePaymentProof = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/payment-proofs', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Payment proof not found'
      });
    }

    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: 'Payment proof deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment proof error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment proof'
    });
  }
};

module.exports = {
  upload,
  uploadPaymentProof,
  getPaymentProof,
  deletePaymentProof
}; 