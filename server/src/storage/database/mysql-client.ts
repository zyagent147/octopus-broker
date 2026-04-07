import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { execSync } from 'child_process';

let envLoaded = false;
let pool: Pool | null = null;

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

function loadEnv(): void {
  if (envLoaded) return;

  // 优先使用 dotenv
  try {
    require('dotenv').config();
  } catch {
    // dotenv not available
  }

  // 如果环境变量已设置，跳过
  if (process.env.WECHAT_MYSQL_HOST) {
    envLoaded = true;
    return;
  }

  // 尝试从 Python SDK 获取环境变量
  try {
    const pythonCode = `
import os
import sys
try:
    from coze_workload_identity import Client
    client = Client()
    env_vars = client.get_project_env_vars()
    client.close()
    for env_var in env_vars:
        print(f"{env_var.key}={env_var.value}")
except Exception as e:
    print(f"# Error: {e}", file=sys.stderr)
`;

    const output = execSync(`python3 -c '${pythonCode.replace(/'/g, "'\"'\"'")}'`, {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const lines = output.trim().split('\n');
    for (const line of lines) {
      if (line.startsWith('#')) continue;
      const eqIndex = line.indexOf('=');
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex);
        let value = line.substring(eqIndex + 1);
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  } catch {
    // Silently fail
  }

  envLoaded = true;
}

function getDatabaseConfig(): DatabaseConfig {
  loadEnv();

  const host = process.env.WECHAT_MYSQL_HOST || 'localhost';
  const port = parseInt(process.env.WECHAT_MYSQL_PORT || '3306', 10);
  const user = process.env.WECHAT_MYSQL_USER || 'root';
  const password = process.env.WECHAT_MYSQL_PASSWORD || '';
  const database = process.env.WECHAT_MYSQL_DATABASE || 'wechat_cloud';

  return { host, port, user, password, database };
}

/**
 * 获取 MySQL 连接池
 */
export async function getPool(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  const config = getDatabaseConfig();
  
  pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

  return pool;
}

/**
 * 执行查询并返回结果
 */
export async function query<T extends RowDataPacket[]>(
  sql: string,
  params?: any[]
): Promise<T> {
  const p = await getPool();
  const [rows] = await p.query<T>(sql, params);
  return rows;
}

/**
 * 执行插入/更新/删除操作
 */
export async function execute(
  sql: string,
  params?: any[]
): Promise<ResultSetHeader> {
  const p = await getPool();
  const [result] = await p.execute<ResultSetHeader>(sql, params);
  return result;
}

/**
 * 获取单个连接（用于事务）
 */
export async function getConnection(): Promise<PoolConnection> {
  const p = await getPool();
  return p.getConnection();
}

/**
 * 关闭连接池
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export { loadEnv };
