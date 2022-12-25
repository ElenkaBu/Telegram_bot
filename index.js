const TelegramApi = require('node-telegram-bot-api');
const { gameOptions, againOptions } = require('./options');
const sequelize = require('./db');
const User = require('./models');

const token = '5810789216:AAEGuQQ0i2N2VhdnoKLyCuU9b5e1le7P9gM';

const bot = new TelegramApi(token, { polling: true });

const chats = {};

const startGame = async (chatId) => {
  await bot.sendMessage(chatId, 'Я загадал цифру от 0 до 9, попробуй угадать!');
  const randomNumber = Math.floor(Math.random() * 10);
  chats[chatId] = randomNumber;
  await bot.sendMessage(chatId, 'Угадывай!', gameOptions);
};

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
  } catch (e) {
    console.log('Ошибка подключения к БД', e);
  }
  bot.setMyCommands([
    { command: '/start', description: 'Приветствие' },
    { command: '/info', description: 'Информация о пользователе' },
    { command: '/game', description: 'Игра "Угадай цифру"' },
  ]);
  bot.on('message', async (msg) => {
    const { text } = msg;
    const chatId = msg.chat.id;
    try {
      if (text === '/start') {
        await User.create({ chatId });
        await bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/059/21b/05921baa-3975-321f-be6b-c4bbd05f1f4d/192/13.webp');
        return bot.sendMessage(chatId, 'Добро пожаловать, выберите нужный пункт меню!');
      }
      if (text === '/info') {
        const user = await User.findOne({ chatId });
        return bot.sendMessage(chatId, `Вас зовут ${msg.from.first_name}, у вас ${user.right} правильных ответов и ${user.wrong} неправильных ответов`);
      }
      if (text === '/game') {
        return startGame(chatId);
      }
      return bot.sendMessage(chatId, 'Я тебя не понимаю, попробуй еще раз');
    } catch (e) {
      return bot.sendMessage(chatId, 'Произошла ошибка!');
    }
  });
  bot.on('callback_query', async (msg) => {
    const { data } = msg;
    const chatId = msg.message.chat.id;
    if (data === '/again') {
      return startGame(chatId);
    }
    const user = await User.findOne({ chatId });
    if (data === chats[chatId]) {
      user.right += 1;
      await bot.sendMessage(chatId, `Поздравляю, ты отгадал цифру ${chats[chatId]}`, againOptions);
    } else {
      user.wrong += 1;
      await bot.sendMessage(chatId, `К сожалению, ты не угадал, бот загадал цифру ${chats[chatId]}`, againOptions);
    }
    await user.save();
  });
};

start();
