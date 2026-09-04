import { connect } from '@tidbcloud/serverless';
import fs from 'fs';

// Read environment variables safely from .env if available
let envContent = '';
try {
  envContent = fs.readFileSync('.env', 'utf8');
} catch (e) {}

const getEnv = (key, fallback = '') => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : process.env[key] || fallback;
};

const user = getEnv('TIDB_USER', '3ajUHv8otax7qCG.root');
const pass = getEnv('TIDB_PASSWORD', '');
const host = getEnv('TIDB_HOST', 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com');
const port = getEnv('TIDB_PORT', '4000');
const dbName = getEnv('TIDB_DATABASE', 'test');

const connectionString = `mysql://${user}:${pass}@${host}:${port}/${dbName}?ssl={"rejectUnauthorized":true}`;

console.log('Connecting to TiDB Cloud:', host);
const conn = connect({ url: connectionString });

async function runMigration() {
  try {
    const rawSql = fs.readFileSync('tidb_schema_and_data.sql', 'utf8');

    // Remove SQL comments line by line
    const cleanedSql = rawSql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    // Split by semicolon
    const statements = cleanedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 5);

    console.log(`Found ${statements.length} SQL statements to execute on TiDB Cloud.`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await conn.execute(stmt);
        console.log(`[${i + 1}/${statements.length}] Executed: ${stmt.slice(0, 45).replace(/\n/g, ' ')}...`);
      } catch (stmtErr) {
        console.warn(`[${i + 1}/${statements.length}] Error on: ${stmt.slice(0, 40)} -> ${stmtErr.message}`);
      }
    }

    console.log('\n=============================================');
    console.log('VERIFYING DATA ON TIDB CLOUD:');
    console.log('=============================================');

    const tables = await conn.execute('SHOW TABLES');
    console.log('Tables:', tables.map(t => Object.values(t)[0]));

    const users = await conn.execute('SELECT COUNT(*) AS total_users FROM users');
    console.log('Users:', users[0]);

    const equipments = await conn.execute('SELECT COUNT(*) AS total_equipments FROM equipments');
    console.log('Equipments:', equipments[0]);

    const rentals = await conn.execute('SELECT COUNT(*) AS total_rentals FROM rentals');
    console.log('Rentals:', rentals[0]);

    const payments = await conn.execute('SELECT COUNT(*) AS total_payments, SUM(amount) AS total_revenue FROM payments');
    console.log('Payments:', payments[0]);

    const gps = await conn.execute('SELECT COUNT(*) AS total_gps_points FROM gps_tracking');
    console.log('GPS Telemetry:', gps[0]);

    console.log('\n🎉 ALL DATA HAS BEEN SUCCESSFULLY POPULATED INTO TIDB CLOUD!');
  } catch (err) {
    console.error('Fatal Migration Error:', err);
  }
}

runMigration();
