import path from 'path';

const config = {
  port: 8080,
  host: 'api.structure.pm',
  db: {
    connectionLimit: 100,
    host: 'localhost',
    port: 3306,
    user: 'structu_atadmin',
    password: '5trucm3',
    database: undefined,
    debug: false,
    acquireTimeout: 10000,
  },
  dbPrefix: 'structu',
  ccpayment: {
    base_uri: 'https://api.streampay.streamlinepayments.com/v2',
    StreamPayApi: 'Mo73IJstxHQ=',
    Origin: 'api.structure.pm',
    CreditCardMethodId: 184,
    demo: false,
    logFile: path.resolve(__dirname,'../..', 'ccpayment.log'),
  },
  gcloud: {
    GOOGLE_PROJECT_ID: 'structure-pm',
    GOOGLE_KEYFILE: path.resolve(__dirname, '../../gcloud-credentials.json'),
    GOOGLE_DEFAULT_BUCKET: 'structure-pm-asset-files'
  }

}
export default config;
