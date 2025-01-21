import { it, beforeAll, afterAll, describe, expect, beforeEach } from 'vitest';
import { execSync } from 'node:child_process';
import request from 'supertest';
import { app } from '../src/app';

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all');
    execSync('npm run knex migrate:latest');
  });

  it('should be able to create a new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 500,
        type: 'credit',
      })
      .expect(201);
  });

  it('should be able to list all transactions', async () => {
    const transactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 500,
        type: 'credit',
      });

    const cookies = transactionResponse.get('Set-Cookie');

    const listTransactions = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200);

    expect(listTransactions.body.transactions).toEqual([
      expect.objectContaining({ title: 'New transaction', amount: 500 }),
    ]);
  });

  it('should be able to get especifc transaction', async () => {
    const transactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 500,
        type: 'credit',
      });

    const cookies = transactionResponse.get('Set-Cookie');

    const listTransactions = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200);

    const transactionId = listTransactions.body.transactions[0].id;

    const getTransaction = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)
      .expect(200);

    console.log(getTransaction.body);
    expect(getTransaction.body.transaction).toEqual(
      expect.objectContaining({ title: 'New transaction', amount: 500 }),
    );
  });

  it('should be able to get the summary', async () => {
    const creditTransaction = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Credit transaction',
        amount: 500,
        type: 'credit',
      });

    const cookies = creditTransaction.get('Set-Cookie');

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'Debit transaction',
        amount: 200,
        type: 'debit',
      });

    const summaryResponse = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)
      .expect(200);

    expect(summaryResponse.body.summary).toEqual({ amount: 300 });
  });
});
