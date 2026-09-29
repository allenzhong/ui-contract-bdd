// The app is built and served by webpack. Vitest (Vite) is used only to run the
// browser-mode component tests that emit UI contracts; it never builds the app.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  entry: './src/main.tsx',
  output: { path: path.resolve(__dirname, 'dist'), filename: 'bundle.[contenthash].js', clean: true },
  resolve: { extensions: ['.tsx', '.ts', '.js'], alias: { '@': path.resolve(__dirname, 'src') } },
  module: {
    rules: [
      { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    ],
  },
  plugins: [new HtmlWebpackPlugin({ template: './src/index.html' })],
  devServer: { port: 8080, historyApiFallback: true },
  devtool: 'source-map',
};
