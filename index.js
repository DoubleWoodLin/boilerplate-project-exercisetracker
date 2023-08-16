const express = require('express');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');
require('dotenv').config();
const User = require('./models/user');
const Exercise = require('./models/exercise');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: 'false' }));
app.use(bodyParser.json());
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/users', async (req, res) => {
  const user = new User({
    username: req.body.username,
  });
  const savedUser = await user.save();
  res.json({
    username: savedUser.username,
    _id: savedUser._id,
  });
});

app.get('/api/users', async (req, res) => {
  const users = await User.find();
  res.json(
    users.map((item) => {
      return {
        username: item.username,
        _id: item._id,
      };
    })
  );
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const user = await User.findById(req.params._id).catch((err) => {
    res.status(404).send('No such user');
    res.end();
  });
  if (!user) {
    return;
  }
  const exercise = new Exercise({
    userId: req.params._id,
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date ? new Date(req.body.date) : new Date(),
  });
  const savedExercise = await exercise.save();
  res.json({
    _id: savedExercise.userId._id,
    duration: savedExercise.duration,
    username: user.username,
    description: savedExercise.description,
    date: savedExercise.date.toDateString(),
  });
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const user = await User.findById(req.params._id).catch((err) => {
    res.status(404).send('No such user');
    res.end();
  });
  if (!user) {
    return;
  }
  const from = req.query.from
    ? new Date(req.query.from)
    : new Date('1970-01-01');
  const to = req.query.to ? new Date(req.query.to) : new Date();
  const limit = req.query.limit ?? 10000;
  const logs = await Exercise.find({
    userId: req.params._id,
    date: {
      $gte: from,
      $lte: to,
    },
  }).limit(limit);
  res.json({
    count: logs.length,
    _id: req.params._id,
    username: user.username,
    log: logs.map((item) => {
      return {
        duration: item.duration,
        description: item.description,
        date: item.date.toDateString(),
      };
    }),
  });
});

const listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
