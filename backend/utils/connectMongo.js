import mongoose from 'mongoose';

export default async function connectMongo() {
  const uri = process.env.Mongo_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not set');
  await mongoose.connect(uri, { dbName: 'employeehealth' });
  console.log(`✅ MongoDB connected → ${uri} (employees)`);
}