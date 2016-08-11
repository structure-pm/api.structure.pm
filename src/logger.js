import bunyan from 'bunyan';

export default function(config) {

  return bunyan.createLogger({
    name: 'api.structure.pm.local',
    streams: [
      {
        level: ('debug'),
        stream: process.stdout
      },
      // {
      //   level: (settings.logging.file || 'info'),
      //   path: logFilespec
      // }
    ],
    serializers: {
      err: bunyan.stdSerializers.err,
      req: bunyan.stdSerializers.req
    }
  });
}
