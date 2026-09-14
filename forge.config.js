const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');
const fs = require('fs');

// Windows 安装包已改为 electron-builder + NSIS（见 electron-builder.yml 与
// scripts/build-windows.mjs），所以这里不再保留 maker-squirrel。
// Forge 在 Windows 流程里只负责「编译 + 打包」，安装包交给 electron-builder。
const makers = [
  // macOS：dmg + zip
  {
    name: '@electron-forge/maker-dmg', // dmg 安装包
    platforms: ['darwin'],
    config: {
      icon: './build/icon.icns',
      format: 'ULFO', // LZMA 压缩，比 UDZO 更小（需 macOS 10.11+）
    },
  },
  {
    name: '@electron-forge/maker-zip', // macOS zip
    platforms: ['darwin'],
  },
];

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
    // 移除 Electron 多余语言包，只保留中文和英文（节省 ~3-5MB）
    afterExtract: [
      (buildPath, electronVersion, platform, arch, callback) => {
        const resourcesPath =
          platform === 'darwin'
            ? path.join(buildPath, 'Contents', 'Resources')
            : path.join(buildPath, 'resources');
        if (fs.existsSync(resourcesPath)) {
          const keepLocales = new Set(['zh_CN.lproj', 'en.lproj']);
          fs.readdirSync(resourcesPath).forEach((item) => {
            if (item.endsWith('.lproj') && !keepLocales.has(item)) {
              fs.rmSync(path.join(resourcesPath, item), {
                recursive: true,
                force: true,
              });
            }
          });
        }
        callback();
      },
    ],
  },
  rebuildConfig: {},
  makers,
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
