const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true, // 代码加密打包
    appVersion: process.env.npm_package_version,
    name: 'Miao Chemistry App',
    icon: './build/icon', // 自动找 icon.icns / icon.ico
    osxSign: false, // 开发阶段先不签名
    osxNotarize: false,
  },
  rebuildConfig: {},
  makers: [
    // Windows：exe + msi + zip
    {
      name: '@electron-forge/maker-squirrel', // exe 安装包
      platforms: ['win32'],
      config: {
        name: 'student-score-system',
        productName: 'Miao Chemistry App',
        iconUrl: './build/icon.ico',
        setupIcon: './build/icon.ico',
      },
    },
    {
      name: '@electron-forge/maker-wix', // msi 安装包
      platforms: ['win32'],
      config: {
        icon: './build/icon.ico',
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
  ],
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
