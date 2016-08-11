import Promise from 'bluebird';

const UnknownAccounts = {
  create(uaData) {
    return Promise.resolve(1);
  }
};

export default UnknownAccounts;
