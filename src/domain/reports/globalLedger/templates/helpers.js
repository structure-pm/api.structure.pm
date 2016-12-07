import Moment from 'moment';


export default function(engine) {
  engine.registerHelper('formatDate', function(dt, format) {
    return Moment(dt).format(format);
  });

  engine.registerHelper('toMoney', function(num) {
      if (typeof num !== "number") return num
      var neg = false,
          money = num.toFixed(2);

      if (money.charAt(0) === '-') {
        money = money.slice(1);
        neg = true;
      }
      money = money.replace(/./g, function(match, offset, text) {
          return offset && match !== "." && ((text.length - offset) % 3 === 0)
            ? ',' + match
            : match;
      });
      money = `$${money}`;
      if (neg) {
        money = `(${money})`
      }
      return money;
  });
}
