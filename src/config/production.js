const config = {
  port: 8080,
  db: {
    connectionLimit: 100,
    host: 'localhost',
    port: 3306,
    user: 'structu_atadmin',
    password: '5trucm3',
    database: undefined,
    debug: false,
  },
  dbPrefix: 'structu',
  ccpayment: {
    base_uri: 'https://api.streampay.streamlinepayments.com/v2',
    StreamPayApi: 'Mo73IJstxHQ=',
    Origin: 'api.structure.pm',
    CreditCardMethodId: 184,
    demo: false,
    logFile: path.resolve(__dirname,'../..', 'ccpayment.log'),
  }
}
export default config;
