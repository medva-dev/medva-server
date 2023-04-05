const crypto = require('crypto');

const hmac = crypto.createHmac('sha256', 'yoursecretkeyhere');
const data = hmac.update('qgg8vlvZRS6UYooatFL8Aw');
const signature = data.digest('hex');
console.log(signature);
