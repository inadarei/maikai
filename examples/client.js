const nf = require("node-fetch");

(async () => {
  
  const res = await nf('http://localhost:3535/health');
  console.log(res.status);
  const body = await res.json();
  console.log(body);

})();