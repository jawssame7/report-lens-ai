import { Router } from 'express';
import multer from 'multer';
import { serverConfig } from '../config';
import { analyzeFiles } from '../services/analysisService';
import { historyStore } from '../store/historyStore';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024
  }
});

export const analyzeRouter = Router();

analyzeRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

analyzeRouter.get('/history', async (_req, res) => {
  const entries = await historyStore.all();
  res.json({ entries });
});

analyzeRouter.post('/analyze', upload.array('files', serverConfig.upload.maxFileCount), async (req, res, next) => {
  try {
    const files = (req.files as Express.Multer.File[]) ?? [];

    if (!files.length) {
      return res.status(400).json({ message: 'ファイルを少なくとも 1 つ選択してください。' });
    }

    if (files.length > serverConfig.upload.maxFileCount) {
      return res
        .status(400)
        .json({ message: `最大 ${serverConfig.upload.maxFileCount} ファイルまでアップロード可能です。` });
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > serverConfig.upload.maxTotalBytes) {
      return res.status(400).json({ message: '合計 100MB を超えるファイルはアップロードできません。' });
    }

    const summary = await analyzeFiles({ files });
    res.json(summary);
  } catch (error) {
    next(error);
  }
});
