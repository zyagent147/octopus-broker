// 数据库迁移脚本 - 使用 Supabase 执行 SQL
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  // 从环境变量获取 Supabase 配置
  const supabaseUrl = process.env.COZE_SUPABASE_URL;
  const supabaseKey = process.env.COZE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 缺少 Supabase 环境变量');
    console.error('请确保已配置 COZE_SUPABASE_URL 和 COZE_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  console.log('📦 正在连接 Supabase...');
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // 读取迁移文件
  const migrationFile = path.join(__dirname, '../migrations/001_add_role_and_providers.sql');
  const sql = fs.readFileSync(migrationFile, 'utf8');

  console.log('📝 正在执行迁移...');
  console.log('SQL 内容预览:');
  console.log(sql.substring(0, 200) + '...\n');

  try {
    // 使用 RPC 执行原始 SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ 迁移失败:', error.message);
      console.error('详细信息:', error);
      console.log('\n💡 请尝试以下方法:');
      console.log('1. 在 Supabase 控制台打开 SQL 编辑器');
      console.log('2. 复制 server/migrations/001_add_role_and_providers.sql 文件内容');
      console.log('3. 在 SQL 编辑器中执行');
      process.exit(1);
    }

    console.log('✅ 迁移成功完成!');
    console.log('已添加:');
    console.log('  - users.role 列（用户角色）');
    console.log('  - providers 表（服务商管理）');
    console.log('  - 相关索引和 RLS 策略');
  } catch (err) {
    console.error('❌ 执行出错:', err);
    console.log('\n💡 请手动执行迁移:');
    console.log('1. 打开 Supabase 控制台: https://supabase.com/dashboard');
    console.log('2. 选择你的项目');
    console.log('3. 点击 SQL Editor');
    console.log('4. 复制并执行 server/migrations/001_add_role_and_providers.sql');
    process.exit(1);
  }
}

runMigration();
