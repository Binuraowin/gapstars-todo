import mongoose from 'mongoose';
import config from '../config/config';

/**
 * Connect to MongoDB database
 * @returns Promise that resolves when connected
 */
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongoose.url);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;