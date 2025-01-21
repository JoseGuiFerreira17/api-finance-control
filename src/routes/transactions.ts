import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { knex } from '../database';
import { randomUUID } from 'node:crypto';

export async function transactionsRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const transactions = await knex('transactions').select('*');

    return { total: transactions.length, transactions };
  });

  app.get('/:id', async (request) => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const { id } = paramsSchema.parse(request.params);

    const transactions = await knex('transactions').where({ id }).first();

    return { transactions };
  });

  app.get('/summary', async () => {
    const summary = await knex('transactions')
      .sum('amount', { as: 'amount' })
      .first();

    return { summary };
  });

  app.post('/', async (request, reply) => {
    const createTransactionSchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    });

    const { title, amount, type } = createTransactionSchema.parse(request.body);

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();
      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, //7 days
      });
    }

    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    });

    return reply.status(201).send();
  });
}
