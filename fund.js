const API="/api/fund";
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
function parseDate(s){return new Date(s)}
function dataForDays(days){
 const all=window.fundHistory||[];
 if(!all.length)return [];
 if(days===0)return all;
 const latest=parseDate(all[all.length-1].date);
 const target=new Date(latest);target.setDate(target.getDate()-days);
 let idx=0;
 for(let i=0;i<all.length;i++){if(parseDate(all[i].date)<=target)idx=i;else break}
 return all.slice(Math.max(0,idx));
}
function periodReturn(data){
 if(!data||data.length<2)return null;
 const first=Number(data[0].nav),last=Number(data[data.length-1].nav);
 return first>0&&last>0?(last/first-1)*100:null;
}
function cagrForYears(years){
 const all=window.fundHistory||[]; if(all.length<2)return null;
 const end=all[all.length-1],target=new Date(end.date);target.setFullYear(target.getFullYear()-years);
 let start=all[0];
 for(const r of all){if(parseDate(r.date)<=target)start=r;else break}
 const yrs=(parseDate(end.date)-parseDate(start.date))/(86400000*365.25);
 return yrs>=Math.max(years*.85,1)?(Math.pow(end.nav/start.nav,1/yrs)-1)*100:null;
}
function setText(id,value){const el=document.getElementById(id);if(el)el.textContent=value}
function fmtPct(v){return v==null?"—":(v>=0?"+":"")+v.toFixed(2)+"%"}
function fillPeriodReturns(){
 const values={
  "1M":periodReturn(dataForDays(31)),
  "3M":periodReturn(dataForDays(92)),
  "6M":periodReturn(dataForDays(183)),
  "1Y":cagrForYears(1),
  "3Y":cagrForYears(3),
  "5Y":cagrForYears(5),
  "10Y":cagrForYears(10),
  "MAX":periodReturn(dataForDays(0))
 };
 Object.entries(values).forEach(([k,v])=>setText("ret"+k,fmtPct(v)));
}
function getPeriodData(period){
 const all=window.fundHistory||[];
 if(!all.length)return [];
 if(period==="MAX"||period==="0")return all;
 return dataForDays(Number(period));
}
function drawChart(period="365"){
 const cut=getPeriodData(period),c=document.getElementById("chart");if(!c)return;
 const ctx=c.getContext("2d"),d=window.devicePixelRatio||1,w=c.clientWidth,h=c.clientHeight;
 c.width=Math.max(1,w*d);c.height=Math.max(1,h*d);ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);
 const label=period==="0"||period==="MAX"?"MAX":({"31":"1M","92":"3M","183":"6M","365":"1Y","1095":"3Y","1825":"5Y","3650":"10Y"}[String(period)]||"1Y");
 setText("selectedPeriod",label);
 if(cut.length<2){setText("periodReturn","Return: —");return}
 const vals=cut.map(x=>Number(x.nav)),min=Math.min(...vals),max=Math.max(...vals),p=22;
 ctx.strokeStyle="#e5ece9";ctx.lineWidth=1;
 for(let i=1;i<4;i++){const y=p+i*(h-p*2)/4;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
 ctx.beginPath();vals.forEach((v,i)=>{const x=i*(w/(vals.length-1)),y=h-p-((v-min)/(max-min||1))*(h-p*2);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});
 ctx.lineWidth=3;ctx.strokeStyle="#0b8a60";ctx.stroke();
 const ret=periodReturn(cut);setText("periodReturn","Return: "+fmtPct(ret));
}
async function loadFund(){
 const params=new URLSearchParams(location.search);
 const pathParts=location.pathname.split("/").filter(Boolean);
 const cleanSlug=(pathParts[0]==="fund"&&pathParts[1])?pathParts[1]:"";
 const requested=params.get("name")||cleanSlug.replace(/-/g," ")||"ICICI Prudential Flexicap Fund";
 const local=funds.find(x=>norm(x.name)===norm(requested))||funds.find(x=>x.name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")===cleanSlug)||{name:requested,amc:"Mutual Fund",cat:"Scheme"};
 setText("fundName",local.name);setText("fundSub",`${local.amc} · ${local.cat} · Direct Plan · Growth`);
 try{
  const code=await resolveCode(local.name);setText("schemeCode",code);setText("detailCode",code);
  const r=await fetch(`${API}?code=${encodeURIComponent(code)}`);if(!r.ok)throw Error("Fund data service unavailable");
  const j=await r.json(),m=j.metrics,latest=j.latest;
  const actualName=j.meta?.scheme_name||local.name;setText("fundName",actualName);
  setText("nav","₹"+Number(latest.nav).toFixed(4));setText("nav2","₹"+Number(latest.nav).toFixed(4));
  setText("navDate","NAV date: "+latest.date);setText("navDate2",latest.date);
  setText("oneY",fmtPct(m.oneY*100));setText("threeY",fmtPct(m.threeY*100));setText("fiveY",fmtPct(m.fiveY*100));
  setText("volatility",(m.volatility*100).toFixed(2)+"%");setText("sharpe",m.sharpe==null?"—":m.sharpe.toFixed(2));setText("drawdown",(m.maxDrawdown*100).toFixed(2)+"%");
  setText("vol2",(m.volatility*100).toFixed(2)+"%");setText("sharpe2",m.sharpe==null?"—":m.sharpe.toFixed(2));setText("dd2",(m.maxDrawdown*100).toFixed(2)+"%");
  setText("amc",local.amc);setText("category",local.cat);setText("detailAmc",local.amc);setText("detailCategory",local.cat);
  setText("benchmark",local.cat==="Hybrid"?"Category benchmark":"Data pending");
  const hist=j.history||[];window.fundHistory=hist;
  if(hist.length){setText("inception",hist[0].date);setText("detailInception",hist[0].date);setText("historySince",hist[0].date)}
  setText("dataStatus","NAV history connected");
  fillPeriodReturns();drawChart("365");
 }catch(e){setText("dataStatus",e.message);console.error(e)}
}
document.querySelectorAll(".period").forEach(b=>b.onclick=()=>{document.querySelectorAll(".period").forEach(x=>x.classList.remove("active"));b.classList.add("active");drawChart(b.dataset.days)});
async function initCompare(){setText("otherFund", "");const el=document.getElementById("otherFund");if(el)el.innerHTML=funds.map(f=>`<option>${f.name}</option>`).join("")}
function compareSelected(){const target=document.getElementById("otherFund").value;document.getElementById("comparison").innerHTML=`<div class="card comparison"><b>${target}</b><p>Open this fund in a new detail page to compare its NAV-derived metrics.</p><a href="fund.html?name=${encodeURIComponent(target)}">Open ${target} →</a></div>`}
document.getElementById("fundSearch")?.addEventListener("input",e=>{const q=norm(e.target.value),box=document.getElementById("fundResults");if(!q){box.innerHTML="";return}const m=funds.filter(f=>norm(f.name+" "+f.amc+" "+f.cat).includes(q)).slice(0,8);box.innerHTML=m.map(f=>`<div onclick="location.href='fund.html?name=${encodeURIComponent(f.name)}'">${f.name}<small> · ${f.cat}</small></div>`).join("")});
initCompare();loadFund();addEventListener("resize",()=>drawChart(document.querySelector(".period.active")?.dataset.days||"365"));
