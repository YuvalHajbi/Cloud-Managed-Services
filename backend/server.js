const express = require('express');
const multer = require('multer');
const mysql = require('mysql2');
const path = require('path');
const cors = require('cors');
const AWS = require('aws-sdk');

const app = express();
const port = process.env.BACKEND_PORT;

console.log('S3 Bucket Name:', process.env.S3_BUCKET_NAME);
const s3 = new AWS.S3();

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// MySQL connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  optionsSuccessStatus: 200
};

// Middleware
app.use('/api', cors(corsOptions));
app.use('/api', express.json());

// Helper function to get the image from S3
function getImageFromS3(bucket, key, res) {
  const params = {
    Bucket: bucket,
    Key: key
  };

  s3.getObject(params)
    .createReadStream()
    .on('error', function(err) {
      console.error('Error fetching image from S3:', err);
      res.status(500).json({ message: 'Error fetching image from S3', error: err.message });
    })
    .pipe(res);
}

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

// Proxy endpoint to serve images
app.get('/api/images/:key', (req, res) => {
  const key = req.params.key;
  getImageFromS3(process.env.S3_BUCKET_NAME, key, res);
});

// Combined upload and metadata saving
app.post('/api/upload', upload.single('image'), (req, res) => {
    console.log('Upload request received');
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
  
    const { category } = req.body;
    const s3Key = `${Date.now()}-${req.file.originalname}`;
  
    console.log('Uploading file:', s3Key);

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
      Body: req.file.buffer
    };
  
    s3.upload(uploadParams, (s3Err, data) => {
      if (s3Err) {
        console.error('Error uploading to S3:', s3Err);
        return res.status(500).json({ message: 'Error uploading to S3', error: s3Err.message });
      }
  
      console.log('File uploaded successfully to S3');

      const query = 'INSERT INTO Images (ImageName, Category) VALUES (?, ?)';
      connection.query(query, [s3Key, category], (err, results) => {
        if (err) {
          console.error('Error saving image metadata:', err);
          s3.deleteObject({ Bucket: process.env.S3_BUCKET_NAME, Key: s3Key }, (deleteErr) => {
            if (deleteErr) console.error('Error deleting S3 object after failed DB insert:', deleteErr);
          });
          return res.status(500).json({ message: 'Error saving image metadata', error: err.message });
        }
  
        console.log('Image metadata saved to database');

        res.json({ 
          message: 'Image uploaded and metadata saved successfully', 
          id: results.insertId,
          filename: s3Key,
          path: data.Location
        });
      });
    });
});

// Get all images
app.get('/api/images', (req, res) => {
    console.log('Fetching all images');
    const query = 'SELECT * FROM Images';
    
    connection.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching images:', err);
        res.status(500).json({ message: 'Error fetching images', error: err.message });
      } else {
        if (results.length === 0) {
          res.status(204).json({ message: 'No images found', images: [] });
        } else {
          const imagesWithUrls = results.map(img => ({
            ...img,
            url: `/api/images/${img.ImageName}`
          }));
          res.status(200).json({ message: 'Images fetched successfully', images: imagesWithUrls });
        }
      }
    });
});

// Delete an image
app.delete('/api/images/:id', (req, res) => {
  console.log('Delete request received for image ID:', req.params.id);
  const query = 'SELECT ImageName FROM Images WHERE ID = ?';
  
  connection.query(query, [req.params.id], (err, results) => {
    if (err) {
      console.error('Error fetching image:', err);
      return res.status(500).json({ message: 'Error fetching image' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const key = results[0].ImageName;

    // Delete from S3
    const deleteParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key
    };

    s3.deleteObject(deleteParams, (s3Err) => {
      if (s3Err) {
        console.error('Error deleting from S3:', s3Err);
        return res.status(500).json({ message: 'Error deleting from S3' });
      }

      // Delete from database
      const deleteQuery = 'DELETE FROM Images WHERE ID = ?';
      connection.query(deleteQuery, [req.params.id], (deleteErr) => {
        if (deleteErr) {
          console.error('Error deleting from database:', deleteErr);
          return res.status(500).json({ message: 'Error deleting from database' });
        }

        res.json({ message: 'Image deleted successfully' });
      });
    });
  });
});

// Get all images grouped by category
app.get('/api/categories', (req, res) => {
    console.log('Fetching images by category');
    const query = 'SELECT Category, GROUP_CONCAT(ID) as ImageIDs, GROUP_CONCAT(ImageName) as ImageNames FROM Images GROUP BY Category';
    
    connection.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching images by category:', err);
        res.status(500).json({ message: 'Error fetching images by category' });
      } else {
        const categorizedImages = results.map(row => ({
          category: row.Category,
          images: row.ImageIDs.split(',').map((id, index) => ({
            id: id,
            name: row.ImageNames.split(',')[index],
            url: `/api/images/${row.ImageNames.split(',')[index]}`
          }))
        }));
        res.json(categorizedImages);
      }
    });
});

app.get('/api/config', (req, res) => {
    res.json({ message: 'Config not needed for proxy URLs' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
