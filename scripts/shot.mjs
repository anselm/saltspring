// headless render check: load the island, wait for tiles, screenshot
import { spawn } from 'node:child_process';
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
const base = process.env.HOME + '/.cache/ms-playwright';
const dir = readdirSync(base).find((d) => d.startsWith('chromium-') && !d.includes('headless'));
const URL = process.env.URL || 'http://localhost:8500/';
mkdirSync(new globalThis.URL('../artifacts/', import.meta.url).pathname, { recursive: true });
const chrome = spawn(`${base}/${dir}/chrome-linux64/chrome`, ['--headless=new','--remote-debugging-port=9260','--use-gl=angle','--use-angle=vulkan','--enable-unsafe-swiftshader','--window-size=1400,900','--no-sandbox','--no-first-run','--user-data-dir=/tmp/ssshot','about:blank']);
chrome.stderr.on('data',()=>{});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
let page; for(let i=0;i<40;i++){try{const l=await(await fetch('http://localhost:9260/json/list')).json();page=l.find(t=>t.type==='page');if(page)break;}catch{}await sleep(250);}
const ws=new (await import('ws')).WebSocket(page.webSocketDebuggerUrl);
await new Promise(r=>ws.on('open',r));
let id=0;const pending=new Map();const logs=[];
ws.on('message',d=>{const m=JSON.parse(d.toString());if(m.id&&pending.has(m.id)){pending.get(m.id)(m.result);pending.delete(m.id);}
 if(m.method==='Runtime.exceptionThrown')logs.push('EXC '+(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text||'').split('\n')[0]);
 if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')logs.push('ERR '+m.params.args.map(a=>a.value??a.description??'').join(' ').slice(0,160));});
const send=(m,p={})=>new Promise(res=>{const i=++id;pending.set(i,res);ws.send(JSON.stringify({id:i,method:m,params:p}));});
const ev=async e=>(await send('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true})).result?.value;
await send('Runtime.enable');await send('Page.enable');
await send('Network.enable'); await send('Network.setCacheDisabled',{cacheDisabled:true});
await send('Page.navigate',{url:URL});
await sleep(Number(process.env.WAIT||22000));
console.log('cards:', await ev(`document.querySelectorAll('.card, .chip').length`));
const s=await send('Page.captureScreenshot',{format:'png'});
writeFileSync(new globalThis.URL(`../artifacts/${process.env.NAME||'shot'}.png`, import.meta.url).pathname, Buffer.from(s.data,'base64'));
console.log('logs:', logs.slice(-5).join(' | ')||'(clean)');
ws.close();chrome.kill();process.exit(0);
