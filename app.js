let schemeSearchTimer=null;
async function searchAllSchemes(q){
 const box=document.getElementById("results"); if(!box)return;
 q=(q||"").trim();
 if(!q){box.innerHTML="";return;}
 box.innerHTML='<div class="search-loading">Searching all mutual fund schemes…</div>';
 try{
   const r=await fetch("/api/schemes?q="+encodeURIComponent(q)+"&limit=40");
   if(!r.ok)throw Error();
   const j=await r.json();
   const schemes=j.schemes||[];
   box.innerHTML=schemes.length
    ? schemes.map(s=>`<a class="search-result-link" href="/fund/${slugify(s.schemeName)}/"><b>${escapeHtml(s.schemeName)}</b><small> Scheme code: ${s.schemeCode}</small></a>`).join("")
    : "<div>No matching scheme found</div>";
 }catch(e){
   box.innerHTML="<div>Unable to search schemes right now. Try again.</div>";
 }
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));}
const funds=[{name:"ICICI Prudential Flexicap Fund",amc:"ICICI Prudential",cat:"Flexi Cap",one:14.82,three:18.26,risk:"Moderately High"},{name:"Parag Parikh Flexi Cap Fund",amc:"PPFAS",cat:"Flexi Cap",one:16.15,three:19.42,risk:"Moderately High"},{name:"HDFC Flexi Cap Fund",amc:"HDFC",cat:"Flexi Cap",one:13.44,three:17.8,risk:"Moderately High"},{name:"ICICI Prudential Bluechip Fund",amc:"ICICI Prudential",cat:"Large Cap",one:12.6,three:16.4,risk:"Moderately High"},{name:"HDFC Mid-Cap Opportunities Fund",amc:"HDFC",cat:"Mid Cap",one:18.2,three:22.1,risk:"Very High"},{name:"Nippon India Small Cap Fund",amc:"Nippon India",cat:"Small Cap",one:21.1,three:25.3,risk:"Very High"},{name:"ICICI Prudential Balanced Advantage Fund",amc:"ICICI Prudential",cat:"Hybrid",one:10.62,three:12.87,risk:"Moderate"},{name:"SBI Balanced Advantage Fund",amc:"SBI",cat:"Hybrid",one:11.14,three:13.22,risk:"Moderate"}];
function slugify(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function fundUrl(name){return "/fund/"+slugify(name)+"/"}
function renderFunds(list=funds){
 const grid=document.getElementById("fundGrid"); if(!grid)return;
 grid.innerHTML=list.map(f=>`<a class="fund fund-link" href="${fundUrl(f.name)}"><small>${f.amc} · ${f.cat}</small><h3>${f.name}</h3><div class="return"><div><small>1Y return</small><b class="green">${f.one.toFixed(2)}%</b></div><span class="tag">${f.risk}</span></div></a>`).join("");
}
renderFunds();
function showSearch(q){
 const box=document.getElementById("results"); if(!box)return;
 q=(q||"").toLowerCase().trim(); if(!q){box.innerHTML="";return;}
 const m=funds.filter(f=>(f.name+" "+f.amc+" "+f.cat).toLowerCase().includes(q)).slice(0,8);
 box.innerHTML=m.length?m.map(f=>`<a class="search-result-link" href="${fundUrl(f.name)}">${f.name}<small> · ${f.cat}</small></a>`).join(""):"<div>No matching fund found</div>";
}
document.getElementById("search")?.addEventListener("input",e=>{
 clearTimeout(schemeSearchTimer);
 schemeSearchTimer=setTimeout(()=>searchAllSchemes(e.target.value),250);
});
function runHeroSearch(){const q=document.getElementById("heroSearch")?.value||"";const s=document.getElementById("search");if(s){s.value=q;searchAllSchemes(q);s.focus()}}
function fillSelects(){["fundA","fundB"].forEach(id=>{const e=document.getElementById(id);if(e)e.innerHTML=funds.map((f,i)=>`<option value="${i}">${f.name}</option>`).join("")})}fillSelects();
function compareFunds(){const a=funds[+(document.getElementById("fundA")?.value||0)],b=funds[+(document.getElementById("fundB")?.value||1)],o=document.getElementById("comparison");if(o)o.innerHTML=`<div class="comparetable"><table><tr><td>Metric</td><td>${a.name}</td><td>${b.name}</td></tr><tr><td>1Y Return</td><td>${a.one}%</td><td>${b.one}%</td></tr><tr><td>3Y CAGR</td><td>${a.three}%</td><td>${b.three}%</td></tr><tr><td>Risk</td><td>${a.risk}</td><td>${b.risk}</td></tr></table></div>`}
function screenFunds(){const cat=document.getElementById("cat")?.value||"",sort=document.getElementById("sort")?.value||"return";let l=funds.filter(f=>!cat||f.cat===cat);l.sort((a,b)=>sort==="three"?b.three-a.three:b.one-a.one);const o=document.getElementById("screenTable");if(o)o.innerHTML=l.map(f=>`<a class="row screen-link" href="${fundUrl(f.name)}"><span><b>${f.name}</b><small>${f.amc} · ${f.cat}</small></span><span class="green">${f.one}%</span><span class="green">${f.three}%</span><span>${f.risk}</span></a>`).join("")}screenFunds();
document.getElementById("cat")?.addEventListener("change",screenFunds);document.getElementById("sort")?.addEventListener("change",screenFunds);
function sipCalc(){const p=+(document.getElementById("sip")?.value||0),r=(+(document.getElementById("rate")?.value||0))/1200,n=(+(document.getElementById("years")?.value||0))*12,f=r?p*((Math.pow(1+r,n)-1)/r)*(1+r):p*n,o=document.getElementById("sipOut");if(o)o.textContent="₹"+(f/100000).toFixed(2)+" Lakh";}
