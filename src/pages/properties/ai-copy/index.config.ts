export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: 'AI文案生成',
    })
  : {
      navigationBarTitleText: 'AI文案生成',
    }
