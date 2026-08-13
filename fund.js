const API="/api/fund";
const catalogAPI="https://api.mfapi.in/mf";
const funds=[
{name:"ICICI Prudential Flexicap Fund",amc:"ICICI Prudential",cat:"Flexi Cap"},
{name:"Parag Parikh Flexi Cap Fund",amc:"PPFAS",cat:"Flexi Cap"},
{name:"HDFC Flexi Cap Fund",amc:"HDFC",cat:"Flexi Cap"},
{name:"ICICI Prudential Bluechip Fund",amc:"ICICI Prudential",cat:"Large Cap"},
{name:"HDFC Mid-Cap Opportunities Fund",amc:"HDFC",cat:"Mid Cap"},
{name:"Nippon India Small Cap Fund",amc:"Nippon India",cat:"Small Cap"},
{name:"ICICI Prudential Balanced Advantage Fund",amc:"ICICI Prudential",cat:"Hybrid"},
{name:"SBI Balanced Advantage Fund",amc:"SBI",cat:"Hybrid"}];

function norm(s){return String(s||"").toLowerCase().replace(/&/g,"and").replace(/\b(direct|regular|growth|idcw|dividend|plan|option|bonus|payout|reinvestment)\b/g," ").replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim()}
function score(a,b){const A=new Set(norm(a).split(" ").filter(x=>x.length>2)),B=new Set(norm(b).split(" ").filter(x=>x.length>2));let n=0;A.forEach(x=>{if(B.has(x))n++});return A.size?n/A.size:0}
async function resolveCode(target){
 const r=await fetch("/api/schemes?q="+encodeURIComponent(target)+"&limit=100");
 if(!r.ok)throw Error("Scheme catalogue unavailable");
 const j=await r.json(),list=j.schemes||[];
 let best=null,bs=0;
 for(const x of list){
   const n=x.schemeName||"",s=score(target,n);
   if(s<.45)continue;
   const t=s+(n.toLowerCase().includes("direct")?.08:0)+(n.toLowerCase().includes("growth")?.06:0);
   if(t>bs){bs=t;best=x}
 }
 if(!best)throw Error("Scheme code could not be resolved");
 return best.schemeCode;
}
async function loadFund(){
 const params=new URLSearchParams(location.search);
 const pathParts=location.pathname.split("/").filter(Boolean);
 const cleanSlug=(pathParts[0]==="fund" && pathParts[1]) ? pathParts[1] : "";
 const requestedFromSlug=cleanSlug ? cleanSlug.replace(/-/g," ") : "";
 const requested=params.get("name")||requestedFromSlug||"ICICI Prudential Flexicap Fund";
 const local=funds.find(x=>norm(x.name)===norm(requested)) ||
  funds.find(x=>x.name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")===cleanSlug) ||
  {name:requested,amc:"Mutual Fund",cat:"Scheme"};
 document.getElementById("fundName").textContent=local.name;
 document.getElementById("fundSub").textContent=`${local.amc} · ${local.cat} · Direct Plan · Growth`;
 try{
  const code=await resolveCode(local.name);
  document.getElementById("schemeCode").textContent=code;
  const r=await fetch(`${API}?code=${encodeURIComponent(code)}`);
  if(!r.ok)throw Error("Fund data service unavailable");
  const j=await r.json(),m=j.metrics,latest=j.latest;
  document.getElementById("fundName").textContent=j.meta?.scheme_name||local.name;
  document.getElementById("nav").textContent="₹"+Number(latest.nav).toFixed(4);
  document.getElementById("navDate").textContent="NAV date: "+latest.date;
  document.getElementById("oneY").textContent=(m.oneY*100).toFixed(2)+"%";
  document.getElementById("threeY").textContent=(m.threeY*100).toFixed(2)+"%";
  document.getElementById("fiveY").textContent=(m.fiveY*100).toFixed(2)+"%";
  document.getElementById("volatility").textContent=(m.volatility*100).toFixed(2)+"%";
  document.getElementById("sharpe").textContent=m.sharpe==null?"—":m.sharpe.toFixed(2);
  document.getElementById("drawdown").textContent=(m.maxDrawdown*100).toFixed(2)+"%";
  document.getElementById("vol2").textContent=(m.volatility*100).toFixed(2)+"%";
  document.getElementById("sharpe2").textContent=m.sharpe==null?"—":m.sharpe.toFixed(2);
  document.getElementById("dd2").textContent=(m.maxDrawdown*100).toFixed(2)+"%";
  document.getElementById("amc").textContent=local.amc;
  document.getElementById("category").textContent=local.cat;
  document.getElementById("benchmark").textContent=local.cat==="Hybrid"?"Category benchmark":"NIFTY 500 TRI";
  document.getElementById("dataStatus").textContent="Live NAV history connected";
  window.fundHistory=j.history||[];
  drawChart(365);
 }catch(e){document.getElementById("dataStatus").textContent=e.message;console.error(e)}
}
function drawChart(days){
 const all=window.fundHistory||[],cut=all.slice(-Math.min(all.length,days)),c=document.getElementById("chart"),ctx=c.getContext("2d"),d=devicePixelRatio||1,w=c.clientWidth,h=c.clientHeight;
 c.width=w*d;c.height=h*d;ctx.setTransform(d,0,0,d,0,0);if(cut.length<2)return;
 const vals=cut.map(x=>Number(x.nav)),min=Math.min(...vals),max=Math.max(...vals),p=20;
 ctx.beginPath();vals.forEach((v,i)=>{const x=i*(w/(vals.length-1)),y=h-p-((v-min)/(max-min||1))*(h-p*2);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.lineWidth=3;ctx.strokeStyle="#0b8a60";ctx.stroke();
}
document.querySelectorAll(".period").forEach(b=>b.onclick=()=>{document.querySelectorAll(".period").forEach(x=>x.classList.remove("active"));b.classList.add("active");drawChart(+b.dataset.days)});
async function initCompare(){document.getElementById("otherFund").innerHTML=funds.map(f=>`<option>${f.name}</option>`).join("")}
function compareSelected(){const target=document.getElementById("otherFund").value;document.getElementById("comparison").innerHTML=`<div class="card comparison"><b>${target}</b><p>Open this fund in a new detail page to compare its live NAV-derived metrics.</p><a href="fund.html?name=${encodeURIComponent(target)}">Open ${target} →</a></div>`}
document.getElementById("fundSearch").addEventListener("input",e=>{
 const q=norm(e.target.value),box=document.getElementById("fundResults");
 const m=funds.filter(f=>norm(f.name+" "+f.amc+" "+f.cat).includes(q)).slice(0,8);
 box.innerHTML=m.map(f=>`<div onclick="location.href='fund.html?name=${encodeURIComponent(f.name)}'">${f.name}<small> · ${f.cat}</small></div>`).join("");
});
initCompare();loadFund();addEventListener("resize",()=>drawChart(document.querySelector(".period.active")?.dataset.days||365));
