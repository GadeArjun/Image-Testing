const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set static folder for public files and uploaded files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer storage configuration: store only image files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    // Prefix with timestamp to avoid naming collisions
    cb(null, Date.now() + '-' + file.originalname)
  }
});

// File filter: accept only image files
function fileFilter(req, file, cb) {
  console.log(file);
  if(file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
}

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Endpoint to handle file upload
app.post('/upload', upload.single('image'), (req, res) => {
  console.log(req.file);
  
  if(!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded or invalid file type.' });
  }
  return res.json({ success: true, message: 'File uploaded successfully.' });
});

// Endpoint to retrieve uploaded files list
app.get('/files', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if(err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Error reading uploads directory.' });
    }
    // Filter out non-image files (if any exist)
    files = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext);
    });
    res.json({ success: true, files });
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message || 'An error occurred.' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
