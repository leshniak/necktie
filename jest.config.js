module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'html'],
  collectCoverageFrom: ['src/**/*.{ts,tsx,js,jsx}'],
  moduleNameMapper: {
    '@lib/(.*)$': '<rootDir>/src/$1',
  },
};
