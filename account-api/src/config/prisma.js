import { PrismaClient } from '@prisma/client';

const client = new PrismaClient();

if (process.env.NODE_ENV !== 'test') {
  async function connect() {
    await client
      .$connect()
      .then(() => {
        console.log('CONECTED');
      })
      .catch((e) => {
        console.error(e);
        process.exit(1);
      });
  }
  connect();
}

export default client;
