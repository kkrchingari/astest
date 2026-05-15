import mongoose from 'mongoose';

// @ts-ignore
let cached = global.mongoose || { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    if (!process.env.MONGODB_URI) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Please define the MONGODB_URI environment variable');
      }
      console.warn('MONGODB_URI is missing. Database connection will fail.');
      return null;
    }

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  // @ts-ignore
  global.mongoose = cached;
  return cached.conn;
}
