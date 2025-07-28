const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Create outfits table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS outfits (
        id SERIAL PRIMARY KEY,
        unique_id BIGINT UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        price INTEGER DEFAULT 0,
        accessory_data JSONB NOT NULL,
        serialized_description JSONB,
        other_metadata JSONB DEFAULT '{}',
        views INTEGER DEFAULT 0,
        favourites INTEGER DEFAULT 0,
        upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_outfits_unique_id ON outfits(unique_id);
      CREATE INDEX IF NOT EXISTS idx_outfits_name ON outfits USING gin(to_tsvector('english', name));
      CREATE INDEX IF NOT EXISTS idx_outfits_upload_time ON outfits(upload_time);
      CREATE INDEX IF NOT EXISTS idx_outfits_views ON outfits(views);
      CREATE INDEX IF NOT EXISTS idx_outfits_favourites ON outfits(favourites);
      CREATE INDEX IF NOT EXISTS idx_outfits_price ON outfits(price);
    `);

    // Create function to update updated_at timestamp
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create trigger to auto-update updated_at
    await pool.query(`
      DROP TRIGGER IF EXISTS update_outfits_updated_at ON outfits;
      CREATE TRIGGER update_outfits_updated_at
        BEFORE UPDATE ON outfits
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('Database setup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase(); 