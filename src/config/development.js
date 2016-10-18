const config = {
  port: 8081,
  dbPrefix: 'structudev',
  db: {
    connectionLimit: 100,
    host: 'localhost',
    port: 3306,
    user: 'api_structudev',
    password: 'api_5trucM3dev?',
    database: undefined,
    debug: false,
  },
  ccpayment: {
    base_uri: 'https://api.streampay.streamlinepayments.com/v2',
    StreamPayApi: 'Mo73IJstxHQ=',
    Origin: 'api-dev.structure.pm',
    CreditCardMethodId: 184,
    demo: true,
    logFile: path.resolve(__dirname,'../..', 'ccpayment.log'),
  }
}
export default config;
