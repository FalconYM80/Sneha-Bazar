import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Excel file path
const excelPath = path.resolve(__dirname, '../../admin/Sneha_Bazar_Product_Category_Review.xlsx');

try {
  if (!fs.existsSync(excelPath)) {
    console.error('Excel file not found:', excelPath);
    process.exit(1);
  }

  console.log('Reading Excel file:', excelPath);
  const workbook = XLSX.readFile(excelPath);
  
  console.log('\nSheet names:', workbook.SheetNames);
  
  // Check if Medium Confidence sheet exists
  const sheetName = 'Medium Confidence';
  if (!workbook.SheetNames.includes(sheetName)) {
    console.error(`Sheet "${sheetName}" not found`);
    process.exit(1);
  }
  
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON with header row
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  
  console.log(`\nExamining sheet: "${sheetName}"`);
  console.log('Total rows:', jsonData.length);
  
  if (jsonData.length > 0) {
    console.log('\nColumn names:', Object.keys(jsonData[0]));
    
    console.log('\nFirst 3 rows:');
    jsonData.slice(0, 3).forEach((row, index) => {
      console.log(`\nRow ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        console.log(`  ${key}: "${value}"`);
      });
    });
    
    // Check confidence values
    const confidenceKey = Object.keys(jsonData[0]).find(key => 
      key.toLowerCase().includes('confidence')
    );
    
    if (confidenceKey) {
      const uniqueConfidences = [...new Set(jsonData.map(row => row[confidenceKey]))];
      console.log(`\nUnique values in "${confidenceKey}":`, uniqueConfidences);
      
      const mediumCount = jsonData.filter(row => row[confidenceKey] === 'Medium').length;
      console.log(`Medium confidence rows: ${mediumCount}`);
    }
    
    // Check suggested categories
    const categoryKey = Object.keys(jsonData[0]).find(key => 
      key.toLowerCase().includes('suggested category')
    );
    
    if (categoryKey) {
      const uniqueCategories = [...new Set(jsonData.map(row => row[categoryKey]))];
      console.log(`\nUnique suggested categories (${uniqueCategories.length}):`);
      uniqueCategories.slice(0, 20).forEach(cat => console.log(`  - "${cat}"`));
      if (uniqueCategories.length > 20) {
        console.log(`  ... and ${uniqueCategories.length - 20} more`);
      }
    }
  }
  
} catch (error) {
  console.error('Error reading Excel file:', error.message);
  process.exit(1);
}
