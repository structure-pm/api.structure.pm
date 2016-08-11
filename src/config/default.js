const config = {
  logging: {
    path: path.resolve(__dirname, '..'),
  },
  db: {
    connectionLimit: 100,
    host: '192.168.10.10',
    user: 'structulocal',
    password: '12345678',
    database: undefined,
    debug: false,
  }
}
export default config;
