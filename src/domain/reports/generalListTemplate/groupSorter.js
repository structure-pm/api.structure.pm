// =============================================================================
// ==== GROUP SORTING
// =============================================================================
function sortAscending(a, b) {
  if (a.key>b.key) return 1;
  else if (a.key<b.key) return -1;
  else return 0;
}

function sortDescending(a,b) {
  return -1 * sortAscending(a,b);
}

function sortByArray(ary) {
  return function(a, b) {
    return ary.indexOf(a.key) - ary.indexOf(b.key);
  }
}

export default function groupSorter(sortBy) {
  if (!sortBy) {
    return (a,b) => 1;
  } else if (sortBy.toLowerCase() === 'asc') {
    return sortAscending;
  } else if (sortBy.toLowerCase() === 'desc') {
    return sortDescending;
  } else if (typeof sortBy === 'function' ) {
    return sortBy;
  } else if (Array.isArray(sortBy)) {
    return sortAry(sortBy);
  }
}
