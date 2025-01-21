import fastify from 'fastify';
import { env } from './env';
import { transactionsRoutes } from './routes/transactions';
import cookie from '@fastify/cookie';

const app = fastify({});

app.register(cookie);

app.register(transactionsRoutes, { prefix: 'transactions' });

app.listen({ port: env.SERVER_PORT }).then(() => {
  console.log(`Server started on port ${env.SERVER_PORT}`);
});
