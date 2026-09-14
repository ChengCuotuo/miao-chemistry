#!/usr/bin/env node
/**
 * Windows 构建入口：Electron Forge 编译打包 → electron-builder 生成 NSIS 安装包。
 *
 * 为什么分两步：
 *   Forge 的 vite 插件会把编译产物注入 MAIN_WINDOW_VITE_* 等全局变量，
 *   直接改用其它打包器就得重做整套 vite 配置。所以编译与打包仍然交给 Forge，
 *   electron-builder 只通过 --prepackaged 接管它的产物目录，专门产出安装包。
 *
 * 用法：
 *   node scripts/build-windows.mjs [--arch=x64]
 * 或走 npm script（会带上 BUILD_TYPE / DURATION 等环境变量）：
 *   npm run build:trial-win     # 优惠体验版（30 天）
 *   npm run build:official-win  # 正式版
 *   npm run build:basic-win     # 基础试用版（7 天）
 *
 * 国内网络提示：electron-builder 首次运行需要从 GitHub 下载 NSIS 工具链，
 * 慢或失败时可以指定镜像：
 *   ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
 * （CI 跑在 GitHub 机器上，不需要设置）
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const require = createRequire(import.meta.url);

const archArg = process.argv.slice(2).find((arg) => arg.startsWith('--arch='));
const arch = archArg ? archArg.split('=')[1] : 'x64';

/**
 * 解析依赖包的可执行入口。
 * 不用 node_modules/.bin（Windows 上是 .cmd 包装，需要 shell 中转，
 * 中文路径与参数容易被 cmd.exe 的代码页搞坏），直接拿 JS 入口用当前 node 执行。
 */
function resolveCliBin(packageName, binName) {
  let packageDir;
  try {
    packageDir = path.dirname(require.resolve(`${packageName}/package.json`));
  } catch {
    packageDir = path.join(rootDir, 'node_modules', packageName);
  }
  const pkg = JSON.parse(
    readFileSync(path.join(packageDir, 'package.json'), 'utf8')
  );
  const bin =
    typeof pkg.bin === 'string' ? pkg.bin : (pkg.bin || {})[binName];
  if (!bin) {
    throw new Error(`依赖 ${packageName} 未声明 ${binName} 可执行入口`);
  }
  return path.join(packageDir, bin);
}

function run(cliPath, args) {
  console.log(`\n$ node ${path.relative(rootDir, cliPath)} ${args.join(' ')}\n`);
  execFileSync(process.execPath, [cliPath, ...args], {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env,
  });
}

// ── 1) 编译 + 打包 ────────────────────────────────────────────────────────────
// 这一步同时完成：vite 构建、asar 打包、Electron Fuses、多余语言包裁剪
const forgeCli = resolveCliBin('@electron-forge/cli', 'electron-forge');
run(forgeCli, ['package', `--platform=win32`, `--arch=${arch}`]);

// ── 2) 找到 Forge 的产物目录：out/<packagerConfig.name>-win32-<arch> ─────────
const outDir = path.join(rootDir, 'out');
const packagedDirName = existsSync(outDir)
  ? readdirSync(outDir).find((name) => name.endsWith(`-win32-${arch}`))
  : undefined;
if (!packagedDirName) {
  throw new Error(
    `未找到 Forge 的打包产物（预期 out/*-win32-${arch}）。请确认上一步 package 是否成功。`
  );
}
const packagedDir = path.join(outDir, packagedDirName);
console.log(`\n✓ Forge 产物：${path.relative(rootDir, packagedDir)}\n`);

// ── 3) electron-builder 生成 NSIS 安装包 ────────────────────────────────────
// --prepackaged：直接使用上面这个已打包好的目录，不重新打包（files / fuses 等配置忽略）
// 产物：dist/miao-chemistry-Setup-<version>.exe
const builderCli = resolveCliBin('electron-builder', 'electron-builder');
run(builderCli, ['--win', 'nsis', `--${arch}`, '--prepackaged', packagedDir]);

console.log('\n✓ Windows 安装包已生成，见 dist/ 目录\n');
