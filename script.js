const ids=["pv","pmt","r","n"];ids.forEach(i=>document.getElementById(i).oninput=calc);
const br=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function calc(){let pv=+pvEl.value,pmt=+pmtEl.value,r=+rEl.value/100,n=+nEl.value;
let bal=pv,x=[],y=[];for(let i=0;i<=n;i++){x.push(i);y.push(bal);if(i<n){bal=bal*(1+r)+pmt;}}
let invested=pv+pmt*n;inv.textContent=br(invested);fv.textContent=br(bal);int.textContent=br(bal-invested);
Plotly.newPlot('chart',[{x:x,y:y,mode:'lines',fill:'tozeroy',name:'Patrimônio'}],
{margin:{t:20},xaxis:{title:'Mês'},yaxis:{title:'Saldo (R$)'}},{responsive:true,displayModeBar:false});}
const pvEl=pv,pmtEl=pmt,rEl=r,nEl=n;calc();