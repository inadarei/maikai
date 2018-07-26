module.exports.serverUri = (server, host="", path="") => {
    const addr = server.address();
  
    const port = server.address().port;
    const protocol = 'http';
    return protocol + '://' + (host || '127.0.0.1') + ':' + port + path;
};