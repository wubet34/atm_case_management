const bcrypt = require('bcryptjs');

const password = 'wubet@123';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nCopy this hash into SQL update');