export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '全局提醒设置' })
  : { navigationBarTitleText: '全局提醒设置' }
