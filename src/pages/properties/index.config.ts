export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '房源管理',
      enablePullDownRefresh: true,
    })
  : {
      navigationBarTitleText: '房源管理',
      enablePullDownRefresh: true,
    }
