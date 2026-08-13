const stocks=[
  ["Reliance Industries","RELIANCE","1,421.60","+0.72%"],
  ["HDFC Bank","HDFCBANK","1,954.25","+0.31%"],
  ["TCS","TCS","3,812.40","-0.44%"],
  ["Infosys","INFY","1,548.80","+1.12%"],
  ["ICICI Bank","ICICIBANK","1,462.10","+0.86%"],
  ["Larsen & Toubro","LT","3,782.55","+0.18%"],
  ["Bharti Airtel","BHARTIARTL","1,862.30","-0.29%"],
  ["ITC","ITC","404.70","+0.54%"]
];
const movers=[
 ["Trent","7,418.20","+3.84%"],["Bharat Electronics","414.65","+3.22%"],
 ["Adani Ports","1,471.80","-2.16%"],["Tata Motors","724.30","-1.82%"],
 ["Sun Pharma","1,785.60","+1.97%"]
];
document.getElementById("stocksGrid").innerHTML=stocks.map(s=>`<div class="stock"><small>${s[1]}</small><h3>${s[0]}</h3><div class="quote"><strong>₹${s[2]}</strong><b class="${s[3][0]=='+'?'up':'down'}">${s[3]}</b></div></div>`).join("");
document.getElementById("movers").innerHTML=movers.map(s=>`<div class="mover"><div><b>${s[0]}</b><small>Equity</small></div><b>₹${s[1]}</b><b class="${s[2][0]=='+'?'up':'down'}">${s[2]}</b></div>`).join("");

const canvas=document.getElementById("chart"),ctx=canvas.getContext("2d");
function drawChart(){
  const d=devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;canvas.width=w*d;canvas.height=h*d;ctx.scale(d,d);
  const vals=[35,42,38,49,46,57,54,62,59,71,68,77,73,82,78,91,88,96,93,101,97,108,105,116];
  const min=Math.min(...vals),max=Math.max(...vals);
  ctx.beginPath(); vals.forEach((v,i)=>{const x=i*(w/(vals.length-1)),y=h-15-((v-min)/(max-min))*(h-30);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.lineWidth=3;ctx.strokeStyle="#e75b35";ctx.stroke();
  ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.globalAlpha=.08;ctx.fillStyle="#e75b35";ctx.fill();ctx.globalAlpha=1;
}
drawChart();addEventListener("resize",drawChart);

function calculateSIP(){
  const p=+document.getElementById("sip").value||0,r=(+document.getElementById("rate").value||0)/1200,n=(+document.getElementById("years").value||0)*12;
  const fv=r? p*((Math.pow(1+r,n)-1)/r)*(1+r):p*n;
  document.getElementById("sipResult").textContent="₹"+(fv/100000).toFixed(2)+" Lakh";
}
document.getElementById("searchInput").addEventListener("input",e=>{
  const q=e.target.value.toLowerCase().trim(),box=document.getElementById("searchResults");
  if(!q){box.innerHTML="";return}
  const matches=stocks.filter(s=>(s[0]+" "+s[1]).toLowerCase().includes(q)).slice(0,5);
  box.innerHTML=matches.map(s=>`<div style="background:#fff;border:1px solid #ddd;padding:10px 14px">${s[0]} <small>(${s[1]})</small></div>`).join("");
});
