import XLSX from 'xlsx';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Excel file path
const excelPath = path.resolve(__dirname, '../../admin/Sneha_Bazar_Product_Category_Review.xlsx');

// Update configuration
const CONFIG = {
  dryRun: process.argv.includes('--dry-run') || process.argv.includes('-d'),
  zeroRateMode: process.argv.includes('--zero-rate'),
  confidenceFilter: 'High',
  useHighConfidenceSheet: true // Use the dedicated "High Confidence" sheet if available
};

// Update statistics
const stats = {
  totalRows: 0,
  highConfidenceRows: 0,
  zeroRateRows: 0,
  productsMatched: 0,
  pricesChanged: 0,
  pricesAlreadyCorrect: 0,
  skippedInvalidRate: 0,
  skippedInvalidMrp: 0,
  productsNotFound: 0,
  successfullyUpdated: 0,
  errors: [],
  sampleCorrections: [] // Store sample corrections for display
};

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

// Clean and validate item code (same logic as import script)
const cleanItemCode = (itemCode) => {
  if (!itemCode || typeof itemCode !== 'string') return null;
  
  let cleaned = itemCode.trim();
  
  // Remove quotes and special characters that might be Excel artifacts
  cleaned = cleaned.replace(/^['"]+|['"]+$/g, '');
  cleaned = cleaned.replace(/^']+|'+$/g, '');
  cleaned = cleaned.replace(/^]]+|]+$/g, '');
  
  // Remove leading/trailing special characters
  cleaned = cleaned.replace(/^[\^\*\~\-\_]+|[\^\*\~\-\_]+$/g, '');
  
  // Remove stray backslash artifacts
  cleaned = cleaned.replace(/\\/g, '');
  
  return cleaned || null;
};

// Parse numeric field safely
const parseNumber = (value, fieldName) => {
  if (value === null || value === undefined || value === '') return null;
  
  const num = Number(value);
  if (isNaN(num)) {
    return null;
  }
  
  return num;
};

// Check if value is meaningful (not empty or placeholder)
const isMeaningful = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed !== '' && trimmed !== '-BLANK-' && trimmed !== 'N/A' && trimmed !== 'NA';
  }
  return true;
};

// Find existing product by itemCode (primary) or name (fallback)
const findExistingProduct = async (itemCode, name) => {
  if (itemCode) {
    const existingByCode = await Product.findOne({ itemCode: itemCode });
    if (existingByCode) return existingByCode;
  }
  
  // Fallback to name matching
  if (name) {
    const existingByName = await Product.findOne({ name: name.trim() });
    if (existingByName) return existingByName;
  }
  
  return null;
};

// Process a single row
const processRow = async (row) => {
  try {
    // Filter by confidence
    if (row.Confidence !== CONFIG.confidenceFilter) {
      return null;
    }

    stats.highConfidenceRows++;

    // Validate required fields
    const name = isMeaningful(row.Name) ? row.Name.trim() : null;
    if (!name) {
      stats.errors.push(`Missing product name (ItemCode: ${row.ItemCode || 'N/A'})`);
      return null;
    }

    // Parse Rate (correct selling price column)
    const rateValue = parseNumber(row.Rate, 'Rate');
    if (rateValue === null || rateValue < 0) {
      stats.skippedInvalidRate++;
      stats.errors.push(`Invalid Rate: "${row.Rate}" for product "${name}"`);
      return null;
    }

    // Track zero-rate rows
    if (rateValue === 0) {
      stats.zeroRateRows++;
    }

    // Clean item code
    const itemCode = cleanItemCode(row.ItemCode);

    // Find existing product
    const existingProduct = await findExistingProduct(itemCode, name);
    if (!existingProduct) {
      stats.productsNotFound++;
      stats.errors.push(`Product not found in database: "${name}" (ItemCode: ${itemCode || 'N/A'})`);
      return null;
    }

    stats.productsMatched++;

    let newSellingPrice;
    let skipReason = null;

    // ZERO RATE MODE: Only handle products where Rate = 0
    if (CONFIG.zeroRateMode) {
      if (rateValue > 0) {
        // Rate > 0: skip in zero-rate mode (already handled by normal correction)
        return null;
      }
      
      // Rate === 0: use MRP as selling price
      const mrpValue = parseNumber(row['M.R.P.'], 'MRP');
      if (mrpValue === null || mrpValue <= 0) {
        stats.skippedInvalidMrp++;
        stats.errors.push(`Rate = 0 but invalid MRP: "${row['M.R.P.']}" for product "${name}"`);
        return null;
      }
      
      newSellingPrice = mrpValue;
    } else {
      // NORMAL MODE: Use Rate as selling price
      if (rateValue === 0) {
        stats.skippedInvalidRate++;
        stats.errors.push(`Rate = 0 for product "${name}" (use --zero-rate flag to handle these)`);
        return null;
      }
      
      newSellingPrice = rateValue;
    }

    // Check if price needs to be changed
    const currentPrice = existingProduct.sellingPrice;
    const priceNeedsUpdate = Math.abs(currentPrice - newSellingPrice) > 0.01; // Allow small floating point differences

    if (!priceNeedsUpdate) {
      stats.pricesAlreadyCorrect++;
      return null;
    }

    // Store sample correction (limit to 10 samples)
    if (stats.sampleCorrections.length < 10) {
      stats.sampleCorrections.push({
        itemCode: existingProduct.itemCode || 'N/A',
        name: existingProduct.name,
        rate: rateValue,
        mrp: existingProduct.mrp || 'N/A',
        currentPrice: currentPrice,
        newPrice: newSellingPrice
      });
    }

    // Update product (unless dry run)
    if (!CONFIG.dryRun) {
      await Product.findByIdAndUpdate(
        existingProduct._id,
        { sellingPrice: newSellingPrice }
      );
      stats.successfullyUpdated++;
      stats.pricesChanged++;
      console.log(`Updated: "${name}" (ItemCode: ${itemCode || 'N/A'}) - Price: ₹${currentPrice} → ₹${newSellingPrice}`);
    } else {
      stats.pricesChanged++;
      console.log(`[DRY RUN] Would update: "${name}" (ItemCode: ${itemCode || 'N/A'}) - Price: ₹${currentPrice} → ₹${newSellingPrice}`);
    }

    return existingProduct;
  } catch (error) {
    stats.errors.push(`Error processing row: ${error.message}`);
    return null;
  }
};

// Main update function
const updateProductPrices = async () => {
  try {
    console.log('='.repeat(60));
    console.log('PRODUCT PRICE CORRECTION SCRIPT');
    console.log('='.repeat(60));
    console.log(`Mode: ${CONFIG.dryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
    console.log(`Mode: ${CONFIG.zeroRateMode ? 'ZERO RATE CORRECTION (Rate=0 → MRP)' : 'NORMAL CORRECTION (Rate → sellingPrice)'}`);
    console.log(`Confidence Filter: ${CONFIG.confidenceFilter}`);
    console.log('='.repeat(60));

    // Connect to database
    await connectDB();

    // Read Excel file
    console.log('\nReading Excel file...');
    const workbook = XLSX.readFile(excelPath);
    
    // Determine which sheet to use (same logic as import script)
    let sheetName;
    if (CONFIG.useHighConfidenceSheet && workbook.SheetNames.includes('High Confidence')) {
      sheetName = 'High Confidence';
      console.log(`Using dedicated sheet: "${sheetName}"`);
    } else {
      sheetName = workbook.SheetNames[0];
      console.log(`Using first sheet: "${sheetName}"`);
    }

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    
    stats.totalRows = jsonData.length;
    console.log(`Total rows in sheet: ${stats.totalRows}`);

    console.log('\nProcessing rows...');
    console.log('-'.repeat(60));

    // Process rows in batches
    const batchSize = 50;
    for (let i = 0; i < jsonData.length; i += batchSize) {
      const batch = jsonData.slice(i, i + batchSize);
      console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(jsonData.length / batchSize)} (${batch.length} rows)`);
      
      for (const row of batch) {
        await processRow(row);
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('PRICE UPDATE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Excel rows processed: ${stats.totalRows}`);
    console.log(`High Confidence rows found: ${stats.highConfidenceRows}`);
    if (CONFIG.zeroRateMode) {
      console.log(`Rows with Rate = 0: ${stats.zeroRateRows}`);
    }
    console.log(`Products matched in database: ${stats.productsMatched}`);
    console.log(`Prices that would change: ${stats.pricesChanged}`);
    console.log(`Prices already correct: ${stats.pricesAlreadyCorrect}`);
    console.log(`Skipped (invalid Rate): ${stats.skippedInvalidRate}`);
    if (CONFIG.zeroRateMode) {
      console.log(`Skipped (invalid MRP): ${stats.skippedInvalidMrp}`);
    }
    console.log(`Products not found in database: ${stats.productsNotFound}`);
    console.log(`Successfully updated: ${stats.successfullyUpdated}`);
    console.log(`Errors encountered: ${stats.errors.length}`);

    if (stats.errors.length > 0 && stats.errors.length <= 10) {
      console.log('\nError details:');
      stats.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    } else if (stats.errors.length > 10) {
      console.log('\nFirst 10 errors:');
      stats.errors.slice(0, 10).forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
      console.log(`... and ${stats.errors.length - 10} more errors`);
    }

    // Show sample corrections
    if (stats.sampleCorrections.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('SAMPLE PRICE CORRECTIONS');
      console.log('='.repeat(60));
      
      if (CONFIG.zeroRateMode) {
        console.log('ItemCode        | Name                      | Rate | MRP       | Old Price | New Price');
        console.log('-'.repeat(100));
        stats.sampleCorrections.forEach(sample => {
          const itemCode = String(sample.itemCode).padEnd(15);
          const name = String(sample.name).substring(0, 25).padEnd(25);
          const rate = `₹${sample.rate}`.padEnd(4);
          const mrp = sample.mrp !== 'N/A' ? `₹${sample.mrp}`.padEnd(9) : 'N/A       ';
          const oldPrice = `₹${sample.currentPrice}`.padEnd(9);
          const newPrice = `₹${sample.newPrice}`.padEnd(9);
          console.log(`${itemCode} | ${name} | ${rate} | ${mrp} | ${oldPrice} | ${newPrice}`);
        });
      } else {
        console.log('ItemCode        | Name                      | Old Price | New Price | MRP');
        console.log('-'.repeat(80));
        stats.sampleCorrections.forEach(sample => {
          const itemCode = String(sample.itemCode).padEnd(15);
          const name = String(sample.name).substring(0, 25).padEnd(25);
          const oldPrice = `₹${sample.currentPrice}`.padEnd(9);
          const newPrice = `₹${sample.newPrice}`.padEnd(9);
          const mrp = sample.mrp !== 'N/A' ? `₹${sample.mrp}` : 'N/A';
          console.log(`${itemCode} | ${name} | ${oldPrice} | ${newPrice} | ${mrp}`);
        });
      }
    }

    console.log('='.repeat(60));

    if (CONFIG.dryRun) {
      console.log('\n[DRY RUN] No changes were made to the database.');
      console.log('Run without --dry-run flag to perform actual price updates.');
    } else {
      console.log('\nPrice update completed successfully.');
    }

  } catch (error) {
    console.error('Fatal error during price update:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDatabase connection closed.');
  }
};

// Run the price update
updateProductPrices();
