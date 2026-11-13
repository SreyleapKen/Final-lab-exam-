const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // use 'bcryptjs' instead if that's what your register service uses

const dbconnect = require('./dbconnect.js');
const PersonModel = require('./person_schema.js');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 5002;

// Health check endpoint
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'update-service' }));

// Update student mobile number or password
app.put('/updatestudent', async (req, res) => {
  console.log('UPDATE STUDENT API EXECUTED');
  const { id, email, mobile, password } = req.body;

  // Need a way to find the student
  if (!id && !email) {
    return res.status(400).json({ message: 'Provide either id or email' });
  }

  // Need something to update
  const updateData = {};
  if (mobile) updateData.mobile = mobile;

  try {
    // Passwords are stored as bcrypt hashes, so hash before saving
    if (password) updateData.password = await bcrypt.hash(password, 10);

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Provide mobile and/or password to update' });
    }

    const query = id ? { _id: id } : { email: email };
    const updatedStudent = await PersonModel.findOneAndUpdate(query, updateData, {
      returnDocument: 'after',
    });

    if (!updatedStudent) {
      return res.status(404).json({ message: 'Student not found in database' });
    }

    res.status(200).json({ message: 'Student updated successfully', data: updatedStudent });
  } catch (err) {
    console.error('Update failed:', err);
    res.status(500).json({ message: err.message || 'Error updating student record' });
  }
});

// Connect to MongoDB first, then start accepting requests
dbconnect()
  .then(() => {
    app.listen(PORT, () => console.log(`Update Service Started at Port No: ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to start service:', err);
    process.exit(1);
  });