import 'dotenv/config';
import * as esbuild from 'esbuild';
import { copyFile, mkdir } from 'node:fs/promises';

/** @type {import('esbuild').Plugin} */
const copyPropsFile = {
  name: 'Copy properties.json',
  setup(build) {
    const PROPS_FILE_NAME = 'properties.json';
    build.onStart(async () => {
      if (!build.initialOptions.outdir) return;

      await mkdir(build.initialOptions.outdir, { recursive: true });
      copyFile(
        `./${PROPS_FILE_NAME}`,
        `${build.initialOptions.outdir}/${PROPS_FILE_NAME}`
      );
    });
  },
};

/** @type {import('esbuild').Plugin} */
const logBuildStatus = {
  name: 'Log build status',
  setup(build) {
    build.onStart(() => {
      console.clear();
      console.log('Build start..');
    });

    build.onEnd(() => {
      console.log('Build complete.');
    });
  },
};

build();
async function build() {
  const shouldWatch = process.argv.some(arg => arg === '--watch');

  const define = {};
  for (const k in process.env) {
    if (k.startsWith('TTP_APP')) {
      define[`process.env.${k}`] = JSON.stringify(process.env[k]);
    }
  }

  const ctx = await esbuild.context({
    entryPoints: ['./src/client.js', './src/server.js'],
    bundle: true,
    platform: 'node',
    outdir: './dist',
    plugins: [logBuildStatus, copyPropsFile],
    define,
  });

  if (shouldWatch) {
    await ctx.watch();
    console.log('Esbuild watching now..');
    return;
  }

  await ctx.rebuild();
  await ctx.dispose();
}
