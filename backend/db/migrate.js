import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  console.log('Running database migrations...\n');
  console.log('(Uses schema.sql as single source of truth)\n');

  const schemaPath = path.join(__dirname, 'schema.sql');
  let schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Remove comments
  schema = schema.replace(/--.*$/gm, '');
  
  // Execute the entire schema file directly
  // PostgreSQL can handle multiple statements separated by semicolons
  try {
    await pool.query(schema);
    console.log('✅ Schema executed successfully!');
  } catch (error) {
    console.log(`⚠️  Full schema execution had errors, executing statements individually...\n`);
    console.log(`   Error: ${error.message.substring(0, 200)}\n`);
    
    // Parse SQL statements more carefully
    // Split by semicolon, but only when not inside parentheses or strings
    const statements = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = null;
    
    for (let i = 0; i < schema.length; i++) {
      const char = schema[i];
      const prevChar = i > 0 ? schema[i - 1] : '';
      
      if (!inString && (char === '"' || char === "'")) {
        inString = true;
        stringChar = char;
        current += char;
      } else if (inString && char === stringChar && prevChar !== '\\') {
        inString = false;
        stringChar = null;
        current += char;
      } else if (!inString) {
        if (char === '(') {
          depth++;
          current += char;
        } else if (char === ')') {
          depth--;
          current += char;
        } else if (char === ';' && depth === 0) {
          const stmt = current.trim();
          if (stmt.length > 0) {
            statements.push(stmt);
          }
          current = '';
        } else {
          current += char;
        }
      } else {
        current += char;
      }
    }
    
    // Add last statement if exists
    const lastStmt = current.trim();
    if (lastStmt.length > 0) {
      statements.push(lastStmt);
    }
    
    console.log(`   Parsed ${statements.length} statements\n`);
    
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const stmtType = statement.substring(0, 20).toUpperCase();
      
      try {
        await pool.query(statement);
        successCount++;
        if (stmtType.includes('CREATE TABLE')) {
          const tableMatch = statement.match(/CREATE TABLE.*?(\w+)/i);
          const tableName = tableMatch ? tableMatch[1] : 'unknown';
          console.log(`   ✓ Created table: ${tableName}`);
        }
      } catch (error) {
        const errorMsg = error.message.toLowerCase();
        
        // Ignore "already exists" errors - these are expected on re-runs
        if (errorMsg.includes('already exists') || 
            errorMsg.includes('duplicate') ||
            errorMsg.includes('would create a duplicate')) {
          skippedCount++;
          continue;
        }
        // Ignore "does not exist" for indexes - table might not exist yet
        if (errorMsg.includes('does not exist') && statement.toLowerCase().includes('create index')) {
          skippedCount++;
          continue;
        }
        // Show other errors
        errorCount++;
        errors.push({ statement: statement.substring(0, 100), error: error.message });
        console.error(`   ❌ Error in statement ${i + 1}: ${error.message.substring(0, 100)}`);
      }
    }
    
    console.log(`\n✅ Migrations completed!`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Skipped (already exists): ${skippedCount}`);
    if (errorCount > 0) {
      console.log(`   ⚠️  Errors: ${errorCount}`);
      if (errors.length > 0) {
        console.log(`\n   First few errors:`);
        errors.slice(0, 3).forEach((e, i) => {
          console.log(`   ${i + 1}. ${e.error.substring(0, 150)}`);
        });
      }
    }
  }
  
  // Verify tables were created
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    const tableNames = result.rows.map(r => r.table_name);
    
    if (tableNames.length > 0) {
      console.log(`\n📊 Database tables (${tableNames.length}):`);
      tableNames.forEach(name => console.log(`   ✓ ${name}`));
      console.log(`\n✅ Database is ready!`);
    } else {
      console.log(`\n⚠️  Warning: No tables found in database!`);
      console.log(`   This might mean migrations need to be run again.`);
    }
  } catch (verifyError) {
    console.log(`\n⚠️  Could not verify tables: ${verifyError.message}`);
  }
  
  await pool.end();
  process.exit(0);
}

migrate();

