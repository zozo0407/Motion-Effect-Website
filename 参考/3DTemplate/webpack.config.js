const path = require('path');

module.exports = {
  mode: 'development', // 开发模式，生产环境使用 'production'
  entry: {
    bundle: './src/client.js', // 主应用入口
    editor: './src/editor.js',  // 编辑器入口
    test: './test/pp/LumiCustomTest.js' // 动态测试入口
  },
  output: {
    filename: '[name].js', // 输出文件名，[name]会被替换为entry的key
    path: path.resolve(__dirname, 'dist'), // 输出目录
    publicPath: '/dist/' // 公共路径
  },
  devtool: 'source-map', // 启用源码映射
  resolve: {
    extensions: ['.js'] // 解析扩展名
  },
  module: {
    rules: [
      {
        test: /\.(vert|frag)$/,
        type: 'asset/source' // webpack 5内置的raw-loader
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name][ext]'
        }
      }
    ]
  },
  devServer: {
    static: {
      directory: path.join(__dirname, '.'),
    },
    compress: true,
    port: 9000,
    // 禁用缓存
    headers: {
      'Cache-Control': 'no-store',
    },
    // 启用热更新
    hot: true,
    // 启用客户端日志
    client: {
      logging: 'info',
    },
  }
  // 可以添加更多Webpack配置，如加载器、插件等
};