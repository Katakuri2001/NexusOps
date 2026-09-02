// Run this to generate password hashes: node generate-hashes.js
const crypto = require('crypto');

async function hash(password) {
  const salt = crypto.randomBytes(16);
  return new Promise((resolve) => {
    crypto.pbkdf2(password, salt, 100000, 32, 'sha256', (err, hash) => {
      const saltHex = salt.toString('hex');
      const hashHex = hash.toString('hex');
      resolve(`${saltHex}:${hashHex}`);
    });
  });
}

(async () => {
  console.log('admin123:', await hash('admin123'));
  console.log('customer123:', await hash('customer123'));
  console.log('tech123:', await hash('tech123'));
})();
