import XLSX from 'xlsx';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Excel file path
const excelPath = path.resolve(__dirname, '../../admin/Sneha_Bazar_Product_Category_Review.xlsx');

// Import configuration
const CONFIG = {
  dryRun: process.argv.includes('--dry-run') || process.argv.includes('-d'),
  testMode: process.argv.includes('--test') || process.argv.includes('-t'),
  testLimit: 20,
  confidenceFilter: 'Low',
  useNeedsReviewSheet: true // Use the dedicated "Needs Review" sheet
};

// Import statistics
const stats = {
  totalRows: 0,
  lowConfidenceRows: 0,
  successfullyImported: 0,
  skippedDuplicates: 0,
  skippedInvalid: 0,
  categoriesCreated: 0,
  errors: []
};

// In-memory cache for dry-run mode to track categories
const dryRunCategoryCache = new Set();

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

// Clean and validate item code
const cleanItemCode = (itemCode) => {
  if (!itemCode || typeof itemCode !== 'string') return null;
  
  // Remove common artifacts from Excel data
  let cleaned = itemCode.trim();
  
  // Remove quotes and special characters that might be Excel artifacts
  cleaned = cleaned.replace(/^['"]+|['"]+$/g, '');
  cleaned = cleaned.replace(/^']+|'+$/g, '');
  cleaned = cleaned.replace(/^]]+|]+$/g, '');
  
  // Remove leading/trailing special characters
  cleaned = cleaned.replace(/^[\^\*\~\-\_]+|[\^\*\~\-\_]+$/g, '');
  
  // Remove stray backslash artifacts (but preserve legitimate letters and numbers)
  // This handles cases like: \6580, 3\0006581, \6617, 3\0006722
  cleaned = cleaned.replace(/\\/g, '');
  
  return cleaned || null;
};

// Parse numeric field safely
const parseNumber = (value, fieldName) => {
  if (value === null || value === undefined || value === '') return null;
  
  const num = Number(value);
  if (isNaN(num)) {
    stats.skippedInvalid++;
    stats.errors.push(`Invalid ${fieldName}: "${value}"`);
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

// Find or create category
const findOrCreateCategory = async (categoryName) => {
  if (!categoryName || !isMeaningful(categoryName)) {
    return null;
  }

  let trimmedName = categoryName.trim();
  
  // Normalize "Other / Needs Review" to "Other"
  if (/^other\s*[\/\\]\s*needs\s*review$/i.test(trimmedName) || trimmedName.toLowerCase() === 'other / needs review') {
    trimmedName = 'Other';
  }
  
  // Try to find existing category (case-insensitive)
  let category = await Category.findOne({ 
    name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    isActive: true 
  });

  if (category) {
    return category._id;
  }

  // Create new category if not in dry run mode
  if (!CONFIG.dryRun) {
    try {
      category = await Category.create({
        name: trimmedName,
        isActive: true
      });
      stats.categoriesCreated++;
      console.log(`Created new category: "${trimmedName}"`);
      return category._id;
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error - try to find again
        category = await Category.findOne({ name: trimmedName, isActive: true });
        if (category) return category._id;
      }
      stats.skippedInvalid++;
      stats.errors.push(`Failed to create category "${trimmedName}": ${error.message}`);
      return null;
    }
  } else {
    // In dry run mode, use cache to track unique categories
    if (!dryRunCategoryCache.has(trimmedName)) {
      dryRunCategoryCache.add(trimmedName);
      stats.categoriesCreated++;
      console.log(`[DRY RUN] Would create category: "${trimmedName}"`);
    }
    return 'DRY_RUN_CATEGORY_ID';
  }
};

// Check for duplicate product
const isDuplicate = async (itemCode, name) => {
  if (itemCode) {
    const existingByCode = await Product.findOne({ itemCode: itemCode });
    if (existingByCode) return true;
  }
  
  // Also check by name as fallback
  const existingByName = await Product.findOne({ name: name.trim() });
  if (existingByName) return true;
  
  return false;
};

// Process a single row
const processRow = async (row) => {
  try {
    // Filter by confidence
    if (row.Confidence !== CONFIG.confidenceFilter) {
      return null;
    }

    stats.lowConfidenceRows++;

    // Validate required fields
    const name = isMeaningful(row.Name) ? row.Name.trim() : null;
    if (!name) {
      stats.skippedInvalid++;
      stats.errors.push(`Missing product name (ItemCode: ${row.ItemCode || 'N/A'})`);
      return null;
    }

    // Parse selling price (required)
    const sellingPrice = parseNumber(row['P.Rate'], 'selling price');
    if (sellingPrice === null || sellingPrice < 0) {
      stats.skippedInvalid++;
      stats.errors.push(`Invalid selling price: "${row['P.Rate']}" for product "${name}"`);
      return null;
    }

    // Clean item code
    const itemCode = cleanItemCode(row.ItemCode);

    // Check for duplicates
    if (await isDuplicate(itemCode, name)) {
      stats.skippedDuplicates++;
      console.log(`Skipping duplicate: "${name}" (ItemCode: ${itemCode || 'N/A'})`);
      return null;
    }

    // Handle company
    const company = isMeaningful(row.Company) ? row.Company.trim() : null;

    // Handle category - use Suggested Category
    const categoryId = await findOrCreateCategory(row['Suggested Category']);
    if (!categoryId && categoryId !== 'DRY_RUN_CATEGORY_ID') {
      stats.skippedInvalid++;
      stats.errors.push(`Invalid or missing category for product "${name}"`);
      return null;
    }

    // Parse optional fields
    const mrp = parseNumber(row['M.R.P.'], 'MRP');
    let stockQuantity = parseNumber(row.Stock, 'stock quantity');
    
    // Normalize negative stock to 0
    if (stockQuantity !== null && stockQuantity < 0) {
      stockQuantity = 0;
    }
    if (stockQuantity === null) {
      stockQuantity = 0; // Default to 0 if not provided
    }

    // Create product object
    const productData = {
      itemCode: itemCode || undefined,
      name: name,
      company: company || undefined,
      category: categoryId,
      sellingPrice: sellingPrice,
      mrp: mrp !== null && mrp >= 0 ? mrp : undefined,
      stockQuantity: stockQuantity,
      isAvailable: true,
      isActive: true
    };

    // Import product (unless dry run)
    if (!CONFIG.dryRun) {
      const product = await Product.create(productData);
      stats.successfullyImported++;
      console.log(`Imported: "${name}" (ItemCode: ${itemCode || 'N/A'})`);
      return product;
    } else {
      stats.successfullyImported++;
      console.log(`[DRY RUN] Would import: "${name}" (ItemCode: ${itemCode || 'N/A'}, Price: ₹${sellingPrice}, Stock: ${stockQuantity})`);
      return productData;
    }
  } catch (error) {
    stats.skippedInvalid++;
    stats.errors.push(`Error processing row: ${error.message}`);
    return null;
  }
};

// Main import function
const importProducts = async () => {
  try {
    console.log('='.repeat(60));
    console.log('LOW-CONFIDENCE PRODUCT IMPORT SCRIPT');
    console.log('='.repeat(60));
    console.log(`Mode: ${CONFIG.dryRun ? 'DRY RUN' : 'LIVE IMPORT'}`);
    console.log(`Test Mode: ${CONFIG.testMode ? `YES (limit: ${CONFIG.testLimit})` : 'NO'}`);
    console.log(`Confidence Filter: ${CONFIG.confidenceFilter}`);
    console.log('='.repeat(60));

    // Connect to database
    await connectDB();

    // Get current product count before import
    const beforeCount = await Product.countDocuments();
    console.log(`\nCurrent product count in database: ${beforeCount}`);

    // Read Excel file
    console.log('\nReading Excel file...');
    const workbook = XLSX.readFile(excelPath);
    
    // Determine which sheet to use
    let sheetName;
    if (CONFIG.useNeedsReviewSheet && workbook.SheetNames.includes('Needs Review')) {
      sheetName = 'Needs Review';
      console.log(`Using dedicated sheet: "${sheetName}"`);
    } else {
      sheetName = workbook.SheetNames[0];
      console.log(`Using first sheet: "${sheetName}"`);
    }

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    
    stats.totalRows = jsonData.length;
    console.log(`Total rows in sheet: ${stats.totalRows}`);

    // Limit rows if in test mode
    const rowsToProcess = CONFIG.testMode ? jsonData.slice(0, CONFIG.testLimit) : jsonData;
    if (CONFIG.testMode) {
      console.log(`Test mode: Processing first ${CONFIG.testLimit} rows only`);
    }

    console.log('\nProcessing rows...');
    console.log('-'.repeat(60));

    // Process rows in batches
    const batchSize = 50;
    for (let i = 0; i < rowsToProcess.length; i += batchSize) {
      const batch = rowsToProcess.slice(i, i + batchSize);
      console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(rowsToProcess.length / batchSize)} (${batch.length} rows)`);
      
      for (const row of batch) {
        await processRow(row);
      }
    }

    // Get final product count
    const afterCount = CONFIG.dryRun ? beforeCount : await Product.countDocuments();

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Product count before import: ${beforeCount}`);
    console.log(`Total Excel rows: ${stats.totalRows}`);
    console.log(`Low Confidence rows found: ${stats.lowConfidenceRows}`);
    console.log(`Successfully imported: ${stats.successfullyImported}`);
    console.log(`Skipped duplicates: ${stats.skippedDuplicates}`);
    console.log(`Skipped invalid rows: ${stats.skippedInvalid}`);
    console.log(`Categories created: ${stats.categoriesCreated}`);
    console.log(`Errors encountered: ${stats.errors.length}`);
    console.log(`Product count after import: ${afterCount}`);

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

    console.log('='.repeat(60));

    if (CONFIG.dryRun) {
      console.log('\n[DRY RUN] No changes were made to the database.');
      console.log('Run without --dry-run flag to perform actual import.');
    } else {
      console.log('\nImport completed successfully.');
    }

  } catch (error) {
    console.error('Fatal error during import:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDatabase connection closed.');
  }
};

// Run the import
importProducts();
