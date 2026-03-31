export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '租约管理' })
  : { navigationBarTitleText: '租约管理' }
