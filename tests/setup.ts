import 'dotenv/config'

// Point the app's database client at the test database before any app code loads.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
}
