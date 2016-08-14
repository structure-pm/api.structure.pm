import path from 'path';

const config = {
  port: 8080,
  logging: {
    path: path.resolve(__dirname, '..'),
  },
  db: {},
}

export default config;
