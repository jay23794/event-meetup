import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath = path.resolve(process.cwd(), envFile);

if (!fs.existsSync(envPath) && envFile !== '.env') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
} else {
  dotenv.config({ path: envPath });
}
