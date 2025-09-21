import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';

export default {
  input: {
    background: 'src/background.ts',
    content: 'src/content.ts',
    // popup: 'src/popup.ts'
  },
  output: {
    dir: 'dist',
    format: 'esm'
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' }),
    copy({
      targets: [
        { src: 'src/manifest.json', dest: 'dist' },
        // { src: 'src/popup.html', dest: 'dist' }
      ]
    })
  ]
};
