export default function sqlFromMongo(mongoQueryObject, collectionName, fields) {
  if ((fields != null) && (collectionName == null)) {
    throw new Error("Must provide a collectionName if fields is provided.");
  }

  let JOIN_LOOKUP = {$and: " AND ", $or: " OR ", $nor: " OR "};

  let type = (function() {  // from http://arcturo.github.com/library/coffeescript/07_the_bad_parts.html
    let classToType = {};
    for (let name of "Boolean Number String Function Array Date RegExp Undefined Null".split(" ")) {
      classToType[`[object ${name}]`] = name.toLowerCase();
    }

    return function(obj) {
      let strType = Object.prototype.toString.call(obj);
      return classToType[strType] || "object";
    };
  })();

  if (type(mongoQueryObject) === 'string' && mongoQueryObject.toUpperCase().indexOf('SELECT') === 0) { // It's already SQL
    return mongoQueryObject;
  }

  const parseSingleKeyValuePair = function(key, value, collectionName) {
    switch (key) {
      case "$not":
        let s = sqlFromMongo(value, collectionName);
        if (s.indexOf("(") === 0) {
          return `NOT ${s}`;
        } else {
          return `NOT (${s})`;
        }
      case "$and": case "$or": case "$nor":
        if (type(value) !== "array") {
          throw new Error("Use of $and, $or, or $nor operator requires an array as its parameter.");
        }
        let parts = [];
        for (let o of value) {
          parts.push(sqlFromMongo(o, collectionName));
        }
        let joinOperator = JOIN_LOOKUP[key];
        s = `(${parts.join(joinOperator)})`;
        if (key === "$nor") {
          return `NOT ${s}`;
        } else {
          return s;
        }
      default:
        if (type(value) === "object") {
          parts = [];
          s = `${prefix + key} `;
          for (let valueKey in value) {
            let valueValue = value[valueKey];
            switch (valueKey) {
              case "$lt":
                parts.push(s + `< ${JSON.stringify(valueValue)}`);
                break;
              case "$gt":
                parts.push(s + `> ${JSON.stringify(valueValue)}`);
                break;
              case "$lte":
                parts.push(s + `<= ${JSON.stringify(valueValue)}`);
                break;
              case "$gte":
                parts.push(s + `>= ${JSON.stringify(valueValue)}`);
                break;
              case "$ne":
                parts.push(s + `<> ${JSON.stringify(valueValue)}`);
                break;
              case "$eq":
                parts.push(s + `= ${JSON.stringify(valueValue)}`);
                break;
              case "$in":
                if (type(valueValue) === 'array') {
                  if (valueValue.length > 100) {
                    throw new Error("In DocumentDB the maximum number of values per IN expression is 100");
                  }
                  s = JSON.stringify(valueValue);
                  s = s.substr(1, s.length - 2);
                  return `${prefix + key} IN (${s})`;
                } else {
                  return `ARRAY_CONTAINS(${prefix + valueValue}, ${key})`;
                }
                break;
              case "$nin":
                if (type(valueValue) === 'array') {
                  if (valueValue.length > 100) {
                    throw new Error("In DocumentDB the maximum number of values per IN expression is 100");
                  }
                  s = JSON.stringify(valueValue);
                  s = s.substr(1, s.length - 2);
                  return `NOT ${prefix + key} IN (${s})`;
                } else {
                  return `NOT ARRAY_CONTAINS(${prefix + valueValue}, ${key})`;
                }
                break;
              case "$size":
                return `ARRAY_LENGTH(${prefix + key}) = ${valueValue}`;
                break;
              case "$exists":
                if (valueValue) {
                  return `IS_DEFINED(${prefix + key})`;
                } else {
                  return `NOT IS_DEFINED(${prefix + key})`;
                }
                break;
              case "$isArray":
                if (valueValue) {
                  return `IS_ARRAY(${prefix + key})`;
                } else {
                  return `NOT IS_ARRAY(${prefix + key})`;
                }
                break;
              case "$isBool":
                if (valueValue) {
                  return `IS_BOOL(${prefix + key})`;
                } else {
                  return `NOT IS_BOOL(${prefix + key})`;
                }
                break;
              case "$isNull":
                if (valueValue) {
                  return `${prefix + key} IS NULL`;
                } else {
                  return `${prefix + key} IS NOT NULL`;
                }
                break;
              case "$isNumber":
                if (valueValue) {
                  return `IS_NUMBER(${prefix + key})`;
                } else {
                  return `NOT IS_NUMBER(${prefix + key})`;
                }
                break;
              case "$isObject":
                if (valueValue) {
                  return `IS_OBJECT(${prefix + key})`;
                } else {
                  return `NOT IS_OBJECT(${prefix + key})`;
                }
                break;
              case "$isString":
                if (valueValue) {
                  return `IS_STRING(${prefix + key})`;
                } else {
                  return `NOT IS_STRING(${prefix + key})`;
                }
                break;
              case "$isPrimitive":
                if (valueValue) {
                  return `IS_PRIMITIVE(${prefix + key})`;
                } else {
                  return `NOT IS_PRIMITIVE(${prefix + key})`;
                }
                break;
              case "$startsWith":
                return `STARTSWITH(${prefix + key}, ${JSON.stringify(valueValue)})`;
                break;
              case "$endsWith":
                return `ENDSWITH(${prefix + key}, ${JSON.stringify(valueValue)})`;
                break;
              case "$contains":
                return `CONTAINS(${prefix + key}, ${JSON.stringify(valueValue)})`;
                break;
              case "$geoWithin":
                return `ST_WITHIN(${prefix + key}, ${JSON.stringify(valueValue)})`;
                break;
              case "$near":
                let maxDistance = valueValue.$maxDistance;
                let minDistance = valueValue.$minDistance;
                if (maxDistance != null) {
                  if (minDistance != null) {
                    return `(ST_DISTANCE(${prefix + key}, ${JSON.stringify(valueValue.$geometry)}) <= ${maxDistance} AND ST_DISTANCE(${prefix + key}, ${JSON.stringify(valueValue.$geometry)}) >= ${minDistance})`;
                  } else {
                    return `ST_DISTANCE(${prefix + key}, ${JSON.stringify(valueValue.$geometry)}) <= ${maxDistance}`;
                  }
                }
                if (minDistance != null) {
                  return `ST_DISTANCE(${prefix + key}, ${JSON.stringify(valueValue.$geometry)}) >= ${minDistance}`;
                } else {
                  throw new Error(`No minDistance nor maxDistance found in {${prefix + key}: ${JSON.stringify(value)}}`);
                }
                break;

              default:
                throw new Error(`sql-from-mongo does not recognize {${prefix + key}: ${JSON.stringify(value)}}`);
            }
          }
          let keys = [];
          for (let key2 in value) {
            let value2 = value[key2];
            keys.push(key2);
          }
          if (keys.length === 1) {
            return parts[0];
          } else {
            return `(${parts.join(" AND ")})`;
          }
        } else {
          return `${prefix + key} = ${JSON.stringify(value)}`;
        }
    }
  };

  if ((collectionName != null) && collectionName.length > 0) {
    var prefix = collectionName + ".";
  } else {
    var prefix = "";
  }

  let keys = [];
  for (var key in mongoQueryObject) {
    var value = mongoQueryObject[key];
    keys.push(key);
  }
  if (keys.length === 1) {
    var parts = [parseSingleKeyValuePair(keys[0], mongoQueryObject[keys[0]], collectionName)];
  } else {
    var parts = [];
    for (key in mongoQueryObject) {
      var value = mongoQueryObject[key];
      let subObject = {};
      subObject[key] = value;
      parts.push(sqlFromMongo(subObject, collectionName));
    }
  }

  if (parts.length === 1) {
    var sql = parts[0];
  } else {
    var sql = `(${parts.join(" AND ")})`;
  }
  if (fields != null) {
    if (fields === '*' || (fields[0] === '*') || fields === true) {
      var fieldsString = '*';
    } else {
      let fieldStringParts = (fields.map((field) => prefix + field));
      var fieldsString = fieldStringParts.join(", ");
    }
    var sql = `SELECT ${fieldsString} FROM ${collectionName} WHERE ` + sql;
  }
  return sql;
};

export { sqlFromMongo };
