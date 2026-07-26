import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Customer from '../models/Customer.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dineflow_secret_key_2026';

/**
 * 💡 SHARED HELPER FUNCTION
 * Used by both Web Guest Check-in & Telegram Bot to update visits and calculate perks
 */
export async function processCustomerLoyalty(name, phone) {
  let customer = await Customer.findOne({ phone });

  if (customer) {
    customer.visitCount += 1;
    if (name) customer.name = name; // Update name if provided
    customer.lastVisit = Date.now();
    await customer.save();
  } else {
    customer = new Customer({
      name: name || 'Valued Guest',
      phone,
      visitCount: 1
    });
    await customer.save();
  }

  // Calculate Loyalty Perk based on visit count
  let perk = null;
  let discountPercent = 0;

  if (customer.visitCount > 30) {
    // Random discount between 5% and 10%
    discountPercent = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
    perk = {
      type: 'DISCOUNT',
      title: `🎁 ${discountPercent}% Loyalty Discount Applied!`,
      description: `Congratulations on your ${customer.visitCount}th visit! Enjoy a random ${discountPercent}% discount on your entire bill.`,
      discountPercent
    };
  } else if (customer.visitCount > 20) {
    perk = {
      type: 'FREE_COKE',
      title: '🥤 Free Coke Unlocked!',
      description: `Thank you for visiting us ${customer.visitCount} times! A complimentary cold Coke has been added to your table.`,
      discountPercent: 0
    };
  } else if (customer.visitCount > 10) {
    perk = {
      type: 'FREE_DESSERT',
      title: '🍨 Free Dessert Unlocked!',
      description: `Welcome back for your ${customer.visitCount}th visit! Enjoy a free dessert on the house.`,
      discountPercent: 0
    };
  }

  return { customer, perk };
}

// --------------------------------------------------
// 1. GUEST CHECK-IN & LOYALTY ROUTE
// --------------------------------------------------
router.post('/guest-checkin', async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone number are required' });
    }

    const { customer, perk } = await processCustomerLoyalty(name, phone);

    res.json({
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        visitCount: customer.visitCount
      },
      perk
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------
// 2. REGISTER STAFF / USER & SEND OTP
// --------------------------------------------------
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    let user = await User.findOne({ email });

    if (user && user.isVerified) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    if (!user) {
      user = new User({
        name,
        email,
        password: hashedPassword,
        role: role || 'customer',
        otp: generatedOtp,
        otpExpires
      });
    } else {
      user.password = hashedPassword;
      user.otp = generatedOtp;
      user.otpExpires = otpExpires;
    }

    await user.save();

    console.log(`📩 OTP for ${email}: ${generatedOtp}`);
    res.json({ message: 'OTP sent successfully to email!', demoOtp: generatedOtp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------
// 3. VERIFY OTP
// --------------------------------------------------
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------
// 4. LOGIN USER
// --------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.isVerified) return res.status(400).json({ message: 'Please verify your OTP first' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;