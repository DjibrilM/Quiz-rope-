export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/quizrope',
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key',
  },
  flutterwave: {
    secretKey: process.env.FLUTTERWAVE_SECRET_KEY || '',
    publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY || '',
    webhookHash: process.env.FLUTTERWAVE_WEBHOOK_HASH || '',
    redirectUrl: process.env.FLUTTERWAVE_REDIRECT_URL || 'https://quizrope.app/payment/callback',
    planId: process.env.FLUTTERWAVE_PLAN_ID || '',
  },
});
