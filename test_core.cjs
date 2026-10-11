const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=__dirname, WPS=735.49875,g=9.80665;
function load(file){
 const html=fs.readFileSync(path.join(root,file),'utf8');
 const script=html.match(/<script>([\s\S]*?)<\/script>/g).find(x=>x.includes('function calculateModel'));
 new vm.Script(script.replace(/^<script>|<\/script>$/g,''));
 function fn(name){let s=html.indexOf('function '+name+'(');assert(s>=0);let end=html.indexOf('\nfunction ',s+1);return html.slice(s,end);}
 const ctx={defaultGear:()=>4};vm.createContext(ctx);
 vm.runInContext(html.slice(html.indexOf('var MODEL='),html.indexOf('function $(id)'))+['calculateModel','detectIntervalIssues','confirmedPeakInfo','pressureFromDA','parseDE','normOcrText','numToken','firstNumber','parseScreenshotMeta','readParams'].map(fn).join('\n'),ctx);
 return ctx;
}
const old=load('baseline.html'),fix=load('candidate.html');
let tests=[];function test(name,f){f();tests.push({name,status:'pass'});}function near(a,b,t=1e-9){assert(Math.abs(a-b)<t,`${a} != ${b}`);}
const params=(over={})=>({vehicleMass:1400,driver:100,load:0,totalMass:1500,cda:.7,temp:15,pressure:1013.25,slope:0,wind:0,model:{rot:0,drive:0},...over});
const e=(start=100,time=1,gear=4)=>({start,time,gear});
const power=(core,entries,p)=>core.calculateModel(entries,p);
test('source script syntax and recorded source hashes',()=>{const c=require('node:crypto'),p=JSON.parse(fs.readFileSync(path.join(root,'provenance.json')));for(const [f,h] of [['baseline.html',p.baseline_sha256],['candidate.html',p.candidate_sha256]])assert.equal(c.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex'),h);});
for(const mass of [800,1500,3000])for(const start of [40,100,190,390])test(`kinetic-energy identity m=${mass} v=${start}`,()=>{
 const p=params({vehicleMass:mass-100,totalMass:mass,cda:0}),dt=.9,v0=start/3.6,v1=(start+10)/3.6;
 near(power(fix,[e(start,dt)],p).peak,.5*mass*(v1*v1-v0*v0)/dt/WPS,1e-8);
});
for(const s of [-15,-1,0,1,15])test(`exact slope geometry ${s}%`,()=>{
 const p=params({slope:s}),a=power(fix,[e()],p).peak,b=power(fix,[e()],params()).peak;
 near(a-b,1500*g*Math.sin(Math.atan(s/100))*(105/3.6)/WPS);
});
test('old reverse-wind clamp gives plausible output; patch rejects',()=>{
 assert(Number.isFinite(power(old,[e(40)],params({wind:-100})).peak));
 assert.throws(()=>power(fix,[e(40)],params({wind:-100})),/Rückenwind/);
});
test('ordinary wind monotonic and unchanged flat-road regression',()=>{
 const p=params();const a=[-20,0,20].map(w=>power(fix,[e()],{...p,wind:w}).peak);assert(a[0]<a[1]&&a[1]<a[2]);
 for(const w of [-20,0,20])near(power(old,[e()],{...p,wind:w}).peak,power(fix,[e()],{...p,wind:w}).peak);
});
test('DA reconstruction returns identical density at different temperatures',()=>{
 const rho=t=>fix.pressureFromDA(500,t)*100/(287.05*(t+273.15));near(rho(-10),rho(35));
});
test('corrected total does not relabel raw screenshot intervals',()=>{
 const m=fix.parseScreenshotMeta('11 C DA 640 m -0.33% Corrected 11.337s','Correction enabled off','pgear');assert.equal(m.correctionOn,false);assert.equal(m.slope,-.33);
 const n=fix.parseScreenshotMeta('11 C -0.33%','Correction enabled on','pgear');assert.equal(n.slope,0);assert.equal(n.rawSlope,-.33);
});
test('v13 UI corrected-mode slope zeroing already exists',()=>{
 const h=fs.readFileSync(path.join(root,'baseline.html'),'utf8');assert(h.includes('slope:state.measurementMode==="corrected"?0:parseDE($("slope").value)'));
});
const fake=rows=>({rows,peak:Math.max(...rows.map(x=>x.ps)),peakIndex:rows.findIndex(x=>x.ps===Math.max(...rows.map(x=>x.ps)))});
test('single interval previously self-confirmed: fixed',()=>{
 const r=fake([{...e(),ps:300}]);assert(old.confirmedPeakInfo(r).confirmed);assert(!fix.confirmedPeakInfo(r).confirmed);
});
test('disjoint intervals previously confirmed each other: fixed',()=>{
 const r=fake([{...e(100),ps:300},{...e(190),ps:305}]);assert(old.confirmedPeakInfo(r).confirmed);assert(!fix.confirmedPeakInfo(r).confirmed);
});
test('different gears no longer corroborate peak',()=>{
 const r=fake([{...e(100,1,4),ps:300},{...e(110,1,5),ps:305}]);assert(old.confirmedPeakInfo(r).confirmed);assert(!fix.confirmedPeakInfo(r).confirmed);
});
test('contiguous clean same-gear support preserved',()=>assert(fix.confirmedPeakInfo(fake([{...e(100),ps:300},{...e(110),ps:305}])).confirmed));
test('zero, negative, NaN timing rejected',()=>{for(const t of [0,-1,NaN])assert.throws(()=>power(fix,[e(100,t)],params({cda:0})));});
test('nonfinite time and invalid speed are rejected by core',()=>{for(const x of [e(100,Infinity),e(100,-Infinity),e(NaN,1),e(-10,1)])assert.throws(()=>power(fix,[x],params()));});
test('strict number parser rejects suffix and Infinity',()=>{for(const s of ['12foo','Infinity','1,2,3'])assert(Number.isNaN(fix.parseDE(s)));});
test('actual input handler rejects malformed wind but permits blank',()=>{
 const fields={name:{value:'Test'},wind:{value:'abc'},pressure:{value:'1013.25'},temp:{value:'15'},da:{value:'0'},slope:{value:'0'},soc:{value:''}};
 fix.$=id=>fields[id];fix.state={uiMode:'pro',pressureMode:'manual',measurementMode:'raw'};
 fix.readMasses=()=>({vehicle:1400,total:1500,driver:100,load:0});fix.readCda=()=>.7;fix.getModel=()=>fix.MODEL['2wd-manual'];
 assert.throws(()=>fix.readParams(),/Windwert/);fields.wind.value='';assert.equal(fix.readParams().wind,0);
 fields.wind.value='-20';assert.equal(fix.readParams().wind,-20);
});
const models=[...Object.entries(old.MODEL),['awd-dct',{refined:true}]],sens={};
for(const [name,model]of models)test(`model regression and mass sensitivity ${name}`,()=>{
 const p=params({model});near(power(old,[e(190)],p).peak,power(fix,[e(190)],p).peak);
 const base=power(fix,[e(190)],p).peak;
 sens[name]={baseline_ps:base,plus_100kg_vehicle_ps:power(fix,[e(190)],{...p,vehicleMass:1500,totalMass:1600}).peak-base,gear4_to_6_ps:power(fix,[e(190,1,6)],p).peak-base};
});
test('shift delay lowers interval average, not engine power proof',()=>{
 const p=params({cda:0});near(power(fix,[e(100,1.3)],p).peak/power(fix,[e(100,1)],p).peak,1/1.3);
});
test('unequal interval means require time weighting',()=>{
 const p=params({cda:0}),rows=power(fix,[e(100,.6),e(110,1.4)],p).rows;
 const weighted=rows.reduce((s,r)=>s+r.ps*r.time,0)/2;
 near(weighted,.5*1500*((120/3.6)**2-(100/3.6)**2)/2/WPS);assert(Math.abs(weighted-(rows[0].ps+rows[1].ps)/2)>10);
});
// Independent numerical oracle: constant acceleration, integrate aerodynamic work over time.
function numericalAero(v0,v1,w,rho,cda){let sum=0,N=10000;for(let i=0;i<=N;i++){let v=v0+(v1-v0)*i/N;sum+=(i===0||i===N?1:i%2?4:2)*.5*rho*cda*(v+w)**2*v;}return sum/(3*N)/WPS;}
const aero=[];
for(const start of [40,100,190,390])test(`midpoint approximation quantified at ${start}`,()=>{
 const p=params(),r=power(old,[e(start)],p),v=(start+5)/3.6,h=5/3.6;
 const numerical=numericalAero(start/3.6,(start+10)/3.6,0,r.rho,p.cda);
 const midpoint=.5*r.rho*p.cda*v**3/WPS;
 const correction=.5*r.rho*p.cda*v*h*h/WPS;near(numerical-midpoint,correction,1e-9);
 aero.push({start,midpoint_aero_ps:midpoint,linear_speed_average_aero_ps:numerical,delta_ps:correction});
});
const fixtures=JSON.parse(fs.readFileSync(path.join(root,'research_fixtures.json'))),real=[];
for(const f of fixtures){for(const run of f.runs){if(!run.series)continue;test('research plausibility '+run.id,()=>{
 const entries=run.series.interval_s.map((t,i)=>e(100+i*10,t));
 // Controlled scenario, not measured vehicle parameters: no imputation disguised as evidence.
 const p=params({model:old.MODEL['2wd-manual'],slope:run.slope_percent??0});
 const a=power(old,entries,p),b=power(fix,entries,p);
 assert(b.rows.every(x=>Number.isFinite(x.ps)));
 real.push({vehicle:f.name,run:run.id,actual_vehicle_accuracy_validation:false,scenario:'1500kg total,1400kg vehicle,100kg driver,CdA=.7,1013.25hPa,15C,zero wind,2WD manual; recorded slope only',timing_status:run.series.interval_correction_status,old_peak_ps:a.peak,new_peak_ps:b.peak,delta_ps:b.peak-a.peak,intervals:b.rows.map((r,i)=>({start:r.start,old_ps:a.rows[i].ps,new_ps:r.ps}))});
 });}}
fs.writeFileSync(path.join(root,'test_results.json'),JSON.stringify({passed:tests.length,failed:0,tests,sensitivity:sens,aerodynamic_quadrature:aero,research_scenarios:real},null,2));
console.log(`${tests.length} tests passed; real series are controlled scenarios, NOT dyno validation.`);
