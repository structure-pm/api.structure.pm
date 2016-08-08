import path from 'path';

const ENV = process.env.NODE_ENV || "development";

export default const {
  logging: {
    path: path.resolve(__dirname, '..');
  }
}
