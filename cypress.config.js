const { defineConfig } = require('cypress');

module.exports = defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    charts: true,
    reportPageTitle: 'Echo Project E2E Test Report',
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false,
  },
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on);
      
      // 任务注册
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        table(message) {
          console.table(message);
          return null;
        },
      });

      // 浏览器启动配置
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.name === 'chrome') {
          // 添加 Chrome 的语音权限
          launchOptions.args.push('--use-fake-ui-for-media-stream');
          launchOptions.args.push('--use-fake-device-for-media-stream');
          launchOptions.args.push('--autoplay-policy=no-user-gesture-required');
        }
        return launchOptions;
      });

      return config;
    },
    env: {
      // 测试环境变量
      apiUrl: 'http://localhost:8000',
      mockEnabled: true,
    },
    // 测试文件匹配模式
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    // 排除的文件
    excludeSpecPattern: [
      '**/node_modules/**',
      '**/dist/**'
    ],
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
  },
});
