import express from 'express';
import cors from 'cors';
import { serverConfig } from './config';
import { analyzeRouter } from './routes/analyzeRoute';

const app = express();

app.use(
  cors({
    origin: serverConfig.allowedOrigins,
    credentials: true
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', analyzeRouter);

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error', error);
  res.status(500).json({ message: 'サーバーエラーが発生しました。', details: error.message });
});

app.listen(serverConfig.port, () => {
  console.log(`ReportLensAI backend listening on port ${serverConfig.port}`);
});
