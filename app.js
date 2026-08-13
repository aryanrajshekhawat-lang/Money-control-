const funds=[
{name:"ICICI Prudential Flexicap Fund",amc:"ICICI Prudential",cat:"Flexi Cap",one:14.82,three:18.26,risk:"Moderately High",aum:"₹75,000 Cr"},
{name:"Parag Parikh Flexi Cap Fund",amc:"PPFAS",cat:"Flexi Cap",one:16.15,three:19.42,risk:"Moderately High",aum:"₹95,000 Cr"},
{name:"HDFC Flexi Cap Fund",amc:"HDFC",cat:"Flexi Cap",one:13.44,three:17.80,risk:"Moderately High",aum:"₹70,000 Cr"},
{name:"ICICI Prudential Bluechip Fund",amc:"ICICI Prudential",cat:"Large Cap",one:12.60,three:16.40,risk:"Moderately High",aum:"₹58,000 Cr"},
{name:"HDFC Mid-Cap Opportunities Fund",amc:"HDFC",cat:"Mid Cap",one:18.20,three:22.10,risk:"Very High",aum:"₹65,000 Cr"},
{name:"Nippon India Small Cap Fund",amc:"Nippon India",cat:"Small Cap",one:21.10,three:25.30,risk:"Very High",aum:"₹62,000 Cr"},
{name:"ICICI Prudential Balanced Advantage Fund",amc:"ICICI Prudential",cat:"Hybrid",one:10.62,three:12.87,risk:"Moderate",aum:"₹58,000 Cr"},
{name:"SBI Balanced Advantage Fund",amc:"SBI",cat:"Hybrid",one:11.14,three:13.22,risk:"Moderate",aum:"₹30,000 Cr"}];
function slugify(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function openFund(name){window.location.href="/fund/"+slugify(name)+"/"}
const grid=document.getElementById("fundGrid");
function renderFunds(list=funds){if(grid)grid.innerHTML=list.map(f=>`<div class="fund" onclick="openFund('${f.name.replace(/'/g,"\\'")}')"><small>${f.amc} · ${f.cat}</small><h3>${f.name}</h3><div class="return"><div><small>1Y return</small><b class="green">${f.one.toFixed(2)}%</b></div><span class="tag">${f.risk}</span></div></div>`).join("")}
renderFunds();
function showSearch(q){const box=document.getElementById("results");if(!box)return;q=(q||"").toLowerCase().trim();if(!q){box.innerHTML="";return}const m=funds.filter(f=>(f.name+" "+f.amc+" "+f.cat).toLowerCase().includes(q));box.innerHTML=m.length?m.map(f=>`<div class="search-result-link" onclick="openFund('${f.name.replace(/'/g,"\\'")}')">${f.name}<small> · ${f.cat}</small></div>`).join(""):"<div>No matching fund found</div>"}
document.getElementById("search")?.addEventListener("input",e=>showSearch(e.target.value));
function runHeroSearch(){const q=document.getElementById("heroSearch")?.value||"";showSearch(q);const s=document.getElementById("search");if(s){s.value=q;s.focus()}}
function fillSelects(){["fundA","fundB"].forEach(id=>{const e=document.getElementById(id);if(e)e.innerHTML=funds.map((f,i)=>`<option value="${i}">${f.name}</option>`).join("")})}fillSelects();
function compareFunds(){const a=funds[+(document.getElementById("fundA")?.value||0)],b=funds[+(document.getElementById("fundB")?.value||1)],o=document.getElementById("comparison");if(o)o.innerHTML=`<div class="comparetable"><table><tr><td>Metric</td><td>${a.name}</td><td>${b.name}</td></tr><tr><td>1Y Return</td><td>${a.one}%</td><td>${b.one}%</td></tr><tr><td>3Y CAGR</td><td>${a.three}%</td><td>${b.three}%</td></tr><tr><td>Risk</td><td>${a.risk}</td><td>${b.risk}</td></tr></table></div>`}
function screenFunds(){const cat=document.getElementById("cat")?.value||"",sort=document.getElementById("sort")?.value||"return";let l=funds.filter(f=>!cat||f.cat===cat);l.sort((a,b)=>sort==="three"?b.three-a.three:b.one-a.one);const o=document.getElementById("screenTable");if(o)o.innerHTML=l.map(f=>`<div class="row" onclick="openFund('${f.name.replace(/'/g,"\\'")}')" style="cursor:pointer"><span><b>${f.name}</b><small>${f.amc} · ${f.cat}</small></span><span>${f.one}%</span><span>${f.three}%</span><span>${f.risk}</span></div>`).join("")}screenFunds();
document.getElementById("cat")?.addEventListener("change",screenFunds);document.getElementById("sort")?.addEventListener("change",screenFunds);
function sipCalc(){const p=+(document.getElementById("sip")?.value||0),r=(+(document.getElementById("rate")?.value||0))/1200,n=(+(document.getElementById("years")?.value||0))*12,f=r?p*((Math.pow(1+r,n)-1)/r)*(1+r):p*n,o=document.getElementById("sipOut");if(o)o.textContent="₹"+(f/100000).toFixed(2)+" Lakh"}