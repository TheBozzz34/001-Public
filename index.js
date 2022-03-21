// Libraries and Imports

const { token } = require("./config.json");
const { pantryUrl } = require("./config.json");
const { dev_key } = require("./config.json");
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js')

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const PasteClient = require("pastebin-api").default;
const axios = require("axios");

const { Client, Intents } = require("discord.js");
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

const nekoclient = require("nekos.life");
const neko = new nekoclient();

const paste_client = new PasteClient(dev_key);

// Login Message, sets the bots activity and updates the servercount
client.on("ready", () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    client.user.setActivity("your browser history", { type: "WATCHING" });
    serverCount();
});

//Main neko command, gets and image from nekos.life
client.on("messageCreate", async (message) => {
    if (message.content.toLowerCase() === "n!neko") {
        async function test() {
            const response = await neko.sfw.neko();
            if (message.channel.nsfw) {
                message.channel.send(response.url);
            } else {
                message.channel.send("This command must be used in an NSFW channel");
            }
        }
        await test();
    }
});

//Simple server invite command
client.on("messageCreate", async (message) => {
    if (message.content.toLowerCase() === "n!invite") {
        const row = new MessageActionRow()
			.addComponents(
				new MessageButton()
 					.setURL('https://discord.com/api/oauth2/authorize?client_id=784544338956386365&permissions=274877975552&scope=bot')
					.setLabel('Invite')
					.setStyle('LINK'),
			);
		await message.reply({ content: 'Click the button below to invite me to your server', components: [row] });
    }
});

//Help menu command
client.on("messageCreate", async (message) => {
    if (message.content.toLowerCase() === "n!help") {
        const helpEmbed = new MessageEmbed()
            .setColor("#480091")
            //.setImage('https://cdn.discordapp.com/avatars/784544338956386365/58062a1155cd6e5ca7d36d7f47ead678.png')
            //.setDescription('001 Bot Help Menu')
            .addFields(
                { name: "n!neko", value: "Sends a random neko" },
                { name: "n!help", value: "This menu" },
                { name: "n!ping", value: "Tests the bots ping" },
                { name: "n!servers", value: "Lists the number of servers the bot is in" },
                { name: "n!cat", value: "Sends  random cat" },
                { name: 'n!lewdneko', value: 'Sends a lewd neko'},
                { name: 'n!paste', value: 'Uploads the provided attachment to pastebin'},
  		        { name: 'n!invite', value: 'Sends the bots invite url'}
            )
            .setTimestamp()
            .setFooter({ text: "Created by Sada\\n#9264", iconURL: "https://cdn.discordapp.com/avatars/784544338956386365/58062a1155cd6e5ca7d36d7f47ead678.png" });
        message.channel.send({ embeds: [helpEmbed] });
    }
});

//Checks the bots' response time
client.on("messageCreate", (message) => {
    if (message.content.toLowerCase() === "n!ping") {
        message.channel.send("Loading data").then(async (msg) => {
            msg.delete();
            message.channel.send(`🏓Latency is ${msg.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms`);
        });
    }
});

//Lists the server count
client.on("messageCreate", (message) => {
    if (message.content.toLowerCase() === "n!servers") {
        const serverCount = client.guilds.size;
        const countMessage = `I am currently in ${client.guilds.cache.size} guilds`;
        message.channel.send(countMessage);
    }
});

//Sends a random sfw cat image
client.on("messageCreate", (message) => {
    if (message.content.toLowerCase() === "n!cat") {
        axios({
            method: "get",
            url: "https://some-random-api.ml/img/cat",
            headers: {
                Accept: "application/json",
            },
        }).then(function (response) {
            message.channel.send(response.data.link);
        });
    }
});

//Sends a nsfw neko image from nekos.life
client.on('messageCreate', async message => {
        if (message.content.toLowerCase() === "n!lewdneko") {
          async function sendNsfw()  {
          if (message.channel.nsfw) {
            axios({
      		method: 'get',
      		url: 'https://nekos.life/api/v2/img/lewd',
      		headers: {
        		Accept: 'application/json'
      	    }
    	   })
       .then(function (response) {
          message.channel.send(response.data.url);
        });
        } else {
            message.channel.send("This command must be used in an NSFW channel");
        }
        }
          await sendNsfw();
        }
});

//Updates the server count and posts it to the json api
function serverCount() {
    const data = JSON.stringify({
        'guildCount': `${client.guilds.cache.size}`,
    });
    const config = {
        method: 'put',
        url: pantryUrl,
        headers: {
            'Content-Type': 'application/json',
        },
        data: data,
    };
    axios(config)
      .then(function(response) {
        console.log(JSON.stringify(response.data));
      })
      .catch(function(error) {
        console.log(error);
      });
}

serverCount()

//Updates the server count when the bot joins or leaves a guild
client.on("guildCreate", guild => {
    console.log("Joined a new guild: " + guild.name);
    serverCount();
})
client.on("guildDelete", function(guild){
    console.log(`the client deleted/left a guild`);
    serverCount();
});

//Manually update the server count
client.on("messageCreate", (message) => {
    if (message.content.toLowerCase() === "n!update") {
	if(message.author.id === "457659194535837727") {
		serverCount();
		message.react('👍');
        }
    }
});

//Uploads a file to pastebin.com
client.on("messageCreate", async (message) => {
    if (message.content.toLowerCase() === "n!paste") {
        const file = message.attachments.first()?.url;
        if (!file) return console.log('No attached file found');

        try {
            const msg = await message.channel.send('Uploading to https://pastebin.com');

            // fetch the file from the external URL
            const response = await fetch(file);

            // if there was an error send a message with the status
            if (!response.ok)
                return message.channel.send(
                    'There was an error with fetching the file:',
                    response.statusText,
                );

            // take the response stream and read it to completion
            const text = await response.text();

            if (text) {
                const url = await paste_client.createPaste({
                    code: text,
                    expireDate: "N",
                    //format: "text",
                    name: "Paste from " + message.author.username,
                    publicity: 0,
                });
                await msg.edit(url);
            }
        } catch (error) {
            console.log(error);
        }
    }
});

//Logs into discord
client.login(token)