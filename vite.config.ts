import { cpSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

const srcDir = fileURLToPath(new URL('./src', import.meta.url))

function findStylesheets(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) findStylesheets(full, found)
    else if (entry.name.endsWith('.css')) found.push(full)
  }
  return found
}

/**
 * Vite's library mode extracts CSS and drops the `import './X.css'` statement
 * from the emitted JavaScript, which would leave consumers to work out which
 * stylesheet belongs to which component. Instead we mark stylesheets as
 * external so the import survives verbatim, and copy them into the output so
 * those paths resolve — every component keeps shipping its own CSS.
 */
function componentStylesheets(): Plugin {
  let outDir = resolve(process.cwd(), 'dist')
  let enabled = false

  return {
    name: 'steam-green:component-stylesheets',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(process.cwd(), config.build.outDir)
      // Only the library build copies stylesheets; other Vite consumers
      // (Storybook) bundle them normally.
      enabled = Boolean(config.build.lib)
    },
    closeBundle() {
      if (!enabled) return
      for (const file of findStylesheets(srcDir)) {
        const dest = join(outDir, file.slice(srcDir.length + 1))
        cpSync(file, dest)
        // TypeScript keeps the `import './X.css'` statement in the declarations
        // it emits, and a stylesheet carries no types of its own, so a consumer
        // compiling with `skipLibCheck: false` would fail to resolve it. A bare
        // declaration alongside each stylesheet keeps that import resolvable.
        writeFileSync(`${dest}.d.ts`, 'export {}\n')
      }
    },
  }
}

/**
 * The output mirrors `src/`, one file per module (`preserveModules`), so a
 * consumer's bundler only has to pull in the modules it actually imports.
 * Combined with the CSS-only `sideEffects` allow-list in package.json this
 * keeps the package tree-shakable.
 *
 * An ESM-only build is intentional: CJS cannot be tree-shaken, and dual-format
 * output would emit the colocated stylesheets twice.
 *
 * Type declarations are not produced here — `tsc -p tsconfig.build.json` emits
 * them in the build script, using TypeScript's own declaration output.
 */
export default defineConfig({
  plugins: [componentStylesheets(), react()],
  build: {
    target: 'es2022',
    sourcemap: true,
    minify: false,
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
    },
    rollupOptions: {
      // React is a peer dependency; stylesheets are handled by the plugin above.
      external: [/^react($|\/)/, /^react-dom($|\/)/, /\.css$/],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
      },
    },
  },
})
