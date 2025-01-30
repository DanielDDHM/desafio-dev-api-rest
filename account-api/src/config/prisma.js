import { PrismaClient } from '@prisma/client';

const client = new PrismaClient();

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

export default client;
