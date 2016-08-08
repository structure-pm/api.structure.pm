import path from 'path';

const ENV = process.env.NODE_ENV || "development";

const config = {
  logging: {
    path: path.resolve(__dirname, '..'),
  }
}
export default config;
