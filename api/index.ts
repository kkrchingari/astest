import appPromise from '../server';

export default async (req: any, res: any) => {
  try {
    const app = await appPromise;
    if (!app) {
      console.error('App initialization failed: app is undefined');
      return res.status(500).json({ error: 'Failed to initialize app: app is undefined' });
    }
    return app(req, res);
  } catch (error: any) {
    console.error('Vercel Entry Point Error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
};
