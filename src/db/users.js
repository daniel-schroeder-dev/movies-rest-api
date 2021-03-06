const faker = require('faker');
const User = require('../models/user');

const users = [];

for (let i = 0; i < 20; i++) {
  users.push(new User({
    username: faker.internet.userName(),
    password: faker.internet.password(),
    email: faker.internet.email(),
    apiKey: faker.random.uuid(),
  }));
};

users.push(new User({
  username: 'root',
  password: 'rootu$er',
  email: 'root@gmail.com',
  apiKey: faker.random.uuid(),
}));

module.exports = users;