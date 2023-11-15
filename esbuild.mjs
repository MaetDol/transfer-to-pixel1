import * as esbuild from 'esbuild';
import { copyFile } from 'node:fs/promises';

/** @type {import('esbuild').Plugin} */
const copyPropsFile = {
  name: 'Copy properties.json',
  setup(build) {
    const PROPS_FILE_NAME = 'properties.json';
    build.onStart(() => {
      if (!build.initialOptions.outdir) return;
      copyFile(
        `./${PROPS_FILE_NAME}`,
        `${build.initialOptions.outdir}/${PROPS_FILE_NAME}`
      );
    });
  },
};

const ctx = await esbuild.context({
  entryPoints: ['./src/client.js', './src/server.js'],
  bundle: true,
  platform: 'node',
  outdir: './dist',
  plugins: [copyPropsFile],
});

await ctx.watch();
console.log('Esbuild watching now..');
