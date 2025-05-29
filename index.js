import { Telegraf } from "telegraf";
import ytdl from "ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import axios from "axios";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
ffmpeg.setFfmpegPath(ffmpegPath);

bot.command("start", (ctx) => {
  ctx.reply("سلام! برای پخش موزیک بنویس: پخش هایده");
});

bot.hears(/^پخش (.+)/i, async (ctx) => {
  const query = ctx.match[1];

  try {
    ctx.reply(`🔍 جستجو برای: "${query}" ...`);

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
    const output = `/tmp/output_${Date.now()}.mp3`;

    const stream = ytdl(url, { filter: 'audioonly' });

    ffmpeg(stream)
      .audioBitrate(128)
      .save(output)
      .on("end", async () => {
        try {
          await ctx.replyWithAudio(
            { source: fs.createReadStream(output) },
            {
              title,
              caption: `🎵 ${title}`,
              reply_markup: {
                inline_keyboard: [
                  [{ text: "📺 مشاهده در یوتیوب", url }],
                  [{ text: "❌ حذف", callback_data: "delete" }]
                ]
              }
            }
          );
        } finally {
          fs.unlinkSync(output); // حذف فایل بعد از ارسال
        }
      });

  } catch (err) {
    console.error(err);
    ctx.reply("🚫 مشکلی در پخش موزیک پیش آمد.");
  }
});

bot.launch();
