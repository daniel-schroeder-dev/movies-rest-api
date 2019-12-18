const path = require('path');
const fs = require('fs');
const util = require('util');

const mongoose = require('mongoose');
const User = require('../src/models/user');
const Movie = require('../src/models/movie');
const db = require('../src/db/db');

const readFile = util.promisify(fs.readFile);
const rootApiKeyPath = path.join(__dirname, '../rootApi.key');

exports.apiKeyExistsInQS = (req, res, next) => {
  if (!req.query.apiKey) {
    return res.status(400).json({
      statusCode: 400,
      statusMessage: `Access to ${req.method} ${req.baseUrl} requires an apiKey in the query string`,
    });
  }
  next();
};

exports.apiKeyValid = async (req, res, next) => {
     
  try {
    
    const isValidApiKey = await db.validateApiKey(req.query.apiKey);

    if (!isValidApiKey) {
      return res.status(401).json({
        statusCode: 401,
        statusMessage: 'Must provide a valid API Key',
      });
    }
  
    next();
  
  } catch (e) {
    next(e);
  } 

};

exports.rootApiKeyMatch = async (req, res, next) => {
  
  try {

    const rootApiKey = await readFile(rootApiKeyPath, 'utf8');
    
    if (rootApiKey !== req.query.apiKey) {
      return res.status(401).json({
        statusCode: 401,
        statusMessage: 'Must provide a valid API Key',
      });
    }

    next();

  } catch (e) {
    next(e);
  }

};

exports.contentTypeJSON = (req, res, next) => {
  if (req.get('Content-Type') !== 'application/json') {
    return res.status(400).json({
      statusCode: 400,
      statusMessage: `Requests to ${req.method} ${req.baseUrl} must have the following header: 'Content-Type: application/json'`,
    });
  }
  next();
}

exports.id = async (req, res, next, _id) => {

  const Model = req.baseUrl === '/users' ? User : Movie;

  const errorObj = {
    statusCode: 400,
    statusMessage: `No ${Model.modelName.toLowerCase()} found with that id`,
  };

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(errorObj.statusCode).json(errorObj);
  } 

  const [ doc ] = await Model.find({ _id });
  
  if (!doc) {
    return res.status(errorObj.statusCode).json(errorObj);
  }

  next();
  
}

exports.currentUserOrRootUser = async (apiKey, userApiKey) => {
  const rootApiKey = await readFile(rootApiKeyPath, 'utf8');
  return userApiKey === apiKey || rootApiKey === apiKey;
};