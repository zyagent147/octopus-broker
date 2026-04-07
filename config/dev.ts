import type { UserConfigExport } from "@tarojs/cli"

export default {
  
  mini: {
    debugReact: true,
    // 开发环境使用本地后端
    defineConstants: {
      PROJECT_DOMAIN: JSON.stringify('http://localhost:3000'),
    },
  },
  h5: {}
} satisfies UserConfigExport<'vite'>
