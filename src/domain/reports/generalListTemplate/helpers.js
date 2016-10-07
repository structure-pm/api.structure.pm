
export default function registerHelpers(handlebars) {

  handlebars.registerHelper('toMoney', function(num) {
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

  handlebars.registerHelper('capitalize', function(phrase, allwords) {
    phrase = (allwords) ? phrase.split(' ') : [phrase];
    return phrase
      .map(word => word.charAt(0).toUpperCase() + word.slice(1) )
      .join(' ');
  });


  handlebars.registerHelper('uppercase', phrase => phrase.toUpperCase());
  handlebars.registerHelper('lowercase', phrase => phrase.toLowerCase());


  handlebars.registerHelper('sum', function(...args) {
    args.pop()
    return sumArgs.apply(null, [this].concat(args));
  });

  handlebars.registerHelper('get', function(path, defaultValue) {
    return groupGet(this, path, defaultValue);
  })

  handlebars.registerHelper('csvEmpty', function(plus, options) {
    const minus = options.hash.minus || 0;
    const n = plus - minus;
    const cols = Array.from(Array(n)).map(a => '""').join(',');

    return (cols.length) ? new handlebars.SafeString(cols + ',') : '';
  })


}


export function sumArgs(group, ...args) {
  const ret = args.reduce((sum, arg) => {
    if (typeof arg === 'string') {
      let neg = false;
      if (arg.charAt(0) === '-') {
        neg = true;
        arg = arg.slice(1);
      }
      arg = groupGet(group, arg, 0);
      arg *= (neg) ? -1 : 1;
    }

    return sum + arg;
  },0);
  return ret;
}


function findGroup(key) {
  return g => g.key === key;
}
export function groupGet(group, path, defaultValue) {
  const parts = path.split('.');
  return parts.reduce((ret, part) => {
    if (!ret) return ret;

    if (ret.groups && ret.groups.find(findGroup(part))) {
      return ret.groups.find(findGroup(part));
    } else if (ret[part]) {
      return ret[part];
    } else {
      return defaultValue;
    }
  }, group);
}
