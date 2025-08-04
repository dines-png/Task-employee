const express = require('express');
const router = express.Router();
const Employee = require('./formschema');

// POST: Add new employee
router.post('/add', async (req, res) => {
  try {
    const employee = new Employee(req.body);
    await employee.save();
    res.status(201).json({ message: 'Employee created successfully', employee });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET: Fetch all employees
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });;
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE: Delete an employee by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
    if (!deletedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT: Update an employee by ID (full update)
router.put('/:id', async (req, res) => {
  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body, // ⚠️ make sure the full schema is sent from frontend
      { new: true, runValidators: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ message: 'Employee updated successfully', employee: updatedEmployee });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


module.exports = router;
