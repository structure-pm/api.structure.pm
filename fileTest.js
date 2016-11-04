var request = require('request-promise');

var filename = "myfile.txt"
var url = "https://api-dev.structure.pm/scan/upload?assetType=test&assetID=123&filename="+filename;
var options = {
  url: url,
  rejectUnauthorized: false,
  formData: {
    scan: {
      value:  '<FILE_DATA>',
      options: {
        filename: filename,
        contentType: 'text/plain'
      }
    }
  }
};

var req = request.post(options)
  .then(function(resp) { console.log('Response: ' + resp); })
  .catch(function(err) { console.log('Error!', err); })
