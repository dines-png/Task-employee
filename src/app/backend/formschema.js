const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },

  department: { type: String, required: true },
  jobTitle: { type: String, required: true },
  employmentType: { type: String, required: true },
  hireDate: { type: Date, required: true },
  employeeStatus: { type: String, required: true },
  manager: { type: String },

  salary: { type: String, required: true },
  payFrequency: { type: String, required: true },
  bankAccount: { type: String, required: true },

  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },

  emergencyContactName: { type: String, required: true },
  emergencyContactNumber: { type: String, required: true },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
