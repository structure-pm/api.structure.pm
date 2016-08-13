import path from 'path';

const config = {
  logging: {
    path: path.resolve(__dirname, '..'),
  },
  db: {
    connectionLimit: 100,
    host: 'localhost',
    port: 33066,
    user: 'root',
    password: '12345678',
    database: undefined,
    debug: false,
  },
  dbPrefix: 'structudev',
}

export default config;
