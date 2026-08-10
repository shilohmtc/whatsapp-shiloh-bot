const logger = require('../lib/logger');

const TOKEN_URL='https://oauth2.googleapis.com/token';
const CALENDAR_API='https://www.googleapis.com/calendar/v3';

function clean(v){return String(v||'').trim();}
async function accessToken(){
 const client_id=clean(process.env.GOOGLE_OAUTH_CLIENT_ID),client_secret=clean(process.env.GOOGLE_OAUTH_CLIENT_SECRET),refresh_token=clean(process.env.GOOGLE_OAUTH_REFRESH_TOKEN);
 if(!client_id||!client_secret||!refresh_token)throw new Error('Google OAuth credentials are not configured');
 const r=await fetch(TOKEN_URL,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id,client_secret,refresh_token,grant_type:'refresh_token'})});
 if(!r.ok)throw new Error(`Google token request failed (${r.status}): ${(await r.text()).slice(0,300)}`);
 return (await r.json()).access_token;
}
async function request(path,options={}){const token=await accessToken();const r=await fetch(`${CALENDAR_API}${path}`,{...options,headers:{authorization:`Bearer ${token}`,'content-type':'application/json',...(options.headers||{})}});const text=await r.text();let body=null;try{body=text?JSON.parse(text):null}catch(_){body=text}if(!r.ok){const e=new Error(`Google Calendar API failed (${r.status})`);e.status=r.status;e.body=body;throw e;}return body;}
async function ensureAcl(calendarId,email,role){
 const list=await request(`/calendars/${encodeURIComponent(calendarId)}/acl?maxResults=250`);
 const existing=(list.items||[]).find(x=>x.scope?.type==='user'&&String(x.scope?.value||'').toLowerCase()===email.toLowerCase());
 if(existing?.role===role)return {changed:false,role,email};
 if(existing){await request(`/calendars/${encodeURIComponent(calendarId)}/acl/${encodeURIComponent(existing.id)}`,{method:'PUT',body:JSON.stringify({role,scope:{type:'user',value:email}})});return {changed:true,updated:true,role,email};}
 await request(`/calendars/${encodeURIComponent(calendarId)}/acl?sendNotifications=true`,{method:'POST',body:JSON.stringify({role,scope:{type:'user',value:email}})});return {changed:true,created:true,role,email};
}
async function runGoogleCalendarAccessSetupFromEnv(){
 if(process.env.RUN_GOOGLE_CALENDAR_ACCESS_SETUP!=='true')return {status:'disabled'};
 const calendarId=clean(process.env.GOOGLE_BOOKING_CALENDAR_ID);if(!calendarId)throw new Error('GOOGLE_BOOKING_CALENDAR_ID missing');
 const results=[];
 const christel=clean(process.env.CHRISTEL_CALENDAR_EMAIL);if(christel)results.push(await ensureAcl(calendarId,christel,'writer'));
 const jeanPierre=clean(process.env.JEAN_PIERRE_CALENDAR_EMAIL);if(jeanPierre)results.push(await ensureAcl(calendarId,jeanPierre,'writer'));
 logger.info({calendarId:calendarId.slice(0,12)+'…',results},'Google Calendar staff access setup completed');return {status:'ok',results};
}
module.exports={runGoogleCalendarAccessSetupFromEnv,ensureAcl};
