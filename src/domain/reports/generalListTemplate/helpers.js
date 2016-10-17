
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

  handlebars.registerHelper('safeVal', function (value, safeValue) {
    var out = value || safeValue;
    return new handlebars.SafeString(out);
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

  handlebars.registerHelper('getColumn', getColumn);

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


function seekSubGroup(root, path) {
  const parts = path.split('.');

  // console.log("SEEKING", root.key, path);
  // console.log("---- ", root.groups.map(g => g.key))
  // console.log("---- ", root.groups.find(g => g.key === 'income'));
  // console.log("--- found", (group || {}).key)

  const group = parts.reduce((group, part) => {
    if (group === null || group === undefined) return group;
    return  (group.groups) ? group.groups.find(g => g.key === part) : null;
  }, root);
  return group;
}


export function getColumn(path, options) {
  const root = options.data.root;
  const defaultValue = options.hash.default || 0;

  if (!root.hasOwnProperty('currentColumn')) {
    throw new Error("getColumn must be called in the context of a column operation. No `currentColumn` field found");
  }

  if (!root.hasOwnProperty('group')) {
    throw new Error("getColumn must be called in the context of a group operation. No `group` field found");
  }

  const parts = path.split('.');
  const groupParts = parts.slice(0, parts.length-1).join('.');
  const aggregateName = parts[parts.length-1];


  const group = seekSubGroup(root.group, groupParts);
  return (group) ? group.aggregates[root.currentColumn][aggregateName] : defaultValue;
}
