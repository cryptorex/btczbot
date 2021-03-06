const format = require('../format')
const coinmarketcap = require('../api/coinmarketcap')
const btczexplorer = require('../api/btczexplorer')
const insightexplorer = require('../api/insightexplorer')

const stats = (reply, message) => {
    // NOTE: This waiting deal allows us to make three async calls and finish
    // once all three are done by calling callback on the 3rd one to finish.
    // Wicked awesome find on stackoverflow.
    let waiting = 3

    let stats = []

    const callback = () => reply(message, stats.join('\n'))

    coinmarketcap.BTCZTicker().then(ticker => {
        stats.push(...[
            `Price: *${format.coins(ticker.price_btc)} BTC (${format.usd(ticker.price_usd)})*`,
            `24hr Vol (USD): *${format.usd(ticker['24h_volume_usd'])}*`,
            `Market Cap: *${format.usd(ticker.market_cap_usd)}*`,
            `Supply: *${format.integer(ticker.total_supply)} BTCZ*`,
        ])

        if (--waiting === 0) {
            callback()
        }
    })

    insightexplorer.status().then(ticker => {
        stats.push(...[
            `Difficulty: *${format.integer(ticker.difficulty)}*`,
            `Block Height: *${format.integer(ticker.blocks)}*`,
        ])

        if (--waiting === 0) {
            callback()
        }
    })

    btczexplorer.netowrkHashrate().then(hashrate => {
        stats.push(...[
            `Network Hashrate: *${format.hashrate(hashrate)}*`,
        ])

        if (--waiting === 0) {
            callback()
        }
    })
}

module.exports.init = (controller, general) => {
    controller.hears(
        ['!stats'],
        'bot_message',
        (bot, message) => message.channel == general
            ? bot.reply(message, 'Please use #bot-chat for this command. (telegram: https://t.me/joinchat/GIIFnhKijb9hWUskgwpxoA)')
            : stats(bot.reply, message)
    )

    controller.hears(
        ['!stats'],
        'ambient,mention',
        (bot, message) => stats(bot.whisper, message)
    )

    controller.hears(
        ['!stats'],
        'direct_message,direct_mention',
        (bot, message) => stats(bot.reply, message)
    )
}

