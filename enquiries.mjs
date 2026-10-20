import nodemailer from 'nodemailer';
import { randomUUID } from 'node:crypto';
const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
function reply(res, status, message) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify({ message }));
}
export function validateEnquiry(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Please complete the form.');
  const field = (key, max, required = true) => {
    const value = typeof body[key] === 'string' ? body[key].trim() : '';
    if ((required && !value) || value.length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value)) throw new Error(`Please check ${key}.`);
    return value;
  };
  const name = field('name', 120);
  if (/[\r\n]/.test(name)) throw new Error('Please check your name.');
  const phone = field('phone', 30);
  if (!/^[+\d ()-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15) throw new Error('Please enter a valid contact number.');
  const email = field('email', 254, false);
  if (email && !emailPattern.test(email)) throw new Error('Please enter a valid email address.');
  if (typeof body.litres !== 'string' || !/^\d+$/.test(body.litres) || Number(body.litres) < 1 || Number(body.litres) > 10000000) throw new Error('Please enter litres as a whole number between 1 and 10,000,000.');
  const location = field('location', 500);
  const company = field('company', 160, false);
  const date = field('date', 10, false);
  const today = new Date(Date.now() + 3600000).toISOString().slice(0, 10);
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || date < today)) throw new Error('Please select today or a future delivery date.');
  const message = field('message', 3000, false);
  if (body.consent !== true) throw new Error('Please agree to being contacted about your request.');
  return { name, phone, email, litres: Number(body.litres), location, company, date, message };
}
export function createEnquiryHandler({ env = process.env, sendMail } = {}) {
  const attempts = new Map();
  let globalWindow = Date.now(), globalCount = 0, transport;
  return async (req, res) => {
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); reply(res, 405, 'Please submit the form.'); return; }
    if (!req.headers['content-type']?.startsWith('application/json')) { reply(res, 415, 'Please submit the website form.'); return; }
    if (req.headers.origin && env.PUBLIC_ORIGIN && req.headers.origin !== env.PUBLIC_ORIGIN) { reply(res, 403, 'Please submit from the Samnad website.'); return; }
    const now = Date.now();
    for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
    // Trust the proxy only when explicitly enabled, using its appended client address.
    const ip = env.TRUST_PROXY === 'true' ? String(req.headers['x-forwarded-for'] || req.socket.remoteAddress).split(',').at(-1).trim() : req.socket.remoteAddress;
    const bucket = attempts.get(ip) || { count: 0, until: now + 900000 };
    if (now - globalWindow >= 3600000) { globalWindow = now; globalCount = 0; }
    if (bucket.count >= 5 || globalCount >= 100 || attempts.size >= 10000) { res.setHeader('Retry-After', '900'); reply(res, 429, 'Too many requests. Please try again later.'); return; }
    bucket.count++; globalCount++; attempts.set(ip, bucket);
    let body;
    try {
      let size = 0; const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 16384) { reply(res, 413, 'Your request is too large.'); return; }
        chunks.push(chunk);
      }
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch { reply(res, 400, 'Please check the form and try again.'); return; }
    if (body?.website) { reply(res, 400, 'Unable to submit this request.'); return; }
    let data;
    try { data = validateEnquiry(body); } catch (error) { reply(res, 400, error.message); return; }
    if (!sendMail && (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !emailPattern.test(env.SALES_EMAIL || '') || !emailPattern.test(env.MAIL_FROM || ''))) { reply(res, 503, 'Online requests are temporarily unavailable. Please try again later.'); return; }
    const reference = randomUUID();
    try {
      transport ||= sendMail ? null : nodemailer.createTransport({ host: env.SMTP_HOST, port: Number(env.SMTP_PORT || 587), secure: env.SMTP_SECURE === 'true', requireTLS: env.SMTP_SECURE !== 'true', auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000, disableFileAccess: true, disableUrlAccess: true });
      const result = await (sendMail || transport.sendMail.bind(transport))({
        from: { name: 'Samnad website', address: env.MAIL_FROM }, to: env.SALES_EMAIL,
        ...(data.email ? { replyTo: data.email } : {}),
        subject: `Diesel purchase request: ${data.litres.toLocaleString('en-NG')} litres`,
        text: `DIESEL PURCHASE REQUEST\nReference: ${reference}\nReceived: ${new Date().toISOString()}\n\nName: ${data.name}\nContact number: ${data.phone}\nEmail: ${data.email || 'Not supplied'}\nCompany: ${data.company || 'Not supplied'}\nQuantity: ${data.litres} litres\nDelivery location: ${data.location}\nPreferred delivery date: ${data.date || 'To be discussed'}\n\nAdditional details:\n${data.message || 'None'}\n\nCustomer agreed to contact for this request.\nThis is an enquiry, subject to sales confirmation of price, availability and delivery.`,
      });
      if (!result.accepted?.length || result.rejected?.length) throw new Error('Recipient rejected');
      reply(res, 200, `Your request has been sent to our sales team. Your reference is ${reference}. Our team will contact you to discuss pricing and delivery.`);
    } catch (error) {
      console.error('Enquiry email failed', { reference, code: error.code || 'DELIVERY_FAILED' });
      reply(res, 502, 'We could not confirm delivery of your request. Please try again shortly.');
    }
  };
}
