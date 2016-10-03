import path from 'path';

const config = {
  port: 8080,
  logging: {
    path: path.resolve(__dirname, '..'),
  },
  db: {},
  ccpayment: {
    base_uri: 'https://api.streampay.streamlinepayments.com/v2',
    StreamPayApi: 'Mo73IJstxHQ=',
    Origin: 'api.structure.pm',
    CreditCardMethodId: 184,
    demo: true,
    logFile: path.resolve(__dirname,'../..', 'ccpayment.log'),
  }
}

export default config;
