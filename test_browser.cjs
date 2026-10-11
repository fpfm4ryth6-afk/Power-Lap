const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((q,r)=>{const n=q.url.split('?')[0]==='/'?'index.html':q.url.split('?')[0].slice(1);const p=path.resolve(root,n);if(!p.startsWith(root+path.sep)){r.writeHead(403);return r.end();}try{r.setHeader('Content-Type',n.endsWith('.js')?'application/javascript':n.endsWith('.webmanifest')?'application/manifest+json':'text/html');r.end(fs.readFileSync(p));}catch{r.writeHead(404);r.end();}});
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 let browser;const results=[];
 try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [1280,390]){
 const context=await browser.newContext({viewport:{width,height:844}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/`);
 await page.evaluate(()=>{
 state.uiMode='pro';state.pressureMode='manual';state.measurementMode='raw';state.cumulative=false;
 const vals={mass:1400,driver:100,load:0,cw:.3,area:2.333333,cda:.7,temp:15,pressure:1013.25,da:0,slope:0,wind:0};
 for(const [k,v]of Object.entries(vals))document.getElementById(k).value=String(v);
 for(const el of document.querySelectorAll('input[id^="time_"]'))el.value='1';
 });
 await page.locator('#calcBtn').click();
 const peak=await page.locator('#peakValue').innerText();assert(/\d/.test(peak),peak);
 await page.evaluate(()=>document.getElementById('wind').value='abc');
 await page.locator('#calcBtn').click();assert.equal(await page.locator('#peakValue').innerText(),'— PS');
 assert((await page.locator('body').innerText()).includes('Windwert prüfen.'));
 await page.evaluate(()=>document.getElementById('wind').value='');
 await page.locator('#calcBtn').click();assert(/\d/.test(await page.locator('#peakValue').innerText()));
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false);
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await context.setOffline(true);await page.reload();assert.equal(await page.title(),'GPS Power Lab · v13.1 E03');
 assert.deepEqual(errors,[]);
 results.push({width,calculation:true,invalid_wind_blocked:true,blank_wind_allowed:true,no_horizontal_overflow:true,offline_reload:true,page_errors:errors});
 await context.close();
 }
 fs.writeFileSync(path.join(__dirname,'browser_results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
