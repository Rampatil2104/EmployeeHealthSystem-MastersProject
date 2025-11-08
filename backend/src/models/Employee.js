import mongoose from 'mongoose';

// Flexible schema so we can store all fields from your CSV/JSON
const EmployeeSchema = new mongoose.Schema({}, { strict: false, collection: 'employees' });
export default mongoose.model('Employee', EmployeeSchema);