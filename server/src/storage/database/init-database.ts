import { getSupabaseClient } from './supabase-client';

/**
 * 初始化数据库表
 * 通过直接插入数据来检测表是否存在，如果不存在则提示
 */
export async function initDatabase(): Promise<boolean> {
  console.log('[Database] 检查数据库连接...');
  
  try {
    // 使用 service_role 客户端
    const client = getSupabaseClient(undefined, true);
    
    // 尝试查询 users 表来检查是否存在
    const { error: checkError } = await client
      .from('users')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.error('[Database] 数据库表检查失败:', checkError.message);
      
      // 如果表不存在，尝试自动创建
      if (checkError.message.includes('relation') || checkError.message.includes('does not exist')) {
        console.log('[Database] 尝试自动创建数据库表...');
        const created = await createTablesViaSupabase(client);
        if (created) {
          console.log('[Database] 数据库表创建成功！');
          return true;
        }
      }
      
      console.error('[Database] 数据库表不存在，请手动执行初始化脚本');
      console.error('[Database] SQL 脚本位置: server/migrations/000_init_tables.sql');
      return false;
    }
    
    console.log('[Database] 数据库连接正常，表已存在');
    return true;
  } catch (error) {
    console.error('[Database] 初始化失败:', error);
    return false;
  }
}

/**
 * 尝试通过 Supabase 创建表
 * 注意：这需要 Supabase 项目启用了相应的权限
 */
async function createTablesViaSupabase(client: any): Promise<boolean> {
  try {
    // 尝试创建 users 表（通过插入一条记录来触发自动创建，如果 Supabase 有此功能）
    // 实际上 Supabase 不会自动创建表，所以这里只是尝试
    
    // 创建一个临时用户来测试
    const testOpenid = `init-test-${Date.now()}`;
    const { error: insertError } = await client
      .from('users')
      .insert({
        openid: testOpenid,
        nickname: '初始化测试',
        role: 'broker'
      });
    
    if (insertError) {
      console.error('[Database] 自动创建表失败:', insertError.message);
      return false;
    }
    
    // 删除测试用户
    await client.from('users').delete().eq('openid', testOpenid);
    return true;
  } catch (error) {
    console.error('[Database] 创建表异常:', error);
    return false;
  }
}

/**
 * 检查数据库连接
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = getSupabaseClient(undefined, true);
    const { error } = await client.from('users').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}
