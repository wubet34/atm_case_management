const User = require('./models/User');
const dotenv = require('dotenv');
dotenv.config();

const testLogin = async () => {
  try {
    const email = 'admin@example.com';
    const password = 'admin123';
    
    console.log('Testing login for:', email);
    
    const user = await User.findByEmail(email);
    
    if (!user) {
      console.log('User not found!');
      return;
    }
    
    console.log('User found:', { id: user.id, email: user.email, role: user.role });
    console.log('Stored password hash:', user.password);
    
    const isValid = await User.verifyPassword(user, password);
    console.log('Password valid:', isValid);
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testLogin();