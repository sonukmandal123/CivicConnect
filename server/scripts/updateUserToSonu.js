const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function updateUserNameAndEmail() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);

  console.log('Searching for John Doe (john@example.com)...');
  const user = await User.findOne({ 
    $or: [
      { email: 'john@example.com' },
      { name: 'John Doe' }
    ]
  });

  if (!user) {
    console.log('No user found with email john@example.com or name John Doe.');
    const allUsers = await User.find({}, 'name email role');
    console.log('Current users in DB:', allUsers);
  } else {
    console.log('Found user:', { id: user._id, name: user.name, email: user.email, role: user.role });
    user.name = 'Sonu Mandal';
    user.email = 'sonumandalsmve@gmail.com';
    await user.save({ validateBeforeSave: false }); // preserve existing hashed password without re-hashing
    console.log('User successfully updated to:');
    console.log({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  }

  const allUsersAfter = await User.find({}, 'name email role');
  console.log('\nAll users in database now:');
  console.table(allUsersAfter.map(u => ({ id: u._id.toString(), name: u.name, email: u.email, role: u.role })));

  await mongoose.disconnect();
  console.log('\nDone!');
}

updateUserNameAndEmail().catch(err => {
  console.error('Error updating user:', err);
  process.exit(1);
});
