export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '应收账单' })
  : { navigationBarTitleText: '应收账单' }
