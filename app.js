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
function renderFunds(list=funds){grid.innerHTML=list.slice(0,8).map(f=>`<div class="fund"><small>${f.amc} · ${f.cat}</small><h3>${f.name}</h3><div class="return"><div><small>1Y return</small><b class="green">${f.one.toFixed(2)}%</b></div><span class="tag">${f.risk}</span></div></div>`).join("")}
renderFunds();

function fillSelects(){["fundA","fundB"].forEach(id=>document.getElementById(id).innerHTML=funds.map((f,i)=>`<option value="${i}">${f.name}</option>`).join(""))}fillSelects();

function compareFunds(){const a=funds[+fundA.value],b=funds[+fundB.value];document.getElementById("comparison").innerHTML=`<div class="comparetable"><table><tr><td>Metric</td><td>${a.name}</td><td>${b.name}</td></tr><tr><td>Category</td><td>${a.cat}</td><td>${b.cat}</td></tr><tr><td>1Y Return</td><td class="green">${a.one}%</td><td class="green">${b.one}%</td></tr><tr><td>3Y CAGR</td><td class="green">${a.three}%</td><td class="green">${b.three}%</td></tr><tr><td>Risk</td><td>${a.risk}</td><td>${b.risk}</td></tr><tr><td>AUM</td><td>${a.aum}</td><td>${b.aum}</td></tr></table></div>`}

function screenFunds(){let l=[...funds];const c=document.getElementById("cat").value,s=document.getElementById("sort").value;if(c)l=l.filter(x=>x.cat===c);l.sort((a,b)=>b[s==="return"?"one":s==="three"?"three":"one"]-a[s==="return"?"one":s==="three"?"three":"one"]);document.getElementById("screenTable").innerHTML=`<div class="row header"><span>Fund</span><span>1Y</span><span>3Y CAGR</span><span>Risk</span></div>`+l.map(f=>`<div class="row"><span><b>${f.name}</b><small>${f.amc} · ${f.cat}</small></span><span class="green">${f.one}%</span><span class="green">${f.three}%</span><span>${f.risk}</span></div>`).join("")}screenFunds();

function sipCalc(){const p=+sip.value||0,r=(+rate.value||0)/1200,n=(+years.value||0)*12,fv=r?p*((Math.pow(1+r,n)-1)/r)*(1+r):p*n;document.getElementById("sipOut").textContent="₹"+(fv/100000).toFixed(2)+" Lakh"} 

function showSearch(q){q=q.toLowerCase();const m=funds.filter(f=>(f.name+" "+f.amc+" "+f.cat).toLowerCase().includes(q)).slice(0,5);document.getElementById("results").innerHTML=m.map(f=>`<div>${f.name}<small> · ${f.cat}</small></div>`).join("")}
document.getElementById("search").addEventListener("input",e=>showSearch(e.target.value));
function runHeroSearch(){showSearch(document.getElementById("heroSearch").value);document.getElementById("search").value=document.getElementById("heroSearch").value;document.getElementById("search").focus()}
