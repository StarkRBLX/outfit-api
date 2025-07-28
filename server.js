const express = require('express');
const { Pool } = require('pg');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['https://www.roblox.com', 'https://roblox.com'], // Allow Roblox domains
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-API-Key']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));

// API Key middleware
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  next();
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

// Generate unique ID for outfits
function generateUniqueId() {
  return Math.floor(Math.random() * 9000000000) + 1000000000; // 10-digit number
}

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// GetOutfitDetails API
app.post('/api/GetOutfitDetails', 
  validateApiKey,
  [
    body('OutfitUniqueIds').isObject().withMessage('OutfitUniqueIds must be an object/dictionary')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { OutfitUniqueIds } = req.body;
      
      // Extract unique IDs from the dictionary
      const uniqueIds = Object.values(OutfitUniqueIds);
      
      if (uniqueIds.length === 0) {
        return res.json({});
      }

      // Query database for outfits
      const query = 'SELECT * FROM outfits WHERE unique_id = ANY($1)';
      const result = await pool.query(query, [uniqueIds]);
      
      // Format response as dictionary matching input structure
      const response = {};
      Object.keys(OutfitUniqueIds).forEach(key => {
        const uniqueId = OutfitUniqueIds[key];
        const outfit = result.rows.find(row => row.unique_id == uniqueId);
        
        if (outfit) {
          response[key] = {
            uniqueId: outfit.unique_id,
            name: outfit.name,
            price: outfit.price,
            accessoryData: outfit.accessory_data,
            serializedDescription: outfit.serialized_description,
            otherMetadata: outfit.other_metadata,
            views: outfit.views,
            favourites: outfit.favourites,
            uploadTime: outfit.upload_time
          };
        } else {
          response[key] = null; // Outfit not found
        }
      });

      res.json(response);
    } catch (error) {
      console.error('GetOutfitDetails error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// SearchOutfitsAsync API
app.post('/api/SearchOutfitsAsync',
  validateApiKey,
  [
    body('SortType').optional().isIn(['Newest', 'Popular', 'Trending']).withMessage('Invalid SortType'),
    body('Amount').isInt({ min: 1, max: 200 }).withMessage('Amount must be between 1 and 200'),
    body('SearchKeyword').optional().isString().isLength({ max: 100 }).withMessage('SearchKeyword too long')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { SortType = 'Newest', Amount = 50, SearchKeyword = '' } = req.body;
      
      let query = 'SELECT * FROM outfits';
      let queryParams = [];
      let whereConditions = [];
      
      // Add search keyword filtering
      if (SearchKeyword.trim()) {
        whereConditions.push(`(name ILIKE $${queryParams.length + 1} OR other_metadata::text ILIKE $${queryParams.length + 1})`);
        queryParams.push(`%${SearchKeyword.trim()}%`);
      }
      
      // Add WHERE clause if needed
      if (whereConditions.length > 0) {
        query += ' WHERE ' + whereConditions.join(' AND ');
      }
      
      // Add sorting
      switch (SortType) {
        case 'Popular':
          query += ' ORDER BY (favourites + views) DESC, upload_time DESC';
          break;
        case 'Trending':
          // Score based on likes:views ratio and recency
          query += ' ORDER BY (CASE WHEN views > 0 THEN favourites::float / views ELSE 0 END) * EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - upload_time))/86400 DESC';
          break;
        case 'Newest':
        default:
          query += ' ORDER BY upload_time DESC';
          break;
      }
      
      query += ` LIMIT $${queryParams.length + 1}`;
      queryParams.push(Amount);
      
      const result = await pool.query(query, queryParams);
      
      // Format response as array
      const response = result.rows.map(outfit => ({
        views: outfit.views,
        favourites: outfit.favourites,
        name: outfit.name,
        uploadTime: outfit.upload_time,
        price: outfit.price,
        otherUsefulMetadata: outfit.other_metadata,
        serializedDescription: outfit.serialized_description,
        uniqueId: outfit.unique_id
      }));

      res.json(response);
    } catch (error) {
      console.error('SearchOutfitsAsync error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// UploadOutfit API
app.post('/api/UploadOutfit',
  validateApiKey,
  [
    body('Name').isString().isLength({ min: 1, max: 255 }).withMessage('Name must be 1-255 characters'),
    body('AccessoryData').isString().withMessage('AccessoryData must be a JSON string'),
    body('Price').isInt({ min: 0 }).withMessage('Price must be a non-negative integer'),
    body('SerializedDescription').optional().isObject(),
    body('OtherMetadata').optional().isObject()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { Name, AccessoryData, Price = 0, SerializedDescription = {}, OtherMetadata = {} } = req.body;
      
      // Validate JSON string
      let parsedAccessoryData;
      try {
        parsedAccessoryData = JSON.parse(AccessoryData);
      } catch (e) {
        return res.status(400).json({ error: 'AccessoryData must be valid JSON' });
      }
      
      // Generate unique ID
      let uniqueId;
      let attempts = 0;
      do {
        uniqueId = generateUniqueId();
        attempts++;
        if (attempts > 10) {
          throw new Error('Failed to generate unique ID');
        }
        
        // Check if ID already exists
        const existingResult = await pool.query('SELECT unique_id FROM outfits WHERE unique_id = $1', [uniqueId]);
        if (existingResult.rows.length === 0) break;
      } while (true);
      
      // Insert outfit
      const insertQuery = `
        INSERT INTO outfits (unique_id, name, price, accessory_data, serialized_description, other_metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING unique_id
      `;
      
      const result = await pool.query(insertQuery, [
        uniqueId,
        Name,
        Price,
        parsedAccessoryData,
        SerializedDescription,
        OtherMetadata
      ]);
      
      res.json(result.rows[0].unique_id);
    } catch (error) {
      console.error('UploadOutfit error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// IncrementAsync API - Increment views
app.post('/api/IncrementViews',
  validateApiKey,
  [
    body().isArray().withMessage('Body must be an array of outfit unique IDs'),
    body('*').isInt().withMessage('All items must be integers')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const outfitIds = req.body;
      
      if (outfitIds.length === 0) {
        return res.json({ success: true, updated: 0 });
      }
      
      const query = 'UPDATE outfits SET views = views + 1 WHERE unique_id = ANY($1)';
      const result = await pool.query(query, [outfitIds]);
      
      res.json({ success: true, updated: result.rowCount });
    } catch (error) {
      console.error('IncrementViews error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// IncrementAsync API - Increment favourites
app.post('/api/IncrementFavourites',
  validateApiKey,
  [
    body().isArray().withMessage('Body must be an array of outfit unique IDs'),
    body('*').isInt().withMessage('All items must be integers')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const outfitIds = req.body;
      
      if (outfitIds.length === 0) {
        return res.json({ success: true, updated: 0 });
      }
      
      const query = 'UPDATE outfits SET favourites = favourites + 1 WHERE unique_id = ANY($1)';
      const result = await pool.query(query, [outfitIds]);
      
      res.json({ success: true, updated: result.rowCount });
    } catch (error) {
      console.error('IncrementFavourites error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(port, () => {
  console.log(`Outfit Database API running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await pool.end();
  process.exit(0);
}); 