import path from 'path';

const config = {
  port: 8081,
  host: 'api-dev.structure.pm',
  dbPrefix: 'structudev',
  db: {
    connectionLimit: 50,
    host: 'localhost',
    port: 3306,
    user: 'api_structudev',
    password: 'api_5trucM3dev?',
    database: undefined,
    debug: false,
    acquireTimeout: 10000,
  },
  ccpayment: {
    base_uri: 'https://api.streampay.streamlinepayments.com/v2',
    StreamPayApi: 'Mo73IJstxHQ=',
    Origin: 'api-dev.structure.pm',
    CreditCardMethodId: 184,
    demo: true,
    logFile: path.resolve(__dirname,'../..', 'ccpayment.log'),
  },
  gcloud: {
    GOOGLE_PROJECT_ID: 'structure-pm',
    GOOGLE_KEYFILE: path.resolve(__dirname, '../../gcloud-credentials.json'),
    GOOGLE_DEFAULT_BUCKET: 'structure-pm-assets-dev'
  }
}
export default config;
