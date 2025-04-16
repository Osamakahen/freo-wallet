import { Router, RequestHandler } from 'express';
import { Session, Analytics } from '../sdk/types';
import { TransactionRequest } from '../types/wallet';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// In-memory storage (replace with database in production)
const sessions: Map<string, Session> = new Map();
const analytics: Analytics[] = [];

// Session management
const createSession: RequestHandler = async (req, res) => {
  try {
    const { address, chainId } = req.body;

    if (!address || !chainId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const session: Session = {
      id: uuidv4(),
      address,
      chainId,
      network: 'ethereum', // Default network
      permissions: ['read', 'write'],
      timestamp: Date.now(),
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    sessions.set(session.id, session);
    res.status(201).json(session);
  } catch (err: unknown) {
    console.error('Failed to create session:', err);
    res.status(500).json({ error: 'Failed to create session' });
  }
};

const deleteSession: RequestHandler = async (req, res) => {
  const { id } = req.params;
  if (sessions.delete(id)) {
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
};

// Transaction verification
const verifyTransaction: RequestHandler = async (req, res) => {
  try {
    const transaction: TransactionRequest = req.body;
    const sessionId = req.headers.authorization?.split(' ')[1];

    if (!sessionId || !sessions.has(sessionId)) {
      res.status(401).json({ error: 'Invalid session' });
      return;
    }

    // Verify transaction fields
    if (!transaction.to || !transaction.value || !transaction.data) {
      res.status(400).json({ error: 'Invalid transaction' });
      return;
    }

    // Add additional verification logic here
    // - Check gas limits
    // - Validate contract interactions
    // - Check for suspicious patterns

    res.status(200).json({ verified: true });
  } catch (err: unknown) {
    console.error('Failed to verify transaction:', err);
    res.status(500).json({ error: 'Failed to verify transaction' });
  }
};

// Analytics
const recordAnalytics: RequestHandler = async (req, res) => {
  try {
    const { event, data } = req.body;
    const sessionId = req.headers.authorization?.split(' ')[1];

    if (!sessionId || !sessions.has(sessionId)) {
      res.status(401).json({ error: 'Invalid session' });
      return;
    }

    const analyticsEntry: Analytics = {
      event,
      data,
      timestamp: Date.now(),
      sessionId,
    };

    analytics.push(analyticsEntry);
    res.status(201).json(analyticsEntry);
  } catch (err: unknown) {
    console.error('Failed to record analytics:', err);
    res.status(500).json({ error: 'Failed to record analytics' });
  }
};

const getAnalytics: RequestHandler = async (req, res) => {
  const sessionId = req.headers.authorization?.split(' ')[1];

  if (!sessionId || !sessions.has(sessionId)) {
    res.status(401).json({ error: 'Invalid session' });
    return;
  }

  const sessionAnalytics = analytics.filter(a => a.sessionId === sessionId);
  res.json(sessionAnalytics);
};

// Route handlers
router.post('/sessions', createSession);
router.delete('/sessions/:id', deleteSession);
router.post('/transactions/verify', verifyTransaction);
router.post('/analytics', recordAnalytics);
router.get('/analytics', getAnalytics);

export default router; 