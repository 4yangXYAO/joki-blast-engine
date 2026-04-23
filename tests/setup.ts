// Global test setup
process.env.NODE_ENV = 'test'
process.env.DATABASE_PATH = ':memory:'
process.env.LOG_LEVEL = 'error'
process.env.API_PORT = '3001'
process.env.JWT_SECRET = 'test-secret-for-testing-only'
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars!!'
