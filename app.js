const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const mysql = require('mysql2/promise');

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('Starting server...');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

console.log('Configuring MySQL pool...');
// Create MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // Replace with your MySQL root password
  database: 'fruit_website',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('Configuring email transporter...');
// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  port: 465,
  auth: {
    user: "fruitwebsite00@gmail.com",
    pass: "lobbyjykzjurhvif"  // Use the App Password here
  }
});

console.log('Setting up routes...');

// Simple GET route for testing
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// GET route to retrieve all subscribers
app.get('/subscribers', async (req, res) => {
  try {
    console.log('Fetching all subscribers...');
    const [rows] = await pool.execute('SELECT * FROM subscribers');
    console.log('Subscribers fetched successfully');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ error: 'An error occurred while fetching subscribers', details: error.toString() });
  }
});

// POST route to add a new subscriber
app.post('/join', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    console.log('Attempting to insert email into database...');
    // Insert email into database
    const [result] = await pool.execute(
      'INSERT INTO subscribers (email) VALUES (?)',
      [email]
    );
    console.log('Email inserted successfully');

    console.log('Preparing to send confirmation email...');
    // Send confirmation email
    const mailOptions = {
      from: 'fruitwebsite00@gmail.com',
      to: email,
      subject: 'Welcome to Our Fruit Community!',
      text: `
        Dear Fruit Enthusiast,

        Thank you for joining our fruit-loving community! We're excited to have you on board.

        Stay tuned for updates on our latest products, seasonal offers, and fruit-related news.

        If you have any questions or suggestions, feel free to reply to this email.

        Best regards,
        The Fruit Website Team
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent');
    res.json({ message: 'Thank you for joining! Check your email for confirmation.', email });
  } catch (error) {
    console.error('Detailed error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'This email is already subscribed.' });
    } else {
      res.status(500).json({ error: 'An error occurred. Please try again later.', details: error.toString() });
    }
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

console.log('Server setup complete. Waiting for connections...');
