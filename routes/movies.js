const express = require('express');
const db = require('../src/db/db');
const validate = require('./validate');

const router = express.Router();

router.use(validate.apiKeyExistsInQS);
router.use(validate.apiKeyValid);

router.get('/', async (req, res, next) => {
  try {
    const movies = await db.read('movie');
    res.json(movies);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const dbResponse = await db.read('movie', req.params.id);
    if (dbResponse.statusCode !== 200) {
      return res.status(dbResponse.statusCode).json(dbResponse);
    }
    res.json(dbResponse.movie);
  } catch (e) {
    next(e);
  }
});

router.post('/', validate.contentTypeJSON);

router.post('/', async (req, res, next) => {
  try {
    const dbResponse = await db.create('movie', req.body);
    res.status(dbResponse.statusCode).json(dbResponse);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
