#!/usr/bin/env node

/**
 * Database migration script for adding status_summary column
 * Run this to get the SQL to execute in Supabase
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🗄️  Supabase Migration: Add status_summary Column');
console.log('═'.repeat(60));

try {
  // Read the migration SQL file
  const migrationSQL = readFileSync(
    join(__dirname, 'sql', 'add_status_summary_column.sql'),
    'utf8'
  );

  console.log('📋 Execute this SQL in your Supabase SQL Editor:');
  console.log('─'.repeat(60));
  console.log(migrationSQL);
  console.log('─'.repeat(60));
  
  console.log('\n🚀 Steps to apply:');
  console.log('1. Go to your Supabase Dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Paste the SQL above');
  console.log('4. Click "Run"');
  console.log('5. Verify the column was added');
  
  console.log('\n✅ After migration, your sync function will populate:');
  console.log('   • disciplineLevel: "CRISIS" | "GROWTH" | "STUCK" | "STABLE"');
  console.log('   • disciplineMessage: AI-generated motivational text');
  console.log('   • notificationTitle: Dynamic notification header');
  console.log('   • notificationMessage: Dynamic notification content');
  
} catch (error) {
  console.error('❌ Error reading migration file:', error.message);
  process.exit(1);
}
