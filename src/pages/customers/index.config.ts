export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '客户管理',
      enablePullDownRefresh: true,
    })
  : {
      navigationBarTitleText: '客户管理',
      enablePullDownRefresh: true,
    }
