// src/lib/db.ts
import {Pool} from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // e.g., postgres://user:pass@host:port/dbname
});

export default pool;
