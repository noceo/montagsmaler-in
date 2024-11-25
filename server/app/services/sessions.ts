import { prisma } from '../index';

export interface CreateSessionProps {
  code: string;
  name?: string;
}

export interface UpdateSessionProps {
  code: string;
  name?: string;
}

const createSession = async ({ code, name }: CreateSessionProps) => {
  console.log(code, name);
  const session = prisma.session.create({
    data: {
      code: code,
      name: name,
    },
  });

  return session;
};

const getAllSessions = async () => {
  const sessions = prisma.session.findMany();

  return sessions;
};

const getSession = async (code: string) => {
  const session = await prisma.session.findUnique({
    where: {
      code: code,
    },
  });

  return session;
};

const updateSession = async ({ code, name }: UpdateSessionProps) => {
  const session = prisma.session.update({
    where: {
      code: code,
    },
    data: {
      name: name,
    },
  });

  return session;
};

export default {
  createSession,
  getAllSessions,
  getSession,
  updateSession,
};
