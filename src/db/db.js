const mongoose = require('mongoose');
const faker = require('faker');

const User = require('../models/user');
const Movie = require('../models/movie');
const dbName = require('../../config.json').dbName;

const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
};

mongoose.connect(`mongodb://localhost:27017/${dbName}`, connectionOptions)
  .catch((error) => {
    console.log('Connection error: ', error);
  });

exports.create = async (resourceType, resource) => {
  
  let Model = {};
  
  if (resourceType === 'user') {
    Model = User;
    resource.apiKey = faker.random.uuid();
  } else {
    Model = Movie;
  }

  const doc = new Model(resource);

  // this isn't in a try...catch because the caller is expected to provide that logic. If an error is thrown here we assume it is something at the database connection level, since validations have already been run on the document to save.
  const savedDoc = await doc.save();

  return {
    statusCode: 201,
    statusMessage: `${Model.modelName} created`,
    [Model.modelName.toLowerCase()]: savedDoc,
  };

};

exports.read = async (resourceType, _id) => {

  const Model = resourceType === 'user' ? User : Movie;
  
  if (!_id) {
    const docs = await Model.find();
    return {
      statusCode: 200,
      [`${Model.modelName.toLowerCase()}s`]: docs,
    };
  }
  
  const [ doc ] = await Model.find({ _id });
  
  return {
    statusCode: 200,
    [Model.modelName.toLowerCase()]: doc,
  };

};

exports.delete = async (resourceType, _id) => {
  
  const Model = resourceType === 'user' ? User : Movie;

  const doc = await Model.findByIdAndDelete(_id);

  return {
    statusCode: 200,
    statusMessage: `${Model.modelName} deleted`,
    [Model.modelName.toLowerCase()]: doc,
  };

}

exports.update = async (resourceType, _id, update) => {
  
  const Model = resourceType === 'user' ? User : Movie;

  const updateOptions = {
    new: true,
    runValidators: true,    
  };

  try {
    
    // we have to wrap this in a try..catch because the validators will be run against the updates and will throw an error if something goes wrong.
    const doc = await Model.findByIdAndUpdate(_id, update, updateOptions);

    return {
      statusCode: 200,
      statusMessage: `${Model.modelName} updated`,
      [Model.modelName.toLowerCase()]: doc,
    };
  
  } catch (e) {
    return {
      statusCode: 400,
      statusMessage: e.message,
    };
  }

};

exports.validateApiKey = async (apiKey) => {
  const results = await User.find({apiKey});
  return results.length > 0 ? true : false;
};