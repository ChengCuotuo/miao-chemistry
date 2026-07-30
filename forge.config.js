const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const { pathToFileURL } = require('url');
const path = require('path');

// 根据当前运行平台动态生成 makers
// maker-squirrel / maker-wix 依赖 Windows 环境，无法在 macOS 上运行
const isMacOS = process.platform === 'darwin';

const makers = [
  // Windows：exe + zip
  {
    name: '@electron-forge/maker-squirrel', // exe 安装包
    platforms: ['win32'],
    config: {
      name: 'student-score-system',
      productName: 'Miao积分管理',
      // iconUrl 必须是合法 URL（NuGet nuspec 要求），用 file:// 协议转换本地路径
      iconUrl: pathToFileURL(path.resolve('./build/icon.ico')).href,
      setupIcon: './build/icon.ico',
    },
  },
  {
    name: '@electron-forge/maker-zip', // Windows 绿色 zip
    platforms: ['win32'],
  },

  // macOS：dmg + zip
  {
    name: '@electron-forge/maker-dmg', // dmg 安装包
    platforms: ['darwin'],
    config: {
      icon: './build/icon.icns',
      format: 'UDZO',
    },
  },
  {
    name: '@electron-forge/maker-zip', // macOS zip
    platforms: ['darwin'],
  },
];

// macOS 上跨平台构建 win32 时，过滤掉无法运行的 maker（maker-squirrel 依赖 Windows 环境）
const filteredMakers = isMacOS
  ? makers.filter((m) => m.name !== '@electron-forge/maker-squirrel')
  : makers;

module.exports = {
  packagerConfig: {
    asar: true, // 代码加密打包
    appVersion: process.env.npm_package_version,
    name: 'Miao积分管理',
    icon: './build/icon', // 自动找 icon.icns / icon.ico
    osxSign: false, // 开发阶段先不签名
    osxNotarize: false,
    // ignore 由 @electron-forge/plugin-vite 自动设置（排除所有非 .vite/ 文件）
    // 不要手动设置 ignore，否则会覆盖插件默认行为导致产物变大
  },
  rebuildConfig: {},
  makers: filteredMakers,
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
        // If you are familiar with Vite configuration, it will look really familiar.
        build: [
          {
            // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
            entry: 'src/main.js',
            config: 'vite.main.config.mjs',
            target: 'main',
          },
          {
            entry: 'src/preload.js',
            config: 'vite.preload.config.mjs',
            target: 'preload',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.mjs',
          },
        ],
      },
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
