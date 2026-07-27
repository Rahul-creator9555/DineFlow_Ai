import { Telegraf, session, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';
import Reservation from '../models/Reservation.js';
import { parseAudioOrder, parseTextOrder } from './aiService.js';
import { getIO } from '../socket/socketHandler.js';
import { processCustomerLoyalty } from '../routes/authRoutes.js';

let botInstance = null;

// Simple in-memory rate limiter
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 30_000; // 30 seconds
const RATE_LIMIT_MAX = 8;

// Menu cache
let menuCache = { items: [], expiresAt: 0 };
const MENU_CACHE_TTL = 30_000;

export function sendTelegramMessage(chatId, text) {
  if (botInstance && chatId) {
    botInstance.telegram
      .sendMessage(chatId, text, { parse_mode: 'Markdown' })
      .catch((err) => console.error('⚠️ Telegram push error:', err.message));
  }
}

function escapeMarkdown(text = '') {
  return String(text).replace(/([_*`\[])/g, '\\$1');
}

function extractTableNumber(text) {
  if (!text) return null;
  const match = text.match(/(?:table|t|tab|tbl)\s*(?:no\.?|number|#)?\s*(\d{1,3})/i)
    || text.match(/^(\d{1,2})\s*[:\-]/);
  return match ? match[1].padStart(2, '0') : null;
}

async function getActiveMenu() {
  if (Date.now() < menuCache.expiresAt) return menuCache.items;
  const items = await MenuItem.find({ isAvailable: true }).lean();
  menuCache = { items, expiresAt: Date.now() + MENU_CACHE_TTL };
  return items;
}

function isRateLimited(userId) {
  const now = Date.now();
  const entry = rateLimitMap.get(userId) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };

  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + RATE_LIMIT_WINDOW;
  } else {
    entry.count += 1;
  }

  rateLimitMap.set(userId, entry);
  return entry.count > RATE_LIMIT_MAX;
}

export function initTelegramBot() {
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
  botInstance = bot;

  bot.use(session());

  bot.catch((err, ctx) => {
    console.error('❌ Bot error for', ctx.from?.id, err);
    ctx.reply('⚠️ Something went wrong. Please try again in a moment.').catch(() => {});
  });

  const mainKeyboard = Markup.keyboard([
    ['📖 View Menu', '⚡ Active Orders'],
    ['📅 Book a Table', '💳 Pay Bill & Leave'],
    [Markup.button.contactRequest('📱 Share Phone for Discounts')]
  ]).resize().persistent();

  // ─── /start ───────────────────────────────────────────────
  bot.start(async (ctx) => {
    const name = escapeMarkdown(ctx.from.first_name || 'Guest');
    await ctx.reply(
      `👋 *Welcome to DineFlow AI, ${name}!*\n\n` +
      `Order food or reserve tables by typing, clicking buttons, or sending a *voice note* (English / Hindi / Hinglish).\n\n` +
      `• *Order example:* \`Table 3: 1 Paneer Tikka + 2 Butter Naan\`\n` +
      `• *Reserve example:* \`Book table for 4 at 8 PM today\``,
      { parse_mode: 'Markdown', ...mainKeyboard }
    );
  });

  bot.command('help', async (ctx) => {
    await ctx.reply(
      `📖 *How to use DineFlow AI*\n\n` +
      `• Type or speak your order with table number\n` +
      `• Type or speak a reservation request\n` +
      `• Use the buttons below for quick actions\n` +
      `• Share your phone number for loyalty rewards`,
      { parse_mode: 'Markdown', ...mainKeyboard }
    );
  });

  // ─── Contact / Phone ──────────────────────────────────────
  bot.on(message('contact'), async (ctx) => {
    const phone = ctx.message.contact.phone_number;
    ctx.session = ctx.session || {};
    ctx.session.phoneNumber = phone;

    await ctx.reply(
      `✅ *Phone linked!* (${escapeMarkdown(phone)})\n\nLoyalty rewards will now sync automatically.`,
      { parse_mode: 'Markdown', ...mainKeyboard }
    );
  });

  // ─── Confirm / Cancel order buttons ───────────────────────
  bot.action(/^confirm_order:(.+)$/, async (ctx) => {
    const orderId = ctx.match[1];
    const pending = ctx.session?.pendingOrder;

    if (!pending || pending.tempId !== orderId) {
      return ctx.answerCbQuery('This order is no longer valid.');
    }

    try {
      // Save Order to MongoDB
      const newOrder = await Order.create(pending.data);

      // Emit to Kitchen KDS (Stock deduction happens in server.js when status changes to 'ready')
      try {
        const io = getIO();
        if (io) io.to('kitchen').emit('order:new', newOrder);
      } catch (e) {
        console.warn('Socket emit failed:', e.message);
      }

      delete ctx.session.pendingOrder;

      let summary = `✅ *Order Confirmed & Sent to Kitchen!*\n` +
        `*Table ${pending.data.tableNumber}*\n\n`;

      pending.data.items.forEach((i) => {
        summary += `• *${escapeMarkdown(i.name)}* ×${i.quantity} — ₹${i.price * i.quantity}\n`;
        if (i.customization) summary += `   _${escapeMarkdown(i.customization)}_\n`;
      });

      summary += `\n*Total:* ₹${pending.data.totalAmount}\n` +
        `⚡ Status: *In Queue* 🟡`;

      await ctx.editMessageText(summary, { parse_mode: 'Markdown' });
      await ctx.reply('You can track this order anytime with ⚡ Active Orders', mainKeyboard);
    } catch (err) {
      console.error('Confirm order error:', err);
      await ctx.answerCbQuery('Failed to place order. Please try again.');
    }
  });

  bot.action('cancel_order', async (ctx) => {
    delete ctx.session?.pendingOrder;
    await ctx.editMessageText('❌ Order cancelled.');
    await ctx.reply('What would you like to do next?', mainKeyboard);
  });

  // ─── Core order processing ───
  async function processAndSaveOrder(ctx, parsedOrder, source, rawText = '') {
    if (!parsedOrder?.items?.length) {
      return ctx.reply(
        "❌ Couldn't identify any menu items.\n\n" +
        "To reserve a table say: *Book table for 2 guests*",
        { parse_mode: 'Markdown', ...mainKeyboard }
      );
    }

    const activeMenu = await getActiveMenu();
    let totalAmount = 0;
    const orderItems = [];

    for (const item of parsedOrder.items) {
      const menuItem = activeMenu.find(
        (m) =>
          m._id.toString() === item.menuItemId ||
          m.name.toLowerCase() === (item.name || '').toLowerCase()
      );

      if (!menuItem) continue;

      if (menuItem.stockCount < item.quantity) {
        return ctx.reply(
          `⚠️ Only *${menuItem.stockCount}* unit(s) of *${escapeMarkdown(menuItem.name)}* left.`,
          { parse_mode: 'Markdown', ...mainKeyboard }
        );
      }

      totalAmount += menuItem.price * item.quantity;
      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        customization: item.customization || ''
      });
    }

    if (orderItems.length === 0) {
      return ctx.reply('❌ None of the requested items are currently available.', mainKeyboard);
    }

    const tableNumber =
      parsedOrder.tableNumber ||
      extractTableNumber(rawText) ||
      ctx.session?.lastTable ||
      '01';

    ctx.session.lastTable = tableNumber;

    const orderData = {
      tableNumber,
      telegramId: ctx.from.id.toString(),
      customerChatId: ctx.chat.id.toString(),
      customerName: ctx.from.first_name || 'Customer',
      telegramUsername: ctx.from.username || null,
      items: orderItems,
      source,
      totalAmount,
      overallStatus: 'in_queue',
      rawText: rawText || null
    };

    const tempId = Date.now().toString(36);
    ctx.session.pendingOrder = { tempId, data: orderData };

    let preview = `🛒 *Please confirm your order*\n*Table ${tableNumber}*\n\n`;
    orderItems.forEach((i) => {
      preview += `• *${escapeMarkdown(i.name)}* ×${i.quantity} — ₹${i.price * i.quantity}\n`;
      if (i.customization) preview += `   _${escapeMarkdown(i.customization)}_\n`;
    });
    preview += `\n*Total: ₹${totalAmount}*`;

    await ctx.reply(preview, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Confirm Order', `confirm_order:${tempId}`),
          Markup.button.callback('❌ Cancel', 'cancel_order')
        ]
      ])
    });
  }

  // ─── TEXT HANDLER ─────────────────────────────────────────
  bot.on(message('text'), async (ctx) => {
    if (isRateLimited(ctx.from.id)) {
      return ctx.reply('⏳ You’re sending messages too fast. Please wait a few seconds.');
    }

    const text = ctx.message.text.trim();
    ctx.session = ctx.session || {};

    // Quick Actions
    if (text === '📖 View Menu') {
      const menuUrl = process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/menu`
        : 'http://localhost:3000/menu';
      return ctx.reply(`📖 Full digital menu:\n${menuUrl}`, mainKeyboard);
    }

    if (text === '⚡ Active Orders') {
      const activeOrders = await Order.find({
        customerChatId: ctx.chat.id.toString(),
        overallStatus: { $in: ['in_queue', 'pending', 'preparing', 'ready'] }
      }).sort({ createdAt: -1 }).limit(5);

      if (!activeOrders.length) {
        return ctx.reply('ℹ️ You have no active orders right now.', mainKeyboard);
      }

      let msg = `📊 *Your Active Orders*\n\n`;
      activeOrders.forEach((ord, idx) => {
        msg += `*#${idx + 1}* · Table ${ord.tableNumber} · *${ord.overallStatus.toUpperCase()}*\n`;
        ord.items.forEach((i) => {
          msg += `   • ${escapeMarkdown(i.name)} ×${i.quantity}\n`;
        });
        msg += `\n`;
      });
      return ctx.reply(msg, { parse_mode: 'Markdown', ...mainKeyboard });
    }

    if (text === '📅 Book a Table') {
      return ctx.reply(
        `🎙️ *Table Reservation*\n\n` +
        `Send a text or voice note like:\n` +
        `• *Book a seat for 2 people tonight at 8 PM*\n` +
        `• *Reserve table for 4 guests tomorrow 7:30 PM*`,
        { parse_mode: 'Markdown', ...mainKeyboard }
      );
    }

    if (text === '💳 Pay Bill & Leave') {
      const userName = ctx.from.first_name || 'Customer';
      const userPhone = ctx.session?.phoneNumber || `tg_${ctx.from.id}`;

      const { customer, perk } = await processCustomerLoyalty(userName, userPhone);

      let msg = `🎉 *Thank you for dining with us, ${escapeMarkdown(userName)}!*\n\n` +
        `📊 Total visits: *#${customer.visitCount}*\n`;

      if (perk) {
        msg += `\n🎁 *Reward unlocked:* ${escapeMarkdown(perk.title)}\n_${escapeMarkdown(perk.description)}_\n`;
      } else {
        const remaining = Math.max(0, 11 - customer.visitCount);
        if (remaining > 0) {
          msg += `\n💡 Complete *${remaining}* more visit(s) for a Free Dessert 🍨\n`;
        }
      }

      msg += `\nPayment prompt has been sent to your table. Have a wonderful day! 👋`;
      return ctx.reply(msg, { parse_mode: 'Markdown', ...mainKeyboard });
    }

    // Fast Regex Reservation Check (Bypasses AI delay for simple reservation texts)
    const isReservationQuery = /book|booking|reserve|reservation|seat|seats|slot|slots|party|table for|people|guests|person|persons|tonight|tomorrow|today|pm|am|clock/i.test(text);
    const hasFoodKeywords = /order|paneer|roti|tikka|naan|burger|coke|pizza|fries|chicken|samosa|biryani|dal|lassi|coffee|jamun|plate|plates/i.test(text);

    if (isReservationQuery && !hasFoodKeywords) {
      const guestMatch = text.match(/\d+/);
      const guestCount = guestMatch ? parseInt(guestMatch[0], 10) : 2;

      const newReservation = await Reservation.create({
        customerName: ctx.from.first_name || 'Guest',
        customerChatId: ctx.chat.id.toString(),
        telegramId: ctx.from.id.toString(),
        bookingDetails: text,
        guestCount: guestCount,
        status: 'confirmed'
      });

      try {
        const io = getIO();
        if (io) io.emit('reservation:new', newReservation);
      } catch (e) {}

      return ctx.reply(
        `🎉 *Table & Seat Reservation Confirmed!*\n\n` +
        `• *Name:* ${escapeMarkdown(ctx.from.first_name || 'Guest')}\n` +
        `• *Request:* "${escapeMarkdown(text)}"\n` +
        `• *Status:* Confirmed & Synced to Manager Panel ✅`,
        { parse_mode: 'Markdown', ...mainKeyboard }
      );
    }

    // Main AI Flow
    try {
      await ctx.reply('💬 Understanding your request…');

      const activeMenu = await getActiveMenu();
      if (!activeMenu.length) {
        return ctx.reply('⚠️ Menu is currently empty. Please try again later.', mainKeyboard);
      }

      const parsed = await parseTextOrder(text, activeMenu);

      if (parsed?.isReservation) {
        const newReservation = await Reservation.create({
          customerName: ctx.from.first_name || 'Guest',
          customerChatId: ctx.chat.id.toString(),
          telegramId: ctx.from.id.toString(),
          bookingDetails: text,
          guestCount: parsed.guestCount || 2,
          bookingTime: parsed.bookingTime || 'As requested',
          status: 'confirmed'
        });

        try {
          const io = getIO();
          if (io) io.emit('reservation:new', newReservation);
        } catch (e) {}

        return ctx.reply(
          `🎉 *Table Reservation Confirmed!*\n\n` +
          `• *Name:* ${escapeMarkdown(ctx.from.first_name || 'Guest')}\n` +
          `• *Guests:* ${parsed.guestCount || 2}\n` +
          `• *Details:* "${escapeMarkdown(text)}"\n` +
          `• *Status:* Confirmed ✅`,
          { parse_mode: 'Markdown', ...mainKeyboard }
        );
      }

      await processAndSaveOrder(ctx, parsed, 'telegram_text', text);
    } catch (err) {
      console.error('❌ Text handler error:', err);
      await ctx.reply(`⚠️ Failed to process: ${err.message || 'Unknown error'}`, mainKeyboard);
    }
  });

  // ─── VOICE HANDLER ────────────────────────────────────────
  bot.on(message('voice'), async (ctx) => {
    if (isRateLimited(ctx.from.id)) {
      return ctx.reply('⏳ You’re sending messages too fast. Please wait a few seconds.');
    }

    try {
      await ctx.reply('🎙️ Processing your voice note…');

      const activeMenu = await getActiveMenu();
      const voiceFile = await ctx.telegram.getFile(ctx.message.voice.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${voiceFile.file_path}`;

      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Could not download voice file');

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      const parsed = await parseAudioOrder(audioBuffer, 'audio/ogg', activeMenu);

      if (parsed?.isReservation) {
        const newReservation = await Reservation.create({
          customerName: ctx.from.first_name || 'Guest',
          customerChatId: ctx.chat.id.toString(),
          telegramId: ctx.from.id.toString(),
          bookingDetails: `Voice: ${parsed.guestCount || 2} guests @ ${parsed.bookingTime || 'requested time'}`,
          guestCount: parsed.guestCount || 2,
          bookingTime: parsed.bookingTime || 'As requested',
          status: 'confirmed',
          source: 'telegram_voice'
        });

        try {
          const io = getIO();
          if (io) io.emit('reservation:new', newReservation);
        } catch (e) {}

        return ctx.reply(
          `🎉 *Voice Reservation Confirmed!*\n\n` +
          `• *Guests:* ${parsed.guestCount || 2}\n` +
          `• *Timing:* ${escapeMarkdown(parsed.bookingTime || 'As requested')}\n` +
          `• *Status:* Reserved & Synced to Manager Panel ✅`,
          { parse_mode: 'Markdown', ...mainKeyboard }
        );
      }

      await processAndSaveOrder(ctx, parsed, 'telegram_voice');
    } catch (err) {
      console.error('❌ Voice handler error:', err);
      await ctx.reply(`⚠️ Failed to process voice note: ${err.message || 'Unknown error'}`, mainKeyboard);
    }
  });

  // Replace the bottom launch block with this error-proof launcher:
  bot.launch({
    dropPendingUpdates: true // Ignores old accumulated messages on bot restart
  })
    .then(() => console.log('🤖 Telegram Bot running (Optimized & Stock Sync Safe)'))
    .catch((err) => {
      console.error('⚠️ Telegram Bot Launch Error:', err.message);
      // Prevents whole Node process from crashing if Telegram API drops
    });

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}