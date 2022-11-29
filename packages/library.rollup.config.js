import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';
import execute from 'rollup-plugin-shell';
import polyfillNode from 'rollup-plugin-polyfill-node';
import replaceImports from 'rollup-plugin-replace-imports';
import glob from 'glob';
import commonjs from '@rollup/plugin-commonjs';
import generatePackageJson from './rollup-write-package-plugin';

if (typeof process.env.OUT_DIRECTORY === 'undefined') {
	throw new Error('Environmental variable OUT_DIRECTORY is not set');
}
const outDir = process.env.OUT_DIRECTORY;
export const createConfigs = (options) => {
	const { builds, ...otherOptions } = options;
	return builds.map((build) => createConfig(build, otherOptions));
};

const createConfig = (build, options) => {
	const {
		file,
		dir,
		format,
		name,
		browser = false,
		minified = false,
		input = [],
		plugins = [],
		preserveModules = true,
	} = build;

	const { pkg, extensions = ['.js', '.ts', '.cjs'], globals = {} } = options;

	const external = (importReference) => {
		// excluding dependencies defined in package json from the bundle
		return [...Object.keys(pkg.dependencies)].some((it) => {
			return importReference.startsWith(it);
		});
	};

	const entryFileNames = `[name].js`;

	return {
		input,
		output: {
			dir,
			file,
			format,
			name,
			entryFileNames,
			preserveModules,
			sourcemap: false,
			globals,
			exports: 'named',
		},
		external,
		treeshake: {
			moduleSideEffects: false,
		},
		plugins: [
			nodeResolve({
				browser,
				// replace relative inputs to root one if possible, to simplify build
				// f.f @mailchain/crypto/a/b -> @mailchain/crypto
				dedupe: Object.keys(pkg.dependencies).filter((it) => it.startsWith('@mailchain')),
				extensions,
				preferBuiltins: !browser,
			}),
			commonjs({ requireReturnsDefault: 'auto', transformMixedEsModules: true }),
			json(),
			typescript({
				tsconfig: './tsconfig.json',
				outDir: dir,
				sourceMap: false,
			}),

			...plugins,
			...(minified ? [terser()] : []),
		],
		onwarn(warning, rollupWarn) {
			rollupWarn(warning);
			if (warning.code === 'CIRCULAR_DEPENDENCY') {
				const msg = 'Please eliminate the circular dependencies listed above and retry the build';
				throw new Error(msg);
			}
		},
	};
};

const replaceImportsPlugin = (name, pkg) =>
	replaceImports((n) =>
		Object.keys(pkg.dependencies)
			.filter((it) => it.startsWith('@mailchain'))
			.reduce((acc, rec) => acc.replace(`${rec}/`, `${rec}/${name}/`), n),
	);

// eslint-disable-next-line import/no-anonymous-default-export, import/no-default-export
export const getBundlingConfigs = (name, pkg, options = {}) => [
	...createConfigs({
		pkg,
		builds: [
			{
				// needed for crypto https://github.com/rollup/rollup/issues/3916
				input: glob.sync('src/**/index.ts'),

				bundle: true,
				browser: true,
				dir: `${outDir}/packages/${name}/browser`,
				format: 'es',
				plugins: [
					polyfillNode(),
					replaceImportsPlugin('browser', pkg),
					generatePackageJson({
						baseContents: () => {
							const { ...newPkg } = pkg;
							delete newPkg.scripts;
							delete newPkg.devDependencies;

							return {
								...newPkg,
								dependencies: pkg.dependencies,
								types: './types/index.d.ts',
								browser: './browser/index.js',
								main: './node/index.js',
							};
						},
					}),
					execute({
						commands: [
							`mv ${outDir}/packages/${name}/browser/package.json ${outDir}/packages/${name}`,
							`rm -rf ${outDir}/packages/${name}/browser/packages`,
						],
						hook: 'closeBundle',
					}),
				],
				...options,
			},
			{
				// needed for crypto https://github.com/rollup/rollup/issues/3916
				input: glob.sync('src/**/index.ts'),
				bundle: true,
				browser: false,
				dir: `${outDir}/packages/${name}/node`,
				format: 'cjs',
				plugins: [
					replaceImportsPlugin('node', pkg),
					execute({
						commands: [`rm -rf ${outDir}/packages/${name}/node/packages`],
						hook: 'closeBundle',
					}),
				],
				...options,
			},
		],
	}),
	{
		input: './src/index.ts',
		output: [{ file: `${outDir}/packages/${name}/types/index.d.ts`, format: 'es' }],
		external: (importReference) => {
			return Object.keys(pkg.dependencies).some((it) => importReference.startsWith(it));
		},
		treeshake: {
			moduleSideEffects: false,
		},
		plugins: [
			typescript({
				tsconfig: './tsconfig.json',
				outDir: `${outDir}/packages/${name}/types`,
				declaration: true,
				declarationDir: `${outDir}/packages/${name}/types`,
				noEmit: true,
				sourceMap: false,
			}),
			execute({
				commands: [
					`cp ./Readme.md ${outDir}/packages/${name}/Readme.md`,
					`rm -rf ${outDir}/packages/${name}/types/*.js`,
					`mv ${outDir}/packages/${name}/types/packages/${name}/src/* ${outDir}/packages/${name}/types`,
					`rm -rf ${outDir}/packages/${name}/types/packages`,
				],
				hook: 'closeBundle',
			}),
		],
	},
];
