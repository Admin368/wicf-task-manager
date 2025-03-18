const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to the SQL functions file
const functionsFilePath = path.join(__dirname, '..', 'lib', 'check-in-functions.sql');

try {
  // Read the SQL file content
  const sqlContent = fs.readFileSync(functionsFilePath, 'utf8');
  
  console.log('Deploying SQL functions to Supabase...');
  
  // Create a temporary file with the SQL content
  const tempFilePath = path.join(__dirname, 'temp-functions.sql');
  fs.writeFileSync(tempFilePath, sqlContent);
  
  // Execute the Supabase CLI command to deploy the functions
  execSync(`supabase db query --file=${tempFilePath}`, { 
    stdio: 'inherit' // Show output in console
  });
  
  // Clean up the temporary file
  fs.unlinkSync(tempFilePath);
  
  console.log('SQL functions deployed successfully!');
} catch (error) {
  console.error('Error deploying SQL functions:', error.message);
  process.exit(1);
} 