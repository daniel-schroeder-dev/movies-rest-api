# Development Blog

I'm going to use this 'blog' as a place to summarize my work each day, or maybe just after each major section of the app is completed. I envision this document as a place where I can have a record of my thought process as the app evolves. 

## 12-09-2019

#### General Request -> Response Structure

Started working on the actual app structure today, as opposed to the README, db population, and general pre-planning that I had been doing for the past few days. I started and completed work on the POST /users route today. I'm not sure if I will keep the same structure throughout the project, but here is what I have so far for the POST /users route:

1. A request comes in to the route-handler.
2. Content-Type headers are validated first to ensure JSON is passed in.
3. Body of the request is passed to the db.create() to perform validations against the User model and save to the db.
4. db.create checks to make sure that the User data is valid, then saves the user to the database. It returns a JSON object on validation errors or success. If there is some sort of db connection error, it is not handled here, so an error is thrown.
5. The route handler recieves a response from the db.create() method, and returns it to the caller. If an error was thrown in db.create(), the catch() handler will pass this along to app-level error-handling middleware via a call to next(error).

#### Error Responses

I don't love the fact that an error response can be sent in three different places, but I think this is the correct way to handle this. Down the line, I may find a better solution. Right now, errors are handled:

- In the route-handler after sniffing the headers.
- In the db.js file, if validation errors occur. (The response itself is sent in the route-handler, but the object is created and returned in the db.js file)
- In the app.js file, as error-handling middleware. 

#### Development Workflow

My development workflow seems to be progressing as such:

1. Setup a Postman request (valid or invalid).
2. Setup a Postman test that has the expected response status code and status message.
3. Work on getting the expected response to this request.
4. Run the Postman Collection Runner after each new request is successfully handled to ensure that I didn't break anything in the other requests.

#### Postman Command-Line Tool

I would like to add Newman, a command-line tool for running Postman requests, to the project in the near future. I said I wasn't going to do testing on this project, but it seems like testing the HTTP requests is required, unless I want to pull my hair out manually checking all requests after each edit. 

## 12-10-2019

#### NPM Scripts

I added an npm script that allows the user to delete all users and movies from the database by running `npm run flush-db`. I mainly did this because I'm constantly needing to empty out the database and start over during development, so I wanted a quicker way to accomplish this task.

#### Database Name

I had hard-coded in the database name originally, but I decided that when the database is initially populated I would have the user enter in the database name like so: `npm run db {dbName}`. This required creating a `config.json` file in the root directory that will store the dbName, and then pulling the dbName from that file whenever a connection to the database is needed.

#### Trim The Fat

I created the app with `express-generator`, and as such there was some unneccessary stuff included in the app that I went ahead and removed, just so I wouldn't have to have the extra clutter.

#### GET /movies

Setup the route-handler for the `GET /movies` route, which requires a valid api key in order to access the Movies collection in the DB. Tested the route with valid and invalid api keys in Postman. Nothing too difficult about this route, and the `GET /users` route will be almost the same, except will be restricted to the root users api key only. 

## 12-11-2019

#### GET /movies/:id

Setup the route-handler for the `GET /movies/:id` route. There were some interesting problems to solve in this route-handler, namely, the fact that an invalid :id parameter could throw different errors depending on whether or not it was a valid ObjectID. Since mongoose tries to cast id params into an ObjectId, I would get a cast error when trying to search for a movie with an id parameter that was an invalid ObjectId. I found a neat way to solve this by using the `mongoose.Types.ObjectId.isValid()` method to check whether the id was a valid ObjectId BEFORE running the db query and throwing the cast error. 

This error provided me with another challenge though, since I wanted to send the same response for invalid ID's, regardless of whether they were invalid ObjectId's or just an id that didn't exist in the db. To keep the code dry, I decided to create an error object, and then return that if the ObjectID was invalid, or if no movie was returned from the Movie.find() call. Here is the relevant snippet, where `errorObj` is returned before a db call if the id is an invalid ObjectId, or after the db call if there is no doc found with that id:

```javascript

const errorObj = {
    statusCode: 400,
    statusMessage: `No ${Model.modelName.toLowerCase()} found with that id`,
  };

if (!mongoose.Types.ObjectId.isValid(_id)) return errorObj;

const [ doc ] = await Model.find({ _id });

if (!doc) return errorObj;

return {
  statusCode: 200,
  [Model.modelName.toLowerCase()]: doc,
};

```

I don't think I've used this pattern before, of creating an error object and then using it is different places. It works though!

#### db.read()

I refactored `db.read()` to work for reading all resources or a single resource, depending on whether or not a second parameter (id) was passed in. If no id param is passed in, the method just reads all the documents from the db. If an id parameter is passed in, some validation kicks in and a single document is returned. I'm not sure if this is good practice or not. In one sense, a method should do one thing. So, I should have a readAll method for getting all resources and a readOne() method for getting one resource. On the other hand, it's a simple check to see if an id param was passed in, and to run different logic. The method was 2 lines before, which hardly did anything:

```javascript
const Model = resourceType === 'user' ? User : Movie;
return await Model.find();
```

Now, there is more going on, but those two lines are executed right away in no id is passed in, or some other stuff happens if an id is passed in. 

#### Handling DB Errors

I'm still not sure how to best handle db related connection errors, or even what kind of errors to be guarding against for db calls. Currently, I'm just sticking db code in a try...catch, and then if an error is thrown I'm passing it along to app-level middleware and saying it's a 500 error. I'm sure this isn't the best way to handle things, but I haven't come across anything in my studies to show me the correct way to handle this at this point, so I'm going with this method!

## 12-12-2019

#### GET /users

Began implementing the GET /users route today, but spent most of my time working on tests and how to structure route-handler validation. This route should be pretty straightforward to get done, considering I've already implemented db.read() to be model-agnostic.

#### Route-Handler Validation

Created a file validate.js to hold middleware functions for validating api keys, and eventually any other router-level validations. I like this pattern for middleware validation, as it seems cleaner and easier to read than including the validation inside the actual route-handler:

```javascript
router.use(validate.apiKeyInQS);
router.use(validate.rootApiKeyMatch);

router.get('/', (req, res, next) => {
  // pull all users from DB
});
```

Will refactor the movie router to use this pattern later.

#### Postman Tests

Realized that my Postman tests were a little shoddy. I know how to check for response status codes, particular values of fields, and return value types in responses. I am not sure how to do more advanced validation of responses, such as ensuring a call to GET /users returns an array of user objects. I know how to do this in JS, just not sure about the syntax using pm.test() at this point. Need to investigate this, as it will make development easier and the app more robust. I said I wasn't going to get bogged down in testing, but this seems like a worthwhile side-step.

#### TODO.md

Created another file that I will use everyday in my development workflow, TODO.md. Currently, I have a bunch of notebooks on my desk with different TODO's for the app. Having this file will allow me to keep the TODOs bundled with the app, and I can strikethrough them as I go and include the relevant commit(s) that compelete the TODOs, which will give me a nice record of how I handled different issues during development.

## 12-16-2019

#### Completing TODOs

I accomplished these TODOs first-thing today:

- Nodemon Dev Dependency
- Route-Handler Middleware Validation
- Postman Tests
- Return Users at GET /users
- Tell README.md About This File

I'm leaving the 'Postman API Keys' section undone, but only because that will be kind of a big project I think, and I want to get back to working on the app itself instead of the peripherial stuff. It was nice to just mark all of these things done right away, I think I will try and keep that pattern to my development workflow.

#### Updated Development Workflow

Here's how I'm structuring my development sessions at this point:

1. Read through the README to remind myself of the project's goals
2. Read through the previous sessions dev blog
3. Read through the TODOs
4. Read through the git log from last session
5. Try and complete any TODOs that are solvable at this point in the project
6. Begin work on new features
7. Add TODOs as they come up
8. Add entries to dev blog during the session and at the end

#### GET /users/:id

Setup the route-handler for GET /users/:id. I realized as I was setting up this route handler that I don't really like the app-architecture at this point. Validations are being done sometimes in router.use(), sometimes in db.js, others in the actual route-handler. I'm creating the response object in db.js in some instances, and in others I'm doing it right in the route-handler. I need to find a way to get some better consistency. At this point, I'm not going to focus on that so much though, I just want to get most of the routes built out.

#### API Keys in Postman Tests

I found a better way to setup the API keys in my postman tests, by using environment variables. When I eventually get around to setting up populating the postman requests after the db is populated, I will use these postman environment variables.

#### POST /movies

This route was straightforward, and I didn't really have to do much since I already have the POST /users route setup. The difference for POST /movies is that a valid api key is required in order to create a new movie, but I already have middleware that is setup to do these validations so that was straightforward to implement. I did refactor the content-type check and move it into validate.js. This is the first time in the app that I have validation middleware scoped to a method, but I still prefer separating it from the main route-handler logic like so:

```javascript
router.post('/', validate.contentTypeJSON);

router.post('/', async (req, res, next) => {
  // create resource
});
```

The ability to basically copy-paste the POST /users route to the POST /movies route shows the advantage of using model-agnostic CRUD operations in the db.js file. I'm really enjoying this design decision thus far.

#### DELETE /movies/:id

This route was easy enough to setup, but I have some unwanted duplication occuring with the error handling for an invalid ID between the db.delete() method and the db.read() method. Both use this same logic:

```javascript

const errorObj = {
  statusCode: 400,
  statusMessage: `No ${Model.modelName.toLowerCase()} found with that id`,
};

if (!mongoose.Types.ObjectId.isValid(_id)) return errorObj;

// retrieve the doc (either to return it or the deleted doc)

if (!doc) return errorObj;

// return the correct response

```

The difference lies in the method to retrieve the doc and the response object. I'm wondering if there is a way to refactor this to make the code DRYer, since both methods create() and delete() do similar validations of the id.

#### Pre-Request Scripts in Postman

For the DELETE /movies/:id route, I created a pre-request script that will create a new movie, and then store the id of that movie in an environment variable that will then be used as the id of the movie to delete. This way, I don't have to keep changing the movie id in the request each time I delete a movie. Pretty neat stuff!

*Pre-request script:*

```javascript

const rootApiKey = pm.environment.get("rootApiKey");

pm.sendRequest({
    url: `http://localhost:3000/movies?apiKey=${rootApiKey}`,
    method: 'POST',
    header: 'content-type:application/json',
    body: {
        mode: 'raw',
        raw: JSON.stringify({ 
            "title": "Post Man Movie Title",
          "overview": "This movie was created as a postman test file",
          "releaseDate": "2019-12-10T00:00:00.000Z" 
        })
    }
}, function (err, res) {
    pm.environment.set("delete_movie_id", res.json().movie._id);
});

```
*Delete request route:* http://localhost:3000/movies/{{delete_movie_id}}

#### DELETE /users/:id

This route-handler is nearly identitcal to GET /users/:id. There are the same restrictions (apiKey must be root or the user with the :id), and same general pattern:

```javascript

const dbResponse = await db.performDeleteOrGetQuery();

if (dbResponse.statusCode !== 200) {
  return res.status(dbResponse.statusCode).json(dbResponse);
}

const isValidUser = await validate.currentUserOrRootUser(req.query.apiKey, dbResponse.user.apiKey);

if (!isValidUser) {
  return res.status(401).json({ statusMessage: 'API Key does not match the user id or the root user'});
}

res.status(dbResponse.statusCode).json(dbResponse);

```

This leads me to think that I need to refactor the router.get('/:id') and router.delete('/:id') in the users router to be one route-handler, maybe a router.param('id') route-handler is the answer?

## 12-17-2019

#### Polishing The README

I'm constantly finding ways to make the README a little more clear, and accurate. Today I removed the 'testing' caveat, as I'm doing a ton of postman testing, and cleaned up some examples to make them less wordy. Having a README for projects keeps me so much more organized and focused, I'm so glad I started making this an essential part of my development workflow.

#### TODOs

I found a few things that needed fixing right away today, so I made some TODOs and completed a few of them, all of which I found by looking at the postman tests (they really are handy!):

- Validate releaseDate in Create Movie
- GET /resource/:id Pre-Request Scripts
- Read User (Valid API Key, Wrong User) Returns Incomplete Response

I ended up having to create a new test for every postman request that recieved an error-response because I wasn't checking that the response object had both statusCode and statusMessage properties. This should've been 101 stuff, but I missed it. Definitely learning the importance of setting up tests to be thorough.

#### Postman Requests

I noticed that I had hardcoded the userApiKey in my postman requests, so I created some pre-request scripts for relevant postman requests that would pull a valid user id from a call to GET /users. I also created pre-request script that creates an invalidApiKey, instead of hard-coding one. Finally, I made sure that every request that coule be made by the root user and a single user had a version of each request. I didn't do a version for every single valid and invalid request, just the general request to make sure that both types of users had access.

#### UPDATE /users/:id

Got this route working, but I basically just copied and pasted code from similar routes in the app. I always feel like this is not good when I start doing this, so I need to re-evaluate what is going on and see if I can get some of the duplication between CRUD operations down. It seems like all of the /resource/:id routes are doing a lot of similar work, so there must be a way to pull some of this out into separate functions instead of of read/create/update/delete all doing similar things. The db.js file is bad about duplication, as are the route handlers. 

## 12-18-2019

#### Validations Moved to Middleware

Hallelujah! I finally found a pattern I like, and it seems so obvious now, for dealing with sending validation error responses. These should be run from validate.js as middleware, either stand-alone in router.use() or router.all() statements or grouped in with route-handlers at router.METHOD() routes. Before, I had error responses being created in the db.js file for a lot of validations (there's still one there, but it's one that has to be run at the DB level) that honestly didn't need to be part of the core CRUD method's responsibility. These now all live in validate.js, and the db.js and router files are much easier to follow.

#### Stack Validation Middleware

I've tried a few different patterns for structuring validation middleware in the route-handlers. At first, I had the validation code included in the callback of the route-handler, before the code that hit the DB:

```javascript

router.get('/', async (req, res, next) => {

  if (!req.query.apiKey) {
    return res.status(400).json({
      statusCode: 400,
      statusMessage: `Access to ${req.method} ${req.baseUrl} requires an apiKey in the query string`,
    });
  }
  
  const dbResponse = await db.read('user');
  res.status(dbResponse.statusCode).json(dbResponse.users);
});

```

This wasn't a great way to do things, so I eventually pulled the validation code into validate.validationMethod() functions and added them as middleware to router.use() or router.METHOD() calls. I was stacking the validation middleware on top of each other at first:

```javascript

router.use(validate.apiKeyExistsInQS);
router.use(validate.apiKeyValid);

router.get('/', async (req, res, next) => {
  const dbResponse = await db.read('user');
  res.status(dbResponse.statusCode).json(dbResponse.users);
});

```

Then realized I should just be passing in multiple validators that run on the same router.use() call in together:

```javascript

router.use(validate.apiKeyExistsInQS, validate.apiKeyValid);

router.get('/', async (req, res, next) => {
  const dbResponse = await db.read('user');
  res.status(dbResponse.statusCode).json(dbResponse.users);
});

```

I was still interested in keeping the router.METHOD() signatures separate from the validation middleware though. So, if I needed to run some validation middleware on router.METHOD(), I would stack them above the router.METHOD() that handled the db call:

```javascript

router.post('/', validate.contentTypeJSON);
router.post('/', validate.fieldNames);
router.post('/', validate.resource);

router.post('/', async (req, res, next) => {
  const dbResponse = await db.create('user', req.body);
  res.status(dbResponse.statusCode).json(dbResponse);
});

```

Eventually, I realized this was silly, and that I should just add them to the router.METHOD() signature before the callback function:

```javascript

router.post('/', validate.contentTypeJSON, validate.fieldNames, validate.resource, async (req, res, next) => {
  const dbResponse = await db.create('user', req.body);
  res.status(dbResponse.statusCode).json(dbResponse);
});

```

The router files look soooooooooo much cleaner now, and are easier to follow since I've made these changes in structure.

#### router.param() vs. router.all() vs. router.use()

I'm still learning which version of middleware handler works best for which situation. I was using router.param() for the routes with the :id parameter, and then running some middleware there, but ran into a problem because I wanted to run multiple peices of middleware, and router.param() only accepts one callback, so I had to stack router.param calls. 

```javascript

router.param('id', validate.id);
router.param('id', validate.isValidUser);

```

Once I decided I didn't like seeing stacked router calls, I needed to find another way to structure this code. I tried using router.use('/:id'), but this led to issues because I wanted to be able to make my validators resource agnostic, so I was determining the resource type by using req.baseUrl, and router.use() doesn't behave the same as router.METHOD() or router.param() calls in this situation. The req.baseUrl call will resolve to /users or /movies when validation middleware is run in router.METHOD() or router.param(), but will resolve to /users/:id or /movies/:id when run with router.use(). This wasn't the end of the world, but I didn't want to have to have some code using req.baseUrl, and other's using a workaround, to perform the same action. router.all() to the rescue:

```javascript

router.all('/:id', validate.id, validate.isValidUser);

```

As all of the /:id routes needed the validators, it was safe to use this method. If I had a route that used /:id but didn't need these validators, I would've had to use a different pattern.

#### Consistency in Response From Route-Handlers

My route-handlers responses were a bit of a mess before. Here were some of the different patterns:

```javascript

res.json(dbResponse);
res.json(users);
res.status(dbResponse.status).json(dbResponse);
res.status(400).json({
  statusCode: 400,
  statusMessage: 'Message',
});
res.status(dbResponse.status).json(dbResponse.user);

```

This inconsistency bothered me, and was ripe for bugs. Now, there are two main signatures, with a singular or pluralized resource name depending on if the route returns a single resource or array of resources:

```javascript

// returns a resource or array of resources to the caller
res.status(dbResponse.statusCode).json(dbResponse.resource);
// returns JSON with statusCode, statusMessage, and possibly resource to the caller
res.status(dbResponse.statusCode).json(dbResponse);

```

#### Removal of try..catch and Server Errors Caveat

I noticed that all of my route-handlers had this pattern:

```javascript

router.method('/', async (req, res, next) => {
  try {
    const dbResponse = await db.query();
    res.status(dbResponse.statusCode).json(dbResponse);
  } catch (e) {
    next(e);
  }
});

```

The try..catch was ostensibly looking out for server errors, but when I actually tested it (which I can't believe I hadn't done till this point) these weren't working at all. The logic would need to be a step lower in the heirarchy, in the db.js file when the database calls are made. I just removed these because I didn't want to get bogged down with this issue at the moment. The route-handlers look cleaner now, and they are no less safe than before.

Since I am not handling server errors at this time, and they will blow up the server anyway if thrown from the db, I removed the app-level error-handling middleware in app.js, as it was no defense against the server going down like I thought.

#### Importance of Getting Stuff Working vs. Getting It Perfect First Time

I'm struggling a little lately with overthinking things before writing code. This is the opposite of how I used to be, when I would sit down and code for hours, only to realize I had dug myself into so many holes that my work was mostly useless. Now, I'm trying to over-engineer things and make them perfect, before I even have a working example. This is no good. I'm going to try and think less, and code more going forward. Thinking and planning a little is great, but it's more important to get something working, then slow down and refactor, than to try and get it right on the first swing. Some issues won't even be apparent until you have things hooked up and working, and sometimes violating the DRY principle while developing new features is good, as it shows you the patterns that are emerging between different areas of the app. It was increadibly easy for me to refactor today, mainly because I've been so bugged out by all of the repetition and copy-pasting I've been doing during development. I dont' think I would've been able to get to where I am at this point in the app by just planning beforehand though, some things I just had to see repeated in different areas of the app to realize they were related and could be moved to a central location.

## 12-19-2019

#### TDD

I'm loving doing test driven development with this project. Coming from Rails before this, where TDD is built in from day one, I was really missing that with the Express/Node community. I'm definitely going to spend some time after this project learning how to integrate testing in at the Node level, instead of just using Postman tests as I am now. I honestly don't want to ever develop applications without testing built in from the beginning though, it's just so much easier to add features and refactor with testing in place.