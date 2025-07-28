# Roblox Outfit Database API

A secure, scalable outfit database system for Roblox games, allowing players to upload, browse, and share custom outfits.

## Features

- **GetOutfitDetails API**: Retrieve outfit data by unique IDs
- **SearchOutfitsAsync API**: Search outfits with sorting and filtering
- **UploadOutfit API**: Upload new outfits with metadata  
- **IncrementAsync APIs**: Track views and favorites
- **Roblox SDK**: Ready-to-use Lua module for game integration
- **Security**: API key authentication, rate limiting, input validation
- **Performance**: PostgreSQL with optimized indexes, connection pooling
- **Scalability**: Supports millions of daily requests

## Quick Start

### 1. Deploy the API Server
Follow the detailed instructions in `DEPLOYMENT.md` to set up your VPS with:
- PostgreSQL database
- Node.js API server  
- Nginx reverse proxy
- SSL certificate
- Security hardening

### 2. Configure Roblox SDK
```lua
local OutfitDB = require(path.to.OutfitDatabaseSDK)
OutfitDB:Configure("https://your-domain.com", "your_api_key")

-- Search for outfits
local outfits = OutfitDB:SearchOutfitsAsync({
    SortType = "Newest", 
    Amount = 50, 
    SearchKeyword = "Summer"
})

-- Upload an outfit
local outfitId = OutfitDB:UploadOutfit({
    Name = "Cool Summer Look",
    AccessoryData = '{"hat": 123, "shirt": 456}',
    Price = 100
})
```

## API Endpoints

### POST /api/GetOutfitDetails
Retrieve outfit data for multiple outfit IDs.

**Request:**
```json
{
  "OutfitUniqueIds": {
    "1": 823112,
    "2": 3428323
  }
}
```

**Response:**
```json
{
  "1": {
    "uniqueId": 823112,
    "name": "Summer Fairy",
    "price": 564,
    "accessoryData": {...},
    "views": 150,
    "favourites": 23
  },
  "2": null
}
```

### POST /api/SearchOutfitsAsync
Search and filter outfits with sorting options.

**Request:**
```json
{
  "SortType": "Newest",
  "Amount": 50,
  "SearchKeyword": "Summer"
}
```

**Response:**
```json
[
  {
    "views": 0,
    "favourites": 0,
    "name": "Summer Fairy",
    "uploadTime": "2025-01-20T10:30:00Z",
    "price": 564,
    "otherUsefulMetadata": {...},
    "serializedDescription": {...},
    "uniqueId": 823112
  }
]
```

### POST /api/UploadOutfit
Upload a new outfit to the database.

**Request:**
```json
{
  "Name": "Summer Fairy",
  "AccessoryData": "{\"hat\": 123, \"shirt\": 456}",
  "Price": 564,
  "SerializedDescription": {...},
  "OtherMetadata": {...}
}
```

**Response:**
```json
8293912
```

### POST /api/IncrementViews
Increment view counts for outfits.

**Request:**
```json
[823112, 3428323, 29329832]
```

**Response:**
```json
{
  "success": true,
  "updated": 3
}
```

### POST /api/IncrementFavourites
Increment favorite counts for outfits.

**Request:**
```json
[823112, 3428323]
```

**Response:**
```json
{
  "success": true,
  "updated": 2
}
```

## Security Features

- **API Key Authentication**: All endpoints require valid X-API-Key header
- **Rate Limiting**: Configurable request limits per IP
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Parameterized queries
- **CORS Protection**: Restricted to Roblox domains
- **HTTPS Only**: SSL/TLS encryption required
- **Security Headers**: Comprehensive HTTP security headers

## Database Schema

**Outfits Table:**
- `id` - Primary key (auto-increment)
- `unique_id` - Unique outfit identifier (10-digit)
- `name` - Outfit name (max 255 chars)
- `price` - Outfit price (integer)
- `accessory_data` - JSON accessory data
- `serialized_description` - JSON outfit metadata
- `other_metadata` - Additional flexible JSON data
- `views` - View count (default 0)
- `favourites` - Favorite count (default 0)
- `upload_time` - Upload timestamp
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Indexes:**
- `unique_id` (unique)
- `name` (full-text search)
- `upload_time`, `views`, `favourites`, `price`

## Performance

- **Connection Pooling**: Efficient database connections
- **Optimized Queries**: Indexed searches and sorting
- **Rate Limiting**: Prevent abuse and overload
- **Graceful Error Handling**: Robust error responses
- **Monitoring Ready**: Health checks and logging

## File Structure

```
├── server.js              # Main API server
├── setup-database.js      # Database initialization
├── package.json           # Dependencies and scripts
├── .env.example          # Environment template
├── nginx.conf            # Nginx configuration
├── outfit-api.service    # Systemd service file
├── roblox-sdk.lua        # Roblox HTTP client SDK
├── roblox-example.lua    # Usage examples
├── DEPLOYMENT.md         # Deployment guide
└── README.md            # This file
```

## Deployment

See `DEPLOYMENT.md` for complete step-by-step deployment instructions including:
- VPS setup and security hardening
- PostgreSQL configuration
- SSL certificate installation
- Process management with PM2/systemd
- Monitoring and backup strategies

## Requirements

**Server:**
- Ubuntu 20.04+ (or similar)
- Node.js 16+
- PostgreSQL 12+
- Nginx
- 2GB+ RAM, 100GB+ storage

**Roblox:**
- HTTP requests enabled
- Valid API key for authentication

## Scaling

The system is designed to handle millions of daily requests with:
- Database connection pooling
- Optimized PostgreSQL indexes  
- Rate limiting and caching
- Horizontal scaling ready (load balancer + multiple instances)

For higher loads, consider:
- Redis caching layer
- Database read replicas
- CDN for static content
- Container orchestration (Docker + Kubernetes)

## Support

Monitor these key metrics:
- API response times (<1s)
- Database connection count
- Error rates (<5%)
- Memory/CPU usage
- Disk space

Set up alerts for anomalies and implement automated backups.

## License

This project is provided as-is for the specified client requirements. 