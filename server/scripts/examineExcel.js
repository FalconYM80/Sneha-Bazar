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
  
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to JSON with header row
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  
  console.log('\nTotal rows:', jsonData.length);
  
  if (jsonData.length > 0) {
    console.log('\nColumn names:', Object.keys(jsonData[0]));
    
    console.log('\nFirst 3 rows:');
    jsonData.slice(0, 3).forEach((row, index) => {
      console.log(`\nRow ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        console.log(`  ${key}: "${value}"`);
      });
    });
    
    // Check for Category Confidence column
    const hasCategoryConfidence = jsonData.some(row => 
      Object.keys(row).some(key => 
        key.toLowerCase().includes('confidence') || key.toLowerCase().includes('category')
      )
    );
    
    console.log('\nCategory Confidence column found:', hasCategoryConfidence);
    
    // Show unique values in confidence column if exists
    const confidenceKey = Object.keys(jsonData[0]).find(key => 
      key.toLowerCase().includes('confidence')
    );
    
    if (confidenceKey) {
      const uniqueConfidences = [...new Set(jsonData.map(row => row[confidenceKey]))];
      console.log(`\nUnique values in "${confidenceKey}":`, uniqueConfidences);
    }
  }
  
} catch (error) {
  console.error('Error reading Excel file:', error.message);
  process.exit(1);
}