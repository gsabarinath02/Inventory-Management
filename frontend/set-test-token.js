// Run this in the browser console to set a test token
localStorage.setItem('token', 'test-token');
localStorage.setItem('user', JSON.stringify({
  id: 1,
  email: 'admin@fashionstore.com',
  name: 'Admin User',
  role: 'admin'
}));
console.log('Test token set successfully!'); 