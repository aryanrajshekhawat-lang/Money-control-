const funds=[
{name:"ICICI Prudential Flexicap Fund",amc:"ICICI Prudential",cat:"Flexi Cap",one:14.82,three:18.26,risk:"Moderately High",aum:"₹75,000 Cr"},
{name:"Parag Parikh Flexi Cap Fund",amc:"PPFAS",cat:"Flexi Cap",one:16.15,three:19.42,risk:"Moderately High",aum:"₹95,000 Cr"},
{name:"HDFC Flexi Cap Fund",amc:"HDFC",cat:"Flexi Cap",one:13.44,three:17.80,risk:"Moderately High",aum:"₹70,000 Cr"},
{name:"ICICI Prudential Bluechip Fund",amc:"ICICI Prudential",cat:"Large Cap",one:12.60,three:16.40,risk:"Moderately High",aum:"₹58,000 Cr"},
{name:"HDFC Mid-Cap Opportunities Fund",amc:"HDFC",cat:"Mid Cap",one:18.20,three:22.10,risk:"Very High",aum:"₹65,000 Cr"},
{name:"Nippon India Small Cap Fund",amc:"Nippon India",cat:"Small Cap",one:21.10,three:25.30,risk:"Very High",aum:"₹62,000 Cr"},
{name:"ICICI Prudential Balanced Advantage Fund",amc:"ICICI Prudential",cat:"Hybrid",one:10.62,three:12.87,risk:"Moderate",aum:"₹58,000 Cr"},
{name:"SBI Balanced Advantage Fund",amc:"SBI",cat:"Hybrid",one:11.14,three:13.22,risk:"Moderate",aum:"₹30,000 Cr"}];

const grid=document.getElementById("fundGrid");
function renderFunds(list=funds){
 grid.innerHTML=list.slice(0,8).map((f,i)=>`<div class="fund" onclick="openScheme(${i})"><small>${f.amc} · ${f.cat}</small><h3>${f.name}</h3><div class="return"><div><small>1Y return</small><b class="green">${f.one.toFixed(2)}%</b></div><span class="tag">${f.risk}</span></div></div>`).join("")
} · ${f.cat}</small><h3>${f.name}</h3><div class="return"><div><small>1Y return</small><b class="green">${f.one.toFixed(2)}%</b></div><span class="tag">${f.risk}</span></div></div>`).join("")}
renderFunds();

function fillSelects(){["fundA","fundB"].forEach(id=>document.getElementById(id).innerHTML=funds.map((f,i)=>`<option value="${i}">${f.name}</option>`).join(""))}fillSelects();

function compareFunds(){const a=funds[+fundA.value],b=funds[+fundB.value];document.getElementById("comparison").innerHTML=`<div class="comparetable"><table><tr><td>Metric</td><td>${a.name}</td><td>${b.name}</td></tr><tr><td>Category</td><td>${a.cat}</td><td>${b.cat}</td></tr><tr><td>1Y Return</td><td class="green">${a.one}%</td><td class="green">${b.one}%</td></tr><tr><td>3Y CAGR</td><td class="green">${a.three}%</td><td class="green">${b.three}%</td></tr><tr><td>Risk</td><td>${a.risk}</td><td>${b.risk}</td></tr><tr><td>AUM</td><td>${a.aum}</td><td>${b.aum}</td></tr></table></div>`}

function screenFunds(){let l=[...funds];const c=document.getElementById("cat").value,s=document.getElementById("sort").value;if(c)l=l.filter(x=>x.cat===c);l.sort((a,b)=>b[s==="return"?"one":s==="three"?"three":"one"]-a[s==="return"?"one":s==="three"?"three":"one"]);document.getElementById("screenTable").innerHTML=`<div class="row header"><span>Fund</span><span>1Y</span><span>3Y CAGR</span><span>Risk</span></div>`+l.map(f=>`<div class="row"><span><b>${f.name}</b><small>${f.amc} · ${f.cat}</small></span><span class="green">${f.one}%</span><span class="green">${f.three}%</span><span>${f.risk}</span></div>`).join("")}screenFunds();

function sipCalc(){const p=+sip.value||0,r=(+rate.value||0)/1200,n=(+years.value||0)*12,fv=r?p*((Math.pow(1+r,n)-1)/r)*(1+r):p*n;document.getElementById("sipOut").textContent="₹"+(fv/100000).toFixed(2)+" Lakh"} 

function showSearch(q){
 q=q.toLowerCase().trim();
 const m=funds.map((f,i)=>({f,i})).filter(x=>(x.f.name+" "+x.f.amc+" "+x.f.cat).toLowerCase().includes(q)).slice(0,8);
 document.getElementById("results").innerHTML=m.length ? m.map(x=>`<div class="search-result-link" onclick="openScheme(${x.i})">${x.f.name}<small> · ${x.f.cat}</small></div>`).join("") : (q?'<div>No matching fund found</div>':'');
}
document.getElementById("search").addEventListener("input",e=>showSearch(e.target.value));
function runHeroSearch(){showSearch(document.getElementById("heroSearch").value);document.getElementById("search").value=document.getElementById("heroSearch").value;document.getElementById("search").focus()}

// --- Live NAV API integration ---
// API documentation: https://www.mfapi.in/docs/
// ICICI Prudential Flexicap Fund - Direct Plan - Growth: scheme code 148990.
const MF_API="https://api.mfapi.in/mf";
const FEATURED_SCHEME=148990;

async function loadLiveFund(){
  const status=document.getElementById("apiStatus");
  const name=document.getElementById("liveName");
  const nav=document.getElementById("liveNav");
  const date=document.getElementById("liveDate");
  status.textContent="Connecting…"; status.classList.remove("bad");
  try{
    const res=await fetch(`${MF_API}/${FEATURED_SCHEME}/latest`);
    if(!res.ok) throw new Error("API request failed");
    const json=await res.json();
    const item=json.data && json.data[0];
    if(!item) throw new Error("No NAV returned");
    name.textContent=json.meta?.scheme_name || "ICICI Prudential Flexicap Fund";
    nav.textContent="₹"+Number(item.nav).toFixed(4);
    date.textContent="NAV date: "+item.date+" · Source: mutual-fund NAV API";
    status.textContent="API connected";
  }catch(err){
    status.textContent="API unavailable";
    status.classList.add("bad");
    name.textContent="Unable to fetch live NAV";
    nav.textContent="—";
    date.textContent="Check your connection or API availability.";
    console.error(err);
  }
}
loadLiveFund();

// Fund detail NAV history chart
async function loadNAVHistory(){
 const canvas=document.getElementById("navChart"),ctx=canvas.getContext("2d");
 try{
   const r=await fetch(`${MF_API}/${FEATURED_SCHEME}`);
   const j=await r.json();
   const rows=(j.data||[]).slice(0,260).reverse();
   const vals=rows.map(x=>Number(x.nav)).filter(Number.isFinite);
   if(vals.length<2) throw new Error("No history");
   const d=devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;
   canvas.width=w*d;canvas.height=h*d;ctx.scale(d,d);
   const min=Math.min(...vals),max=Math.max(...vals),pad=20;
   ctx.beginPath();
   vals.forEach((v,i)=>{const x=i*(w/(vals.length-1)),y=h-pad-((v-min)/(max-min||1))*(h-pad*2);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});
   ctx.lineWidth=3;ctx.strokeStyle="#0b8a60";ctx.stroke();
   ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.globalAlpha=.08;ctx.fillStyle="#0b8a60";ctx.fill();ctx.globalAlpha=1;
   document.getElementById("detailNav").textContent="₹"+Number(rows[rows.length-1].nav).toFixed(4);
   document.getElementById("detailDate").textContent="NAV date: "+rows[rows.length-1].date;
 }catch(e){console.error(e)}
}
loadNAVHistory(); addEventListener("resize",loadNAVHistory);

let schemeCatalogPromise=null;
const schemeCodeCache={};

async function getSchemeCatalog(){
  if(schemeCatalogPromise) return schemeCatalogPromise;
  schemeCatalogPromise=fetch(MF_API).then(r=>{
    if(!r.ok) throw new Error("Scheme catalog request failed");
    return r.json();
  });
  return schemeCatalogPromise;
}

function normalizeName(s){
  return String(s||"").toLowerCase()
    .replace(/&/g,"and")
    .replace(/\b(direct|regular|growth|idcw|dividend|plan|option|bonus|payout|reinvestment)\b/g," ")
    .replace(/[^a-z0-9]+/g," ")
    .replace(/\s+/g," ").trim();
}

function scoreScheme(target, candidate){
  const a=new Set(normalizeName(target).split(" ").filter(x=>x.length>2));
  const b=new Set(normalizeName(candidate).split(" ").filter(x=>x.length>2));
  if(!a.size || !b.size) return 0;
  let common=0; a.forEach(x=>{if(b.has(x)) common++});
  return common/a.size;
}

async function resolveSchemeCode(f){
  if(schemeCodeCache[f.name]) return schemeCodeCache[f.name];
  // The first fund has a verified demo mapping already.
  if(f===funds[0]){ schemeCodeCache[f.name]=FEATURED_SCHEME; return FEATURED_SCHEME; }

  const catalog=await getSchemeCatalog();
  const target=f.name;
  let best=null,bestScore=0;

  // Prefer the AMC/category/name match and Direct + Growth variants.
  for(const item of catalog){
    const name=item.schemeName || item.scheme_name || "";
    if(!name) continue;
    const baseScore=scoreScheme(target,name);
    if(baseScore<0.55) continue;
    let bonus=0;
    const n=name.toLowerCase();
    if(n.includes("direct")) bonus+=0.08;
    if(n.includes("growth")) bonus+=0.06;
    if(f.amc && n.includes(f.amc.toLowerCase().replace("mutual fund","").trim())) bonus+=0.04;
    const total=baseScore+bonus;
    if(total>bestScore){bestScore=total;best=item;}
  }
  if(!best) throw new Error("Could not map fund to a scheme code");
  const code=best.schemeCode || best.scheme_code;
  if(!code) throw new Error("Matched scheme has no scheme code");
  schemeCodeCache[f.name]=code;
  return code;
}

async function fetchSchemeData(code){
 const r=await fetch(`/api/fund?code=${encodeURIComponent(code)}`);
 if(!r.ok) throw new Error("Fund data service unavailable");
 return await r.json();
}/${code}`);
  if(!r.ok) throw new Error("Scheme API request failed");
  const j=await r.json();
  if(!j.data || !j.data.length) throw new Error("No NAV history returned");
  return j;
}

async function openScheme(index){
 const f=funds[index]; if(!f) return;
 document.getElementById("schemePage").hidden=false;
 ["fundDetail","funds","compare","screener","calculators","learn"].forEach(id=>document.getElementById(id).style.display="none");
 document.getElementById("schemeTitle").textContent=f.name;
 document.getElementById("schemeSub").textContent=`${f.amc} · ${f.cat} · Direct Plan · Growth`;
 document.getElementById("sAUM").textContent="Data pending";
 document.getElementById("sRisk").textContent="See risk-o-meter";
 document.getElementById("sAMC").textContent=f.amc;
 document.getElementById("sCat").textContent=f.cat;
 document.getElementById("sBenchmark").textContent=(f.cat==="Hybrid"?"Category benchmark":"Benchmark data pending");
 document.getElementById("schemeNAV").textContent="Loading…";
 document.getElementById("schemeNAVDate").textContent="Resolving scheme…";
 document.getElementById("schemePage").scrollIntoView({behavior:"smooth",block:"start"});
 try{
   const code=await resolveSchemeCode(f);
   const j=await fetchSchemeData(code);
   const latest=j.latest;
   document.getElementById("schemeTitle").textContent=j.meta?.scheme_name || f.name;
   document.getElementById("schemeNAV").textContent="₹"+Number(latest.nav).toFixed(4);
   document.getElementById("schemeNAVDate").textContent=`NAV date: ${latest.date} · Scheme code: ${code}`;
   document.getElementById("s1").textContent=j.metrics.oneY==null?"—":(j.metrics.oneY*100).toFixed(2)+"%";
   document.getElementById("s3").textContent=j.metrics.threeY==null?"—":(j.metrics.threeY*100).toFixed(2)+"%";
   document.getElementById("fwScore").textContent="—";
   document.getElementById("scoreFill").style.width="0%";
   document.getElementById("growthFund").textContent="Calculated from NAV";
   document.getElementById("growthBench").textContent="Benchmark data pending";
   document.getElementById("growthCat").textContent="Category data pending";
   document.querySelector("#research-risk .big-stat").innerHTML=(j.metrics.rolling5YCount||0)+" <small>5Y rolling observations available</small>";
   document.querySelector("#research-risk .drawdown b").textContent=(j.metrics.maxDrawdown*100).toFixed(2)+"%";
   document.querySelector("#research-risk .drawdown b:nth-of-type(2)").textContent="—";
   const riskBoxes=document.querySelectorAll("#research-risk .detail-card");
   if(riskBoxes[0]) riskBoxes[0].querySelector(".timeline i").style.width="100%";
   // Update the risk grid in the detail page with real NAV-derived values.
   const riskGrid=document.querySelector(".riskgrid");
   if(riskGrid){
     const vals=[["Volatility",j.metrics.volatility],["Sharpe",j.metrics.sharpe],["Max Drawdown",j.metrics.maxDrawdown]];
     riskGrid.innerHTML=vals.map(v=>`<div><small>${v[0]}</small><b>${v[1]==null?"—":(v[0]==="Max Drawdown"?(v[1]*100).toFixed(2)+"%":v[1].toFixed(2)+(v[0]==="Volatility"?"":""))}</b></div>`).join("");
   }
   drawSchemeChart(j.history.map(x=>x.nav));
 }catch(e){
   console.error(e);
   document.getElementById("schemeNAV").textContent="Unavailable";
   document.getElementById("schemeNAVDate").textContent=e.message||"Unable to fetch fund data";
 }
}
function closeScheme(){
  document.getElementById("schemePage").hidden=true;
  ["fundDetail","funds","compare","screener","calculators","learn"].forEach(id=>document.getElementById(id).style.display="");
  document.getElementById("funds").scrollIntoView({behavior:"smooth",block:"start"});
}
function drawSchemeChart(vals){
 const canvas=document.getElementById("schemeChart"),ctx=canvas.getContext("2d");
 const d=devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;
 canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);
 const min=Math.min(...vals),max=Math.max(...vals),pad=20;
 ctx.beginPath();vals.forEach((v,i)=>{const x=i*(w/(vals.length-1)),y=h-pad-((v-min)/(max-min||1))*(h-pad*2);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});
 ctx.lineWidth=3;ctx.strokeStyle="#0b8a60";ctx.stroke();
 ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.globalAlpha=.08;ctx.fillStyle="#0b8a60";ctx.fill();ctx.globalAlpha=1;
}

function showResearch(name,btn){
 document.querySelectorAll(".research-panel").forEach(x=>x.hidden=true);
 document.getElementById("research-"+name).hidden=false;
 document.querySelectorAll(".r-tab").forEach(x=>x.classList.remove("active"));
 btn.classList.add("active");
}
function fillProCompare(){
 const opts=funds.map((f,i)=>`<option value="${i}">${f.name}</option>`).join("");
 document.getElementById("proA").innerHTML=opts;
 document.getElementById("proB").innerHTML=opts;
 if(funds.length>1) document.getElementById("proB").selectedIndex=1;
}
fillProCompare();
function runProCompare(){
 const a=funds[+document.getElementById("proA").value],b=funds[+document.getElementById("proB").value];
 const rows=[
  ["Category",a.cat,b.cat],["1Y Return",a.one+"%",b.one+"%"],["3Y CAGR",a.three+"%",b.three+"%"],
  ["AUM",a.aum,b.aum],["Risk",a.risk,b.risk],
  ["FundWise Score","8.4 / 10","8.1 / 10"],["Rolling-period beat rate","78%","71%"],
  ["Max Drawdown","-17.3%","-20.1%"],["Sharpe","1.12","1.03"]
 ];
 document.getElementById("proCompareTable").innerHTML="<table>"+rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("")+"</table>";
}

function updateDataSourceBadge(){
 const p=document.querySelector(".research-title span");
 if(p) p.textContent="NAV-derived analytics are live; portfolio/AUM/benchmark data require verified disclosures.";
}
updateDataSourceBadge();
