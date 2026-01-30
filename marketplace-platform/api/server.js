const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const Stripe = require('stripe');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Premium Skills Configuration
const PREMIUM_SKILLS = {
  'notion-advanced': {
    name: 'Notion Advanced Pro',
    price: 14.99,
    gumroadProductId: 'jarvis-notion-pro',
    stripeProductId: 'prod_notion_advanced'
  },
  'github-copilot-plus': {
    name: 'GitHub Copilot++ Pro', 
    price: 19.99,
    gumroadProductId: 'jarvis-github-pro',
    stripeProductId: 'prod_github_copilot'
  },
  'focus-pro': {
    name: 'Focus Pro',
    price: 9.99,
    gumroadProductId: 'jarvis-focus-pro',
    stripeProductId: 'prod_focus_pro'
  }
};

// License validation database (in production, use proper database)
const activeLicenses = new Map();

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'JARVIS License API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Validate premium license
app.post('/validate', async (req, res) => {
  try {
    const { skillName, licenseKey } = req.body;

    if (!skillName || !licenseKey) {
      return res.status(400).json({
        valid: false,
        message: 'Skill name and license key required'
      });
    }

    // Check if skill exists
    if (!PREMIUM_SKILLS[skillName]) {
      return res.status(404).json({
        valid: false,
        message: 'Unknown premium skill'
      });
    }

    // Validate license key format
    if (!licenseKey.match(/^JARVIS-[A-Z0-9]{8}-[A-Z0-9]{8}$/)) {
      return res.status(400).json({
        valid: false,
        message: 'Invalid license key format'
      });
    }

    // Check license status (mock validation - integrate with Gumroad/Stripe in production)
    const license = activeLicenses.get(licenseKey);
    
    if (!license) {
      // For demo purposes, generate mock license
      const mockLicense = {
        skillName: skillName,
        customerEmail: 'demo@jarvis.ai',
        purchaseDate: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        status: 'active',
        plan: 'premium'
      };
      
      activeLicenses.set(licenseKey, mockLicense);
    }

    const validationResult = activeLicenses.get(licenseKey);

    if (validationResult.status === 'active' && new Date(validationResult.expiresAt) > new Date()) {
      res.json({
        valid: true,
        message: 'License valid and active',
        skillName: validationResult.skillName,
        expiresAt: validationResult.expiresAt,
        plan: validationResult.plan
      });
    } else {
      res.status(403).json({
        valid: false,
        message: 'License expired or inactive',
        upgradeUrl: `https://gumroad.com/l/${PREMIUM_SKILLS[skillName].gumroadProductId}`
      });
    }

  } catch (error) {
    console.error('License validation error:', error);
    res.status(500).json({
      valid: false,
      message: 'License validation service error'
    });
  }
});

// Create Stripe checkout session
app.post('/checkout', async (req, res) => {
  try {
    const { skillName, customerEmail } = req.body;

    const skill = PREMIUM_SKILLS[skillName];
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: skill.name,
              description: `Premium JARVIS skill with AI-powered automation`
            },
            unit_amount: Math.round(skill.price * 100), // Convert to cents
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1
        }
      ],
      metadata: {
        skillName: skillName,
        jarvisProduct: 'premium-skill'
      },
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/premium/${skillName}`
    });

    res.json({ 
      checkoutUrl: session.url,
      sessionId: session.id
    });

  } catch (error) {
    console.error('Checkout creation error:', error);
    res.status(500).json({ error: 'Checkout creation failed' });
  }
});

// Stripe webhook (handle successful payments)
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Generate license key for customer
      const licenseKey = generateLicenseKey();
      const skillName = session.metadata.skillName;
      
      // Store license
      activeLicenses.set(licenseKey, {
        skillName: skillName,
        customerEmail: session.customer_email,
        stripeSessionId: session.id,
        purchaseDate: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        status: 'active',
        plan: 'premium'
      });

      // TODO: Send license key to customer via email
      console.log(`New license generated: ${licenseKey} for ${skillName}`);
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send('Webhook error');
  }
});

// Generate license key
function generateLicenseKey() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `JARVIS-${timestamp.slice(-8)}-${random}`;
}

// Get premium skills list
app.get('/skills', (req, res) => {
  const skillsList = Object.entries(PREMIUM_SKILLS).map(([id, skill]) => ({
    id,
    name: skill.name,
    price: skill.price,
    description: `Professional AI-powered ${skill.name.toLowerCase()} automation`,
    trial: true,
    trialDays: 14
  }));

  res.json({
    skills: skillsList,
    totalSkills: skillsList.length,
    currency: 'USD'
  });
});

// Start server
app.listen(port, () => {
  console.log(`🔑 JARVIS License API running on port ${port}`);
  console.log(`💰 Premium skills ready for monetization!`);
  console.log(`🌟 Revenue generation: ACTIVE`);
});

module.exports = app;