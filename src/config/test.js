import path from 'path';

const config = {
  dbPrefix: 'structutest',
  host: 'localhost:8080',
  db: {
    connectionLimit: 100,
    host: 'localhost',
    port: 33066,
    user: 'root',
    password: '12345678',
    // database: undefined,
    debug: false,
    acquireTimeout: 10000,
  },
  gcloud: {
    GOOGLE_PROJECT_ID: 'structure-pm',
    GOOGLE_KEYFILE: path.resolve(__dirname, '../../gcloud-credentials.json'),
    GOOGLE_DEFAULT_BUCKET: 'structure-pm-assets-dev'
  }
}
export default config;
