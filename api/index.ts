import appPromise from '../server';

export default async (req: any, res: any) => {
  const app = await appPromise;
  if (!app) {
    return res.status(500).json({ error: 'Failed to initialize app' });
  }
  return app(req, res);
};
