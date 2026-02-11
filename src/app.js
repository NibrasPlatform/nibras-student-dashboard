const express = require('express');
const app = express();
const authRoutes = require('./routes/auth.route.js');
app.use(express.json());

// app.get('/tst', (req, res) => {
//     res.json({ message: 'Hello, World!' });
// });

app.use('/auth', authRoutes);


module.exports = app;