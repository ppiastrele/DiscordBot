import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents:[
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const config = {
  loginAlert: true,
  logoutAlert: true,
  moveChannelAlert: false,
}
const allowedServers = {
  "521352924513828885": {name: "Primatas"},
  "533264087917002752": {name: "xNeC"},
}
let masterAdmin;

//----------------------------------------------------------------------------------
//  Helper functions
//----------------------------------------------------------------------------------

function xingarFaitas(){
  let randomNum = Math.floor(Math.random()*4);
  const xingamentosFaitas = [
    "Faitas, seu noob",
    "Faitas, noob lazarento",
    "Muito noob esse Faitas",
    "Impossivel ser mais noob que o Faitas!",
  ];

  return xingamentosFaitas[randomNum];
}

//----------------------------------------------------------------------------------
//  Client ready
//----------------------------------------------------------------------------------

client.on('ready', async () => {
  console.log(`Logged in...`);
  masterAdmin = await client.users.fetch(process.env.ADMIN_ID);
});

//----------------------------------------------------------------------------------
//  Text messages
//----------------------------------------------------------------------------------

client.on("messageCreate", async (message) => {

  if(!message?.author.bot){
    
    if(message?.author.username === "Faitas" || message?.author.username === "B Frozen"){
      message.reply('noob')
        .then(() => console.log(`${message.author.username} said "${message.content}"`))
        .catch(console.error);
    }

    if(message?.author.username === "Jairo"){
      await client.channels.fetch(message.channelId)
        .then(channel => channel.send("eu só respondo o noob do faitas..."))
        .catch(console.error);
    }

    if(message?.content === "!xingarFaitas"){
      await client.channels.fetch(message.channelId)
        .then(channel => channel.send(xingarFaitas()))
        .catch(console.error);
    }
    
    if(message?.content === "!xingarAyen"){
      await client.channels.fetch(message.channelId)
        .then(channel => channel.send("Faitas noob xD"))
        .catch(console.error);
    }
  }
});

//----------------------------------------------------------------------------------
//  Voice state
//----------------------------------------------------------------------------------

client.on("voiceStateUpdate", async (oldMemberState, newMemberState) => {

  if(allowedServers[oldMemberState?.guild.id]){
    
    const serverName = allowedServers[oldMemberState?.guild.id].name,
          member = await client.users.fetch(oldMemberState?.id),
          date = new Date();

    let oldChannel,
        newChannel,
        time = date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}),
        timeSerrverUser = `${time} ${serverName} - ${member.username}`,
        message,
        userWasHere = false,
        userIsHere = false;

    if(oldMemberState.channelId){
      oldChannel = await client.channels.fetch(oldMemberState?.channelId);
      userWasHere = true;
    }
    if(newMemberState.channelId){
      newChannel = await client.channels.fetch(newMemberState?.channelId);
      userIsHere = true;
    }

    if(config.moveChannelAlert && userWasHere && userIsHere){
      message = `${timeSerrverUser} moved from ${oldChannel?.name} to ${newChannel?.name}`;
    }else if(config.loginAlert && userIsHere && !userWasHere){
      message = `${timeSerrverUser} logged in to ${newChannel?.name}`;
    }else if(config.logoutAlert && !userIsHere && userWasHere){
      message = `${timeSerrverUser} logged out`;
    }
    
    if(message){
      masterAdmin.send(message);
      console.log(message);
    }

  }
});

//----------------------------------------------------------------------------------
//  Client login
//----------------------------------------------------------------------------------

client.login(process.env.DISCORD_TOKEN);
