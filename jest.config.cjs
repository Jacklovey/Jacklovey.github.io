module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '^../services/apiClient$': '<rootDir>/src/services/__mocks__/apiClient.js',
    '^../../services/apiClient$': '<rootDir>/src/services/__mocks__/apiClient.js',
    '^@/services/apiClient$': '<rootDir>/src/services/__mocks__/apiClient.js'
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.(js|jsx)$))'
  ],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/**/*.d.ts',
    '!src/**/__mocks__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 85,
      lines: 80,
      statements: 80
    },
    'src/hooks/**/*.js': {
      branches: 85,
      functions: 90,
      lines: 85,
      statements: 85
    },
    'src/utils/**/*.js': {
      branches: 90,
      functions: 95,
      lines: 90,
      statements: 90
    },
    'src/components/**/*.{js,jsx}': {
      branches: 75,
      functions: 80,
      lines: 75,
      statements: 75
    }
  }
};