import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';
import { parseAudioOrder, parseTextOrder } from './aiService.js';
import { getIO } from '../socket/socketHandler.js';
import { processCustomerLoyalty } from '../routes/authRoutes.js';

export function initTelegramBot() {
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  // 1. /start Command Handler (Prompts for Contact Share)
  bot.start(async (ctx) => {
    const userName = ctx.from.first_name || 'Guest';

    await ctx.reply(
      `👋 *Welcome to DineFlow AI, ${userName}!*\n\nOrder instantly by typing a message OR sending a voice note in English, Hindi, or Hinglish!\n\nTo sync your Web & Telegram loyalty perks (Free Dessert, Free Drinks & Discounts), tap the button below to share your contact:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            [{ text: '📱 Share Phone Number for Loyalty Perks', request_contact: true }]
          ],
          one_time_keyboard: true,
          resize_keyboard: true
        }
      }
    );
  });

  // 2. 📲 Contact Receive Handler (Syncs Phone with Web App Loyalty Profile)
  bot.on(message('contact'), async (ctx) => {
    const phoneNumber = ctx.message.contact.phone_number;
    const userName = ctx.from.first_name || 'Guest';

    // Process loyalty using the actual phone number
    const { customer, perk } = await processCustomerLoyalty(userName, phoneNumber);

    let msg = `✅ *Phone Number Linked!* (${phoneNumber})\n\n`;
    msg += `📊 *Your Loyalty Status:* Visit #${customer.visitCount}\n`;

    if (perk) {
      msg += `\n${perk.title}\n_${perk.description}_\n`;
    } else {
      const remaining = 11 - customer.visitCount;
      if (remaining > 0) {
        msg += `\n💡 _Complete ${remaining} more visit(s) to unlock a Free Dessert!_ 🍨\n`;
      }
    }

    // Hide custom keyboard and send status update
    await ctx.replyWithMarkdown(msg, { reply_markup: { remove_keyboard: true } });
  });

  // 3. Core Order Processing & Loyalty Integration
  async function processAndSaveOrder(ctx, parsedOrder, source) {
    if (!parsedOrder || !parsedOrder.items || parsedOrder.items.length === 0) {
      return ctx.reply("❌ Couldn't identify any menu items in your request. Please check the menu and try again.");
    }

    const activeMenu = await MenuItem.find({ isAvailable: true });
    let totalAmount = 0;
    const orderItems = [];

    // Match parsed items against active DB menu
    for (const item of parsedOrder.items) {
      const menuItem = activeMenu.find(m => m._id.toString() === item.menuItemId);
      if (menuItem) {
        totalAmount += menuItem.price * item.quantity;
        orderItems.push({
          menuItem: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: item.quantity,
          customization: item.customization || ''
        });

        // Update inventory count
        menuItem.stockCount = Math.max(0, menuItem.stockCount - item.quantity);
        await menuItem.save();
      }
    }

    if (orderItems.length === 0) {
      return ctx.reply("❌ None of the requested items match our active restaurant menu.");
    }

    // Process Loyalty Visit & Calculate Perks
    // Uses Telegram ID as fallback key if phone was not shared
    const userName = ctx.from.first_name || 'Customer';
    const userPhone = `tg_${ctx.from.id}`;
    const { customer, perk } = await processCustomerLoyalty(userName, userPhone);

    // Apply percentage discount if unlocked (>30 visits)
    let finalAmount = totalAmount;
    if (perk && perk.type === 'DISCOUNT' && perk.discountPercent > 0) {
      const discount = (totalAmount * perk.discountPercent) / 100;
      finalAmount = Math.round(totalAmount - discount);
    }

    // Save Order to MongoDB
    const newOrder = await Order.create({
      tableNumber: 1,
      telegramId: ctx.from.id.toString(),
      items: orderItems,
      source: source,
      totalAmount: finalAmount
    });

    // Notify Kitchen Display System (KDS) via Socket.io
    try {
      const io = getIO();
      io.to('kitchen').emit('order:new', newOrder);
    } catch (e) {
      console.log('⚠️ Socket notification warning:', e.message);
    }

    // Construct Telegram Confirmation Summary
    let summary = `✅ *Order Confirmed!* (Table 1)\n\n`;
    orderItems.forEach(i => {
      summary += `• *${i.name}* x${i.quantity} - ₹${i.price * i.quantity}\n`;
      if (i.customization) summary += `  _Note: ${i.customization}_\n`;
    });

    if (parsedOrder.waiterNote) {
      summary += `\n🔔 *Staff Request:* ${parsedOrder.waiterNote}\n`;
    }

    summary += `\n*Subtotal:* ₹${totalAmount}\n`;

    // Append Loyalty Perk Details to Message
    if (perk) {
      summary += `\n${perk.title}\n_${perk.description}_\n`;
      if (perk.type === 'DISCOUNT') {
        summary += `*Discounted Total:* ~₹${totalAmount}~ ➡️ *₹${finalAmount}*\n`;
      }
    } else {
      summary += `*Total Amount:* ₹${finalAmount}\n`;
      summary += `\n💡 *Loyalty Status:* Visit #${customer.visitCount} | Complete ${11 - customer.visitCount} more visit(s) to unlock a Free Dessert! 🍨\n`;
    }

    summary += `\n⚡ *DineFlow AI:* Order sent directly to the kitchen!`;

    await ctx.replyWithMarkdown(summary);
  }

  // 💬 4. TEXT ORDER HANDLER
  bot.on(message('text'), async (ctx) => {
    try {
      await ctx.reply('💬 Reading your message...');
      const activeMenu = await MenuItem.find({ isAvailable: true });

      if (!activeMenu || activeMenu.length === 0) {
        return ctx.reply("⚠️ Menu is currently empty in MongoDB! Please insert menu items first.");
      }

      const parsedOrder = await parseTextOrder(ctx.message.text, activeMenu);
      await processAndSaveOrder(ctx, parsedOrder, 'telegram_text');
    } catch (err) {
      console.error('❌ Detailed Text Order Error:', err);
      ctx.reply(`⚠️ Failed to process order: ${err.message || 'Unknown error'}`);
    }
  });

  // 🎙️ 5. VOICE ORDER HANDLER
  bot.on(message('voice'), async (ctx) => {
    try {
      await ctx.reply('🎙️ Processing voice note...');
      const activeMenu = await MenuItem.find({ isAvailable: true });

      if (!activeMenu || activeMenu.length === 0) {
        return ctx.reply("⚠️ Menu is currently empty in MongoDB! Please insert menu items first.");
      }

      const voiceFile = await ctx.telegram.getFile(ctx.message.voice.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${voiceFile.file_path}`;

      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);

      const parsedOrder = await parseAudioOrder(audioBuffer, 'audio/ogg', activeMenu);
      await processAndSaveOrder(ctx, parsedOrder, 'telegram_voice');
    } catch (err) {
      console.error('❌ Detailed Voice Order Error:', err);
      ctx.reply(`⚠️ Failed to process voice note: ${err.message || 'Unknown error'}`);
    }
  });

  bot.launch();
  console.log('🤖 Telegram Bot Running (Text + Voice + Share Contact Loyalty ready)...');
}