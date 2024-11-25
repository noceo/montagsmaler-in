import { Request, Response } from 'express';
import { matchedData, validationResult } from 'express-validator';
import sessionService, {
  CreateSessionProps,
  UpdateSessionProps,
} from '../services/sessions';
import { nanoid } from 'nanoid';

const createSession = async (req: Request, res: Response) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(422).send({ errors: result.array() });
  }

  try {
    const sessionCode = nanoid(10);
    const bodyData = matchedData(req);
    const session = await sessionService.createSession({
      ...bodyData,
      code: sessionCode,
    } as CreateSessionProps);
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err });
  }
};

const getAllSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await sessionService.getAllSessions();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err });
  }
};

const getSession = async (req: Request, res: Response) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(422).send({ errors: result.array() });
  }

  try {
    const { id } = matchedData(req);
    const session = await sessionService.getSession(id);
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err });
  }
};

const updateSession = async (req: Request, res: Response) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(422).send({ errors: result.array() });
  }

  try {
    const session = await sessionService.updateSession(
      matchedData(req) as UpdateSessionProps
    );
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err });
  }
};

export default {
  createSession,
  getAllSessions,
  getSession,
  updateSession,
};
