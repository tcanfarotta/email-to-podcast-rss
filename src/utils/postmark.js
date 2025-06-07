export function verifyPostmarkWebhook(req) {
  const token = req.headers['x-postmark-token'];
  return token === process.env.POSTMARK_WEBHOOK_TOKEN;
}