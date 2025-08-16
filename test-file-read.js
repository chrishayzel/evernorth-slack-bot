import fs from 'fs';

console.log('🔍 Testing file reading...');

const filePath = 'evernorth-company-data.txt';

console.log('File path:', filePath);
console.log('File exists:', fs.existsSync(filePath));

if (fs.existsSync(filePath)) {
  const stats = fs.statSync(filePath);
  console.log('File size (bytes):', stats.size);
  
  const content = fs.readFileSync(filePath, 'utf8');
  console.log('Content length:', content.length);
  console.log('First 100 characters:', content.substring(0, 100));
} else {
  console.log('❌ File not found!');
}
