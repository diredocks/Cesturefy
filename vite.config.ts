import { defineConfig } from 'vite';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve' || mode === 'development';

  return {
    plugins: [
      tsconfigPaths(),
      viteStaticCopy({
        targets: [{ src: 'src/manifest.json', dest: '.' }]
      })
    ],
    build: {
      outDir: 'dist',
      // sourcemap: isDev,
      minify: isDev ? false : 'esbuild',
      rollupOptions: {
        input: {
          background: path.resolve(__dirname, 'src/background.ts'),
          content: path.resolve(__dirname, 'src/content.ts'),
        },
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
          compact: !isDev,
        }
      },
      emptyOutDir: isDev ? false : true,
    }
  };
});
