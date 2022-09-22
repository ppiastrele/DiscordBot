import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits } from 'discord.js';
import { demotivationalQuotes } from './helper/demotivationalQuotes.js';

const client = new Client({
  intents:[
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let masterAdmin;
let settings = {
  loginAlert: 1,
  logoutAlert: 1,
  moveChannelAlert: 0,
  trashTalk: 1,
  noobTalk: 0,
}
const allowedServers = {
  "521352924513828885": {name: "Primatas"},
  "533264087917002752": {name: "xNeC"},
}
const xingamentosFaitas = [
  "Faitas, seu noob",
  "Faitas, noob lazarento",
  "Muito noob esse Faitas",
  "Impossivel ser mais noob que o Faitas!",
];

const helpText = "Vingador - Help Prompt\n\n• !smile\n\n• !xingarFaitas\n\n• !xingarAyen\n\n• !settings\n• !updateSettings-[setting]-[value]\n\t\tloginAlert: [0,1]\n\t\tlogoutAlert: [0,1]\n\t\tmoveChannelAlert: [0,1]\n\t\ttrashTalk: [0,1]\n\t\tnoobTalk: [0,1]";

//----------------------------------------------------------------------------------
//  Helper functions
//----------------------------------------------------------------------------------

function xingarFaitas(){
  let randomNum = Math.floor(Math.random()*xingamentosFaitas.length);

  return xingamentosFaitas[randomNum];
}

function demotivationalMessage(){
  let randomNum = Math.floor(Math.random()*demotivationalQuotes.length);

  return demotivationalQuotes[randomNum];
}

async function sendChannelMessage(message, text, deleteOP = false){
  await client.channels.fetch(message.channelId)
    .then(channel => channel.send(text))
    .then(() => {
      if(deleteOP === true)
        message.delete();
    })
    .catch(console.error);
}

function updateSettings(setting, newValue){
  const oldValue = settings[setting];
  settings[setting] = newValue;

  return {
    oldValue: oldValue,
    newValue: newValue
  };
}

function getSettings(){
  let response = "";
  
  for (const key in settings) {
    if(response != "") response += "\n";
    response += `${key} -> ${settings[key]}`; 
  }

  return response;
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

    const messageContent = message?.content || "";
    
    //trash talk
    if(settings.trashTalk){
      if(settings.noobTalk){
        if(message?.author.username === "Faitas" || message?.author.username === "B Frozen"){
          message.reply('noob')
            .catch(console.error);
        }

        if(message?.author.username === "Jairo"){
          sendChannelMessage(message, "eu só respondo o noob do faitas...", false);
        }
      }

      if(messageContent === "!xingarFaitas"){
        sendChannelMessage(message, xingarFaitas(), true);
      }
      
      if(messageContent === "!xingarAyen"){
        sendChannelMessage(message, "Faitas noob xD", true);
      }
    }

    if(messageContent === "!smile"){
      sendChannelMessage(message, demotivationalMessage(), true);
    }
    
    //admin helper
    if(message?.author.id === masterAdmin.id){
      const adminMessage = messageContent.split("-");

      if(messageContent === "!help"){
        sendChannelMessage(message, helpText, false);
      }

      if(messageContent === "!settings"){
        sendChannelMessage(message, getSettings(), false);
      }
      
      if(adminMessage[0] === "!updateSettings" && Number(adminMessage[2]) != NaN){
        const response = updateSettings(adminMessage[1], Number(adminMessage[2]));
        masterAdmin.send(`Setting changed - ${adminMessage[1]} from ${response.oldValue} to ${response.newValue}`);
      }
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
        timeServerUser = `${time} ${serverName} - ${member.username}`,
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

    if(settings.moveChannelAlert && userWasHere && userIsHere){
      message = `${timeServerUser} moved from ${oldChannel?.name} to ${newChannel?.name}`;
    }else if(settings.loginAlert && userIsHere && !userWasHere){
      message = `${timeServerUser} logged in to ${newChannel?.name}`;
    }else if(settings.logoutAlert && !userIsHere && userWasHere){
      message = `${timeServerUser} logged out`;
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
