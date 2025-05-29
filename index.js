import { Telegraf } from "telegraf";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command("start", (ctx) => {
  ctx.reply("سلام! برای پخش موزیک بنویس: پخش هایده");
});

bot.hears(/^پخش (.+)/i, async (ctx) => {
  const query = ctx.match[1];

  try {
    ctx.reply(`🔍 در حال جستجو برای: "${query}" ...`);

    const response = await axios.get(
      `https://youtube.googleapis.com/youtube/v3/search`, {
        params: {
          part: "snippet",
          q: query,
          key: process.env.YOUTUBE_API_KEY,
          maxResults: 1,
          type: "video"
        }
    });

    if (!response.data.items.length) {
      return ctx.reply("❗ نتیجه‌ای پیدا نشد.");
    }

    const video = response.data.items[0];
    const videoId = video.id.videoId;
    const title = video.snippet.title;
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const mp3Link = `https://api.vevioz.com/api/button/mp3/${videoId}`;

    await ctx.replyWithHTML(
      `🎵 <b>${title}</b>\n\n📺 <a href="${url}">مشاهده در یوتیوب</a>\n⬇️ <a href="${mp3Link}">لینک مستقیم دانلود MP3</a>`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🎧 مشاهده در یوتیوب", url }],
            [{ text: "⬇️ دانلود MP3", url: mp3Link }]
          ]
        },
        disable_web_page_preview: false
      }
    );

  } catch (err) {
    console.error(err);
    ctx.reply("🚫 مشکلی در پخش موزیک پیش آمد.");
  }
});

bot.launch();
