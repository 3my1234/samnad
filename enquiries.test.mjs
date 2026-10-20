import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createEnquiryHandler } from './enquiries.mjs';
const valid = { name: 'Test Customer', phone: '+234 801 234 5678', email: 'buyer@example.com', litres: '5000', location: 'Test address, Lagos', consent: true };
async function serve(t, options) {
  const handler = createEnquiryHandler(options);
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return (data, headers = {}) => fetch(`http://127.0.0.1:${server.address().port}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) });
}
test('sends complete sales email, with customer reply-to', async t => {
  let mail;
  const post = await serve(t, { env: { SALES_EMAIL: 'sales@example.com', MAIL_FROM: 'website@example.com' }, sendMail: async value => { mail = value; return { accepted: ['sales@example.com'], rejected: [] }; } });
  const result = await post(valid);
  assert.equal(result.status, 200);
  assert.equal(mail.to, 'sales@example.com');
  assert.equal(mail.replyTo, valid.email);
  for (const value of [valid.name, valid.phone, valid.location, valid.litres]) assert.ok(mail.text.includes(value));
  assert.match((await result.json()).message, /reference/);
});
test('invalid details, missing consent, and spam never send mail', async t => {
  let sent = 0;
  const post = await serve(t, { env: {}, sendMail: async () => { sent++; } });
  for (const change of [{ litres: '-2' }, { phone: 'abc' }, { consent: false }, { email: 'bad\r\nBcc:spam' }, { website: 'bot' }]) assert.equal((await post({ ...valid, ...change })).status, 400);
  assert.equal(sent, 0);
  assert.equal((await post(valid)).status, 429);
});
test('missing SMTP configuration returns unavailable, never success', async t => {
  const post = await serve(t, { env: {} });
  assert.equal((await post(valid)).status, 503);
});
test('email rejection and transport errors do not report success', async t => {
  for (const sendMail of [async () => ({ accepted: [], rejected: ['sales@example.com'] }), async () => { throw new Error('SMTP unavailable'); }]) {
    const post = await serve(t, { env: {}, sendMail });
    assert.equal((await post(valid)).status, 502);
  }
});
test('rejects foreign origins and oversized requests', async t => {
  const post = await serve(t, { env: { PUBLIC_ORIGIN: 'https://example.com' } });
  assert.equal((await post(valid, { Origin: 'https://other.example' })).status, 403);
  assert.equal((await post({ ...valid, message: 'x'.repeat(17000) })).status, 413);
});
