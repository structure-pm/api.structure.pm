import Moment from 'moment';
import * as db from '../../../db';

export default function MaintenanceLaborReport(options) {
  const {dateRange} = options;
  const start = Moment(dateRange.startDate).format('YYYY-MM-DD');
  const end = Moment(dateRange.endDate).format('YYYY-MM-DD');
  const entryTable = `${db.getPrefix()}_log.entry`;
  const authTable = `${db.getPrefix()}_httpauth.user_auth`;

  const sql = `
    SELECT
      auth.firstName,
      auth.lastName,
      SUM(
        CASE WHEN ent.taskStart IS NOT NULL and ent.taskEnd IS NOT NULL
          THEN time_to_sec(timediff(ent.taskEnd, ent.taskStart )) / 3600
          ELSE 0 END
      ) as total_work_time,
      SUM(
        CASE WHEN ent.status=5 THEN 1 ELSE 0 END
      ) as total_jobs_closed
    FROM
      ${entryTable} ent
      LEFT JOIN ${authTable} auth on ent.username = auth.username
    WHERE
      ent.timeStamp >= '${start}' and ent.timeStamp <= '${end}'
    GROUP BY
      auth.firstName, auth.lastName`;

  return db.query(sql)
    .then(table => ({
      data: table,
      count: table.length
    }) );
}
