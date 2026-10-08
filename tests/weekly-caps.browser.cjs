const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mock=`
window.__capMock={settings:{id:true,weekly_caps_enabled:false,revision:1,updated_by:'Test Admin'},rows:[{broker_name:'Test Broker',weekly_cap:3,weekly_used:2,cap_revision:1,weekly_caps_enabled:false,resets_at:'2026-10-12T04:00:00Z'}],failFeature:false,failLoad:false};
window.supabase={createClient:()=>({
 from(table){const q={select(){return q},eq(){return q},order(){return q},limit(){return q},insert(){return q},upsert(){return q},single(){q.singleRow=true;return q},then(resolve){const m=window.__capMock;const data=table==='broker_cap_settings'?m.settings:table==='brokers'?[{broker_name:'Test Broker',data:{name:'Test Broker',minLiquid:50000,minNetWorth:100000,minCredit:600,location_mode:'us_wide',location_states:[],booking:'https://example.com',requiresStatus:[]}}]:[];return Promise.resolve({data,error:table==='broker_cap_settings'&&m.failLoad?{message:'Offline'}:null}).then(resolve)}};return q},
 async rpc(name,args){const m=window.__capMock;
 if(name==='get_broker_weekly_usage')return {data:m.rows,error:m.failLoad?{message:'Offline'}:null};
 if(name==='set_broker_cap_settings'){if(m.failFeature)return {error:{message:'Settings changed in another session. Refresh and retry.'}};m.settings={...m.settings,weekly_caps_enabled:args.p_enabled,revision:m.settings.revision+1};m.rows.forEach(r=>r.weekly_caps_enabled=args.p_enabled);return {data:m.settings};}
 if(name==='set_broker_weekly_cap'){const row=m.rows.find(r=>r.broker_name===args.p_broker_name);if(row.cap_revision!==args.p_revision)return {error:{message:'Conflict'}};row.weekly_cap=args.p_cap;row.cap_revision++;return {data:{weekly_cap:row.weekly_cap,revision:row.cap_revision}};}
 return {error:{message:'Unexpected RPC'}};
 }
})};`;
(async()=>{
 fs.mkdirSync(path.join(root,'.test-work'),{recursive:true});
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;let passed=0;
 const check=async(name,fn)=>{await fn();passed++;console.log('PASS '+name);};
 try{
  browser=await chromium.launch({executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',headless:true});
  const page=await browser.newPage({viewport:{width:1360,height:1000}});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());
  await page.route('**/*',route=>{
   const url=route.request().url();if(url.includes('cdn.jsdelivr.net/npm/@supabase/supabase-js@2'))return route.fulfill({contentType:'application/javascript',body:mock});
   if(url.startsWith('http://127.0.0.1:'))return route.continue();return route.abort();
  });
  await page.addInitScript(()=>sessionStorage.setItem('broker-admin-name-v1','Test Admin'));
  await page.goto(`http://127.0.0.1:${server.address().port}/brokers.html`);
  await page.locator('[data-cap-input]').waitFor();
  await check('actual admin page loads controls and tracking status',async()=>{assert.match(await page.locator('#weekly-cap-feature-status').textContent(),/^Off/);assert.equal(await page.locator('[data-cap-status]').textContent(),'Tracking only');});
  await check('global switch saves and updates effective status',async()=>{await page.locator('#weekly-caps-enabled').check();await page.locator('#weekly-cap-feature-save').click();await page.waitForFunction(()=>document.getElementById('weekly-cap-message').textContent.includes('enabled and saved'));assert.equal(await page.locator('[data-cap-status]').textContent(),'1 remaining');});
  await check('per-broker cap saves and reports reached capacity',async()=>{await page.locator('[data-cap-input]').fill('1');await page.locator('[data-cap-save]').click();await page.waitForFunction(()=>document.querySelector('[data-cap-status]').textContent==='At cap');});
  await check('blank saves unlimited',async()=>{await page.locator('[data-cap-input]').fill('');await page.locator('[data-cap-save]').click();await page.waitForFunction(()=>document.querySelector('[data-cap-status]').textContent==='Unlimited');});
  await check('invalid negative value rejected without backend save',async()=>{await page.locator('[data-cap-input]').fill('-1');await page.locator('[data-cap-save]').click();assert.match(await page.locator('#weekly-cap-message').textContent(),/whole-number/);assert.equal(await page.evaluate(()=>window.__capMock.rows[0].weekly_cap),null);});
  await check('conflicting global save does not pretend success',async()=>{await page.evaluate(()=>window.__capMock.failFeature=true);await page.locator('#weekly-caps-enabled').uncheck();await page.locator('#weekly-cap-feature-save').click();await page.waitForFunction(()=>document.getElementById('weekly-cap-message').textContent.startsWith('Not saved:'));assert.equal(await page.locator('#weekly-caps-enabled').isChecked(),true);});
  await check('refresh restores persisted values',async()=>{await page.locator('#weekly-cap-refresh').click();await page.waitForFunction(()=>document.querySelector('[data-cap-input]').value==='');});
  await page.screenshot({path:path.join(__dirname,'../.test-work/admin-controls-desktop.png'),fullPage:false});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:path.join(__dirname,'../.test-work/admin-controls-mobile.png'),fullPage:false});
  await check('load failure disables writes',async()=>{await page.evaluate(()=>window.__capMock.failLoad=true);await page.locator('#weekly-cap-refresh').click();await page.waitForFunction(()=>document.getElementById('weekly-cap-message').textContent.includes('Could not load'));assert.equal(await page.locator('#weekly-cap-feature-save').isDisabled(),true);assert.equal(await page.locator('[data-cap-save]').isDisabled(),true);});
  assert.deepEqual(errors,[]);console.log(`${passed} browser tests passed; no page errors.`);
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
