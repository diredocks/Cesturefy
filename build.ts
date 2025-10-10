// https://github.com/rollup/rollup/issues/2756
// https://github.com/rollup/rollup/issues/5601

import { access, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { build } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const SrcDirname = 'src';
const DistDirname = 'dist';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const srcPath = resolve(__dirname, SrcDirname);
const distPath = resolve(__dirname, DistDirname);

interface EntryPoint {
  inputName: string;
  inputPath: string;
  outputDirname?: string;
}

const entryPoints: EntryPoint[] = [
  { inputName: 'background', inputPath: resolve(srcPath, 'core/background.ts') },
  { inputName: 'content', inputPath: resolve(srcPath, 'core/content.ts') },
  { inputName: 'options', inputPath: resolve(srcPath, 'options/index.html'), outputDirname: 'options' },
  {
    inputName: 'popup-command',
    inputPath: resolve(srcPath, 'core/view/iframe-popup-command.html'),
    outputDirname: 'core/view',
  },
  // { inputName: 'inject', inputPath: resolve(srcPath, 'inject/index.ts') },
  // { inputName: 'popup', inputPath: resolve(srcPath, 'popup/index.html'), outputDirname: 'popup' },
];

const isWatch = process.argv.some(arg => arg.includes('--watch'));

function createConfig(entry: EntryPoint) {
  return {
    root: `${SrcDirname}${entry.outputDirname ? `/${entry.outputDirname}` : ''}`,
    base: './',
    plugins: [
      tsconfigPaths(),
    ],
    build: {
      watch: isWatch ? {} : undefined,
      minify: isWatch ? false : true,
      rollupOptions: {
        input: { [entry.inputName]: entry.inputPath },
        output: {
          inlineDynamicImports: true,
          entryFileNames: '[name].bundle.js',
          chunkFileNames: '[name].chunk.js',
          assetFileNames: '[name][extname]',
        },
      },
      outDir: `${distPath}${entry.outputDirname ? `/${entry.outputDirname}` : ''}`,
    },
    publicDir: 'static',
  };
}

async function start() {
  try {
    await access(distPath);
    await rm(distPath, { recursive: true, force: true });
  } catch {
    // let it be
  }

  for (const entry of entryPoints) {
    console.log(`Building ${entry.inputName}...`);
    await build(createConfig(entry));
  }
  console.log('All builds finished.');
}

await start();
