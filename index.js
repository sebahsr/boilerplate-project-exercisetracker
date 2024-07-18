const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { Schema } = mongoose;

require('dotenv').config()
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
mongoose.connect('mongodb+srv://sebahsr:sebah@sebah-freecode.naibcrd.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Schemas and Models
const userSchema = new Schema({
  username: { type: String, required: true }
});

const exerciseSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true }
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);
// Create a new user
app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  const newUser = new User({ username: 'example' });
  try {const savedUser = await newUser.save();
  res.json({ username: savedUser.username, _id: savedUser._id })
  }catch(err){
    if (err) return res.status(500).json({ error: err.message });
  }
  });

// Get all users
app.get('/api/users', async (req, res) => {
  let users= await User.find()
    res.json(users);
});

// Add an exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  let user = await  User.findById(_id)
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newExercise = new Exercise({
      userId: user._id,
      description,
      duration: parseInt(duration),
      date: date ? new Date(date) : new Date()
    });

    let savedExercise= await newExercise.save()
    
      res.json({
        username: user.username,
        description: savedExercise.description,
        duration: savedExercise.duration,
        date: savedExercise.date.toDateString(),
        _id: user._id
      });
    });
 

// Get user log
app.get('/api/users/:_id/logs', async (req, res) => {
  try {

    const{ _id} = req.params;
    id =parseInt(_id)
    console.log(_id,parseInt(_id), id)
    const { from, to, limit } = req.query;

    // Find user by _id, assuming you have a User model
    const user = await User.findById(_id);
     console.log(user)
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build query conditions based on from and to dates
    let queryConditions = { userId: _id };
    if (from || to) {
      queryConditions.date = {};
      if (from) queryConditions.date.$gte = new Date(from);
      if (to) queryConditions.date.$lte = new Date(to);
    }

    // Fetch exercises based on query conditions
    let exercisesQuery = Exercise.find(queryConditions);

    // Apply limit if specified
    if (limit) {
      exercisesQuery = exercisesQuery.limit(parseInt(limit, 10));
    }

    // Execute the query and populate user object
    const exercises = await exercisesQuery.exec();

    // Prepare response object
    const exerciseLogs = {
      _id: user._id,
      username: user.username,
      count: exercises.length,
      log: exercises.map(exercise => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString() // Format date using toDateString() method
      }))
    };

    res.json(exerciseLogs);
  } catch (error) {
    console.error('Error fetching exercise logs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
