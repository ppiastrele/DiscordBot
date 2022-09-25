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
  noobTalk: 0,
  smileSender: 1,
  randomSmileChance: 5,
}
let cronJobCount = 0;
const cronjobInterval = 60 * 60 * 1000;  //in milliseconds
const botTimeZone = "America/Sao_Paulo";
const botTimeFormat = "pt-BR";
const botStartDate = new Date();
const servers = {
  "521352924513828885": {
    name: "Primatas",
    demotivationalCounter: 0
  },
  "533264087917002752": {
    name: "xNeC",
    demotivationalCounter: 0
  }
}

const adminHelpText = "Vingador - Help Prompt\n\n• !smile\n• !upTime\n• !settings\n• !servers\n• !cronCount\n• !updateSettings-[setting]-[value]\n\t\tloginAlert: [0,1]\n\t\tlogoutAlert: [0,1]\n\t\tmoveChannelAlert: [0,1]\n\t\tnoobTalk: [0,1]\n\t\tsmileSender: [0,1]\n\t\trandomSmileChance: [0,1,2...99,100]";

const helpText = "Vingador - Help Prompt\n\n• !smile\n• !upTime";

//----------------------------------------------------------------------------------
//  Helper functions
//----------------------------------------------------------------------------------

function msToDays (ms) {
  const days = Math.floor(ms / (24*60*60*1000));
  const daysms = ms % (24*60*60*1000);
  const hours = Math.floor(daysms / (60*60*1000));
  const hoursms = ms % (60*60*1000);
  const minutes = Math.floor(hoursms / (60*1000));
  const minutesms = ms % (60*1000);
  const sec = Math.floor(minutesms / 1000);
  return `${days} days ${hours} hours ${minutes} minutes ${sec} seconds`;
}

//----------------------------------------------------------------------------------
//  Bot functions
//----------------------------------------------------------------------------------

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

function getServers(){
  let response = "";
  
  for (const key in servers) {
    if(response != "") response += "\n";
    response += `${key} -> ${servers[key].name} | ${servers[key].demotivationalCounter}`; 
  }

  return response;
}

function upTime(){
  const upTimeNow = new Date();
  const timeDiffMilliseconds = upTimeNow.getTime() - botStartDate.getTime();

  return `Since: ${botStartDate.toLocaleDateString('pt-BR', botTimeZone)} | ${botStartDate.toLocaleTimeString(botTimeFormat, botTimeZone)}\nUp time: ${msToDays(timeDiffMilliseconds)}`;
}

//----------------------------------------------------------------------------------
//  Client ready
//----------------------------------------------------------------------------------

client.on('ready', async () => {
  console.log(`Bot started at ${botStartDate.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}`);
  masterAdmin = await client.users.fetch(process.env.ADMIN_ID);
});

//----------------------------------------------------------------------------------
//  Text messages
//----------------------------------------------------------------------------------

client.on("messageCreate", async (message) => {

  if(!message?.author.bot){

    const messageContent = message?.content || "";
    const server = servers[message.guildId];
    
    //noobs talk
    if(settings.noobTalk){
      if(message?.author.username === "Faitas" || message?.author.username === "B Frozen"){
        message.reply('noob')
          .catch(console.error);
      }
    }
    
    if(messageContent === "!help"){
      sendChannelMessage(message, helpText, false);
    }

    if(messageContent === "!upTime"){
      sendChannelMessage(message, upTime(), false);
    }

    if(messageContent === "!smile"){
      sendChannelMessage(message, demotivationalMessage(), true);
      console.log(`Demotivational message sent by ${message?.author.username}`);
      if(server?.name){
        server.demotivationalCounter = 0;
      }
    }else{
      //random demotivational message sender
      if(settings.smileSender ){
        //name property is used to ensure server is one of the allowed ones
        if(server?.name){
          if(Math.random() > 0.85 || server.demotivationalCounter >= 6){
            console.log("Demotivational message sent (message chance)");
            sendChannelMessage(message, demotivationalMessage(), false);
            server.demotivationalCounter = 0;
          }else{
            server.demotivationalCounter++;
          }
        }
      }
    }
    
    //admin helper
    if(message?.author.id === masterAdmin.id){
      const adminMessage = messageContent.split("-");

      if(messageContent === "!adminHelp"){
        sendChannelMessage(message, adminHelpText, false);
      }

      if(messageContent === "!settings"){
        sendChannelMessage(message, getSettings(), false);
      }

      if(messageContent === "!servers"){
        sendChannelMessage(message, getServers(), false);
      }

      if(messageContent === "!cronCount"){
        sendChannelMessage(message, `${cronJobCount}`, false);
      }
      
      if(adminMessage[0] === "!updateSettings" && Number(adminMessage[2]) != NaN){
        const newValue = Number(adminMessage[2]);
        if(adminMessage[1] === "randomSmileChance"){
          if(newValue < 0 || newValue > 100){
            return;
          }
        }
        const response = updateSettings(adminMessage[1], newValue);
        masterAdmin.send(`Setting changed - ${adminMessage[1]} from ${response.oldValue} to ${response.newValue}`);
      }
    }
  }
});

//----------------------------------------------------------------------------------
//  Voice state
//----------------------------------------------------------------------------------

client.on("voiceStateUpdate", async (oldMemberState, newMemberState) => {

  if(servers[oldMemberState?.guild.id]){
    
    const serverName = servers[oldMemberState?.guild.id].name,
          member = await client.users.fetch(oldMemberState?.id),
          voiceDateObject = new Date(),
          voiceTime = voiceDateObject.toLocaleTimeString(botTimeFormat, {timeZone: botTimeZone, hour: '2-digit', minute: '2-digit'});

    let oldChannel,
        newChannel,
        timeServerUser = `${voiceTime} ${serverName} - ${member.username}`,
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
    
    if(message && member !== masterAdmin){
      masterAdmin.send(message);
      console.log(message);
    }

  }
});

//----------------------------------------------------------------------------------
//  Cron job
//----------------------------------------------------------------------------------

setInterval(async function() {
  cronJobCount++;

  //send demotivationalMessage with a change
  if(settings.smileSender && (Math.random()*100) < settings.randomSmileChance){
    let randomTime = Math.floor(Math.random()*60) * 60 * 1000; //between 0 and 59 minutes
    setTimeout( async () => {
      console.log("Demotivational message sent (cronjob)");
      await client.channels.fetch("533264087917002756")
        .then(channel => channel.send(demotivationalMessage()))
        .catch(console.error);
    }, randomTime);
  }

}, cronjobInterval);

//----------------------------------------------------------------------------------
//  Client login
//----------------------------------------------------------------------------------

client.login(process.env.DISCORD_TOKEN);
