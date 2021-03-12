import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

const externals = {
  ...pkg.devDependencies
};

const tsPluginConfig = {
  tsconfig: 'tsconfig.production.json',
  useTsconfigDeclarationDir: true
};

export default [
	// browser-friendly UMD build
	{
		input: 'src/index.ts',
		output: {
			name: 'necktie',
			file: pkg.browser,
			format: 'umd'
		},
		plugins: [
			resolve(),
			commonjs(),
      typescript(tsPluginConfig)
		]
	},

	// CommonJS (for Node) and ES module (for bundlers) build.
	// (We could have three entries in the configuration array
	// instead of two, but it's quicker to generate multiple
	// builds from a single configuration where possible, using
	// an array for the `output` option, where we can specify
	// `file` and `format` for each target)
	{
		input: 'src/index.ts',
		external: Object.keys(externals),
		plugins: [
      typescript(tsPluginConfig) // so Rollup can convert TypeScript to JavaScript
		],
		output: [
			{ file: pkg.main, format: 'cjs' },
			{ file: pkg.module, format: 'es' }
		]
	}
];
