import { nodeResolve } from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: './src/index.js',
  output: {
    dir: 'output',
    format: 'umd',
    name: 'TokenFetchJS'
  },
  plugins: [
    json(),
    nodeResolve({
      browser: process.env.BROWSER_EXPORT === 'true'
    }),
    commonjs()
  ]
}