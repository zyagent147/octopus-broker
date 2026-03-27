export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '添加房源',
    })
  : {
      navigationBarTitleText: '添加房源',
    }
