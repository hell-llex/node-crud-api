import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import webpackNodeExternals from 'webpack-node-externals';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  entry: './src/index.ts',
  target: 'node',
  output: {
    filename: 'bundle.js',
    path: path.resolve(process.cwd(), 'dist'),
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  externals: [webpackNodeExternals()],
  plugins: [
    new CleanWebpackPlugin(),
  ],
  optimization: {
    minimize: isProduction,
    minimizer: [new TerserPlugin()],
  },
  devtool: isProduction ? false : 'inline-source-map',
  mode: isProduction ? 'production' : 'development',
};