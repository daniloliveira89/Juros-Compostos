const getEl = id => document.getElementById(id);

// Elementos de entrada e configuração
const inputs = ["pv", "pmt", "r", "n"].map(id => getEl(id));
const currencySelect = getEl("currency");
const goldCheck = getEl("check-gold");
const btcCheck = getEl("check-btc");

// Elementos de saída
const [invEl, intEl, fvEl] = ["inv", "int", "fv"].map(id => getEl(id));
const formulaDynamic = getEl("formula-dynamic");
const obsText = getEl("obs-text");

// Ouvintes de eventos
inputs.forEach(input => input.oninput = calc);
currencySelect.onchange = calc;
goldCheck.onchange = calc;
btcCheck.onchange = calc;

// Mapeamento unificado: Moeda -> Idioma, Região e Inflação Média Anual
const combinedConfigs = {
    BRL: { lang: 'pt', locale: 'pt-BR', code: 'BRL', inflation: 6.0 },
    USD: { lang: 'en', locale: 'en-US', code: 'USD', inflation: 3.0 },
    EUR: { lang: 'es', locale: 'es-ES', code: 'EUR', inflation: 2.5 }
};

// Constantes do Ouro
const GOLD_R_ANNUAL = 8.0;

// Nomes dos meses para as marcações dinâmicas verticais
const monthNames = {
    pt: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    es: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
};

const shortMonthNames = {
    pt: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
    en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    es: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
};

// Dicionário de Tradução Dinâmica
const translations = {
    pt: {
        titleSim: "Simulador", lblCurr: "Moeda",
        lblPv: "Valor inicial (PV)", lblPmt: "Aporte mensal (PMT)",
        lblR: "Juros (% a.a.)", lblN: "Período (anos)",
        formulaTitle: "Fórmula do Cálculo (Capitalização Mensal)",
        titleInv: "Total Investido", titleInt: "Juros Líquidos (Pós IR)", titleFv: "Patrimônio Líquido (FV)",
        chartInv: "Capital Investido", chartInt: "Patrimônio Líquido da Carteira",
        chartReal: "Poder de Compra Real (Líquido)", chartGold: "Investimento em Ouro",
        chartBtc: "Investimento em Bitcoin", halvingLegend: "Halving do Bitcoin",
        lblCheckGold: "Exibir Ouro", lblCheckBtc: "Exibir Bitcoin",
        obsText: "*A simulação de juros compostos é aplicável para CDI e Tesouro Direto.",
        equivText: (rAn, rM, y, m) => `Equivalência mensal: r = ${rAn}% / 12 = ${rM}% a.m. | n = ${y} anos × 12 = ${m} meses`,
        axisXYear: "Ano", axisXMonth: "An", axisY: "Saldo"
    },
    en: {
        titleSim: "Simulator", lblCurr: "Currency",
        lblPv: "Initial Value (PV)", lblPmt: "Monthly Contribution (PMT)",
        lblR: "Interest (% p.a.)", lblN: "Period (years)",
        formulaTitle: "Calculation Formula (Monthly Compounding)",
        titleInv: "Total Invested", titleInt: "Net Interest (Post Tax)", titleFv: "Net Wealth (FV)",
        chartInv: "Invested Capital", chartInt: "Net Portfolio Wealth",
        chartReal: "Real Purchasing Power (Net)", chartGold: "Gold Investment",
        chartBtc: "Bitcoin Investment", halvingLegend: "Bitcoin Halving",
        lblCheckGold: "Show Gold", lblCheckBtc: "Show Bitcoin",
        obsText: "*The compound interest simulation is applicable for CDI and Tesouro Direto.",
        equivText: (rAn, rM, y, m) => `Monthly equivalence: r = ${rAn}% / 12 = ${rM}% p.m. | n = ${y} years × 12 = ${m} months`,
        axisXYear: "Year", axisXMonth: "Yr", axisY: "Balance"
    },
    es: {
        titleSim: "Simulador", lblCurr: "Moneda",
        lblPv: "Valor Inicial (PV)", lblPmt: "Depósito Mensal (PMT)",
        lblR: "Interés (% a.a.)", lblN: "Período (años)",
        formulaTitle: "Fórmula de Cálculo (Capitalización Mensual)",
        titleInv: "Total Invertido", titleInt: "Intereses Netos (Post IR)", titleFv: "Patrimonio Neto (FV)",
        chartInv: "Capital Invertido", chartInt: "Patrimonio Neto Total",
        chartReal: "Poder de Compra Real (Neto)", chartGold: "Inversión en Oro",
        chartBtc: "Inversión de Bitcoin", halvingLegend: "Halving de Bitcoin",
        lblCheckGold: "Mostrar Oro", lblCheckBtc: "Mostrar Bitcoin",
        obsText: "*La simulación de interés compuesto es aplicable para CDI y Tesouro Direto.",
        equivText: (rAn, rM, y, m) => `Equivalencia mensual: r = ${rAn}% / 12 = ${rM}% m.s. | n = ${y} años × 12 = ${m} meses`,
        axisXYear: "Año", axisXMonth: "Añ", axisY: "Saldo"
    }
};

function getIRRate(months) {
    if (months <= 6) return 0.225;  
    if (months <= 12) return 0.20;  
    if (months <= 24) return 0.175; 
    return 0.15;                    
}

function calc() {
    const [pv, pmt, rAnnual, years] = inputs.map(input => +input.value);
    const currentCurr = currencySelect.value;
    
    const cfg = combinedConfigs[currentCurr];
    const t = translations[cfg.lang];

    // Traduz dinamicamente a interface de texto
    getEl("title-sim").textContent = t.titleSim;
    getEl("lbl-curr").textContent = t.lblCurr; 
    getEl("lbl-pv").textContent = t.lblPv;
    getEl("lbl-pmt").textContent = t.lblPmt;
    getEl("lbl-r").textContent = t.lblR;
    getEl("lbl-n").textContent = t.lblN;
    getEl("formula-title").textContent = t.formulaTitle;
    getEl("title-inv").textContent = t.titleInv;
    getEl("title-int").textContent = t.titleInt;
    getEl("title-fv").textContent = t.titleFv;
    getEl("lbl-check-gold").textContent = t.lblCheckGold;
    getEl("lbl-check-btc").textContent = t.lblCheckBtc;
    obsText.textContent = t.obsText;

    const formatMoney = v => v.toLocaleString(cfg.locale, { style: 'currency', currency: cfg.code });
    const formatMoneyNoCents = v => v.toLocaleString(cfg.locale, { style: 'currency', currency: cfg.code, maximumFractionDigits: 0 });

    const r = (rAnnual / 12) / 100;
    const inf = (cfg.inflation / 12) / 100;
    const rGold = (GOLD_R_ANNUAL / 12) / 100;
    const n = years * 12;

    let bal = pv; 
    let balGold = pv;
    let balBtc = pv;

    const xLabels = [];
    const yInvested = [];
    const yTotalNet = [];
    const yRealValue = [];
    const yGoldTotal = [];
    const yBtcTotal = [];

    const startYear = 2026;
    const startMonth = 6; 

    for (let i = 0; i <= n; i++) {
        const totalMonths = startMonth + i;
        const currentMonth = totalMonths % 12;
        const currentYear = startYear + Math.floor(totalMonths / 12);

        const shortMonth = shortMonthNames[cfg.lang][currentMonth];
        const shortYear = String(currentYear).slice(-2);
        const label = `${shortMonth}/${shortYear}`;
        xLabels.push(label);
        
        const currentInvested = pv + (pmt * i);
        yInvested.push(currentInvested);
        
        const grossInterest = Math.max(0, bal - currentInvested);
        const irRate = getIRRate(i);
        const netInterest = grossInterest * (1 - irRate);
        const netBal = currentInvested + netInterest;
        
        yTotalNet.push(netBal); 
        yRealValue.push(netBal / Math.pow(1 + inf, i)); 
        yGoldTotal.push(balGold);
        yBtcTotal.push(balBtc);

        if (i < n) {
            let btcRAnnual = 35.0;
            if (currentYear < 2028 || (currentYear === 2028 && currentMonth < 3)) {
                btcRAnnual = 35.0;
            } else if (currentYear < 2032 || (currentYear === 2032 && currentMonth < 3)) {
                btcRAnnual = 35.0;
            } else if (currentYear < 2036 || (currentYear === 2036 && currentMonth < 3)) {
                btcRAnnual = 20.0;
            } else {
                btcRAnnual = 12.0;
            }

            const rBtc = (btcRAnnual / 12) / 100;

            bal = bal * (1 + r) + pmt; 
            balGold = balGold * (1 + rGold) + pmt;
            balBtc = balBtc * (1 + rBtc) + pmt;
        }
    }

    const totalInvested = pv + pmt * n;
    const finalIrRate = getIRRate(n);
    const finalGrossInterest = Math.max(0, bal - totalInvested);
    const finalNetInterest = finalGrossInterest * (1 - finalIrRate);
    const finalNetBal = totalInvested + finalNetInterest;

    invEl.textContent = formatMoney(totalInvested);
    fvEl.textContent = formatMoney(finalNetBal);
    intEl.textContent = formatMoney(finalNetInterest);

    formulaDynamic.innerHTML = `
        <div style="font-size: 0.8rem; font-family: 'Inter', sans-serif; color: #64748b; margin-bottom: 10px;">
            ${t.equivText(rAnnual, (r * 100).toFixed(2), years, n)} &bull; Inflação: ${cfg.inflation}% a.a. &bull; IR Retido: ${(finalIrRate * 100).toFixed(1)}%
        </div>
        FV = ${formatMoney(pv)} × (1 + ${r.toFixed(4)})<sup>${n}</sup> + ${formatMoney(pmt)} × [ ((1 + ${r.toFixed(4)})<sup>${n}</sup> - 1) / ${r.toFixed(4)} ]
        <div style="margin-top: 10px;">
            <strong>FV Bruto = <span>${formatMoney(bal)}</span> &nbsp;|&nbsp; <span class="math-highlight">FV Líquido = ${formatMoney(finalNetBal)}</span></strong>
        </div>
    `;

    // Configuração dos Marcos Verticais (Halvings)
    const targetDates = [{ m: 3, y: 2028 }, { m: 3, y: 2032 }, { m: 3, y: 2036 }];
    const shapes = [];
    const annotations = [];

    if (btcCheck.checked) {
        targetDates.forEach(target => {
            const targetMonthsTotal = target.y * 12 + target.m;
            const startMonthsTotal = startYear * 12 + startMonth;
            const endMonthsTotal = startMonthsTotal + n;

            if (targetMonthsTotal >= startMonthsTotal && targetMonthsTotal <= endMonthsTotal) {
                const targetShortMonth = shortMonthNames[cfg.lang][target.m];
                const targetShortYear = String(target.y).slice(-2);
                const targetLabel = `${targetShortMonth}/${targetShortYear}`;

                shapes.push({
                    type: 'line', x0: targetLabel, y0: 0, x1: targetLabel, y1: 1, yref: 'paper',
                    line: { color: '#94a3b8', width: 1.5, dash: 'dash' }
                });

                annotations.push({
                    x: targetLabel, y: 1.02, yref: 'paper', text: `${monthNames[cfg.lang][target.m]} ${target.y}`,
                    showarrow: false, xanchor: 'center', yanchor: 'bottom',
                    font: { family: 'Inter, sans-serif', size: 10, color: '#475569', weight: 'bold' },
                    bgcolor: 'rgba(248, 250, 252, 0.95)', bordercolor: '#cbd5e1', borderwidth: 1, borderpad: 4
                });
            }
        });
    }

    // Arrays de Camadas Visuais
    const visualTraces = [];
    
    const traceInvestedVisual = {
        x: xLabels, y: yInvested, type: 'scatter', mode: 'lines',
        fill: 'tozeroy', fillcolor: 'rgba(37, 99, 235, 0.12)',
        line: { color: '#2563eb', width: 2.5 }, hoverinfo: 'skip', showlegend: false
    };
    const traceInterestVisual = {
        x: xLabels, y: yTotalNet, type: 'scatter', mode: 'lines',
        fill: 'tonexty', fillcolor: 'rgba(16, 185, 129, 0.18)',
        line: { color: '#10b981', width: 2.5 }, hoverinfo: 'skip', showlegend: false
    };
    const traceRealVisual = {
        x: xLabels, y: yRealValue, type: 'scatter', mode: 'lines',
        line: { color: '#ef4444', width: 2.5, dash: 'dash' }, hoverinfo: 'skip', showlegend: false
    };

    visualTraces.push(traceInvestedVisual, traceInterestVisual, traceRealVisual);

    if (goldCheck.checked) {
        visualTraces.push({
            x: xLabels, y: yGoldTotal, type: 'scatter', mode: 'lines',
            line: { color: '#eab308', width: 3 }, hoverinfo: 'skip', showlegend: false
        });
    }
    if (btcCheck.checked) {
        visualTraces.push({
            x: xLabels, y: yBtcTotal, type: 'scatter', mode: 'lines',
            line: { color: '#f7931a', width: 3 }, hoverinfo: 'skip', showlegend: false
        });
    }

    // Arrays de Interação (Hover e Legenda)
    const traceInvestedHover = {
        x: xLabels, y: yInvested, name: t.chartInv, type: 'scatter', mode: 'lines',
        line: { color: '#2563eb', width: 2.5 }, text: yInvested.map(v => formatMoneyNoCents(v)),
        hovertemplate: '%{text}<extra></extra>', showlegend: true
    };
    const traceRealHover = {
        x: xLabels, y: yRealValue, name: t.chartReal, type: 'scatter', mode: 'lines',
        line: { color: '#ef4444', width: 2.5, dash: 'dash' }, text: yRealValue.map(v => formatMoneyNoCents(v)),
        hovertemplate: '%{text}<extra></extra>', showlegend: true
    };
    const traceInterestHover = {
        x: xLabels, y: yTotalNet, name: t.chartInt, type: 'scatter', mode: 'lines',
        line: { color: '#10b981', width: 2.5 }, text: yTotalNet.map(v => formatMoneyNoCents(v)),
        hovertemplate: '%{text}<extra></extra>', showlegend: true
    };
    const traceGoldHover = {
        x: xLabels, y: yGoldTotal, name: t.chartGold, type: 'scatter', mode: 'lines',
        line: { color: '#eab308', width: 3 }, text: yGoldTotal.map(v => formatMoneyNoCents(v)),
        hovertemplate: '%{text}<extra></extra>', showlegend: true
    };
    const traceBtcHover = {
        x: xLabels, y: yBtcTotal, name: t.chartBtc, type: 'scatter', mode: 'lines',
        line: { color: '#f7931a', width: 3 }, text: yBtcTotal.map(v => formatMoneyNoCents(v)),
        hovertemplate: '%{text}<extra></extra>', showlegend: true
    };

    const hoverPool = [
        { trace: traceInvestedHover, val: totalInvested },
        { trace: traceRealHover, val: yRealValue[n] },
        { trace: traceInterestHover, val: finalNetBal }
    ];

    if (goldCheck.checked) hoverPool.push({ trace: traceGoldHover, val: yGoldTotal[n] });
    if (btcCheck.checked) hoverPool.push({ trace: traceBtcHover, val: yBtcTotal[n] });

    hoverPool.sort((a, b) => a.val - b.val);
    const interactionTraces = hoverPool.map(item => item.trace);

    if (btcCheck.checked) {
        interactionTraces.push({
            x: [null], y: [null], name: t.halvingLegend, type: 'scatter', mode: 'lines',
            line: { color: '#94a3b8', width: 1.5, dash: 'dash' }, showlegend: true, hoverinfo: 'skip'
        });
    }

    const layout = {
        font: { family: 'Inter, system-ui, sans-serif', color: '#475569' },
        margin: { t: 40, b: 80, l: 75, r: 20 },
        hovermode: 'x unified',
        hoverlabel: {
            bgcolor: 'rgba(255, 255, 255, 0.96)',
            bordercolor: '#e2e8f0',
            font: { family: 'JetBrains Mono, monospace', size: 12, color: '#0f172a' }
        },
        legend: { orientation: 'h', y: -0.26, x: 0.5, xanchor: 'center', font: { size: 12 } },
        xaxis: { showgrid: false, tickfont: { size: 11, color: '#64748b' } },
        yaxis: { 
            gridcolor: '#f1f5f9', 
            zerolinecolor: '#e2e8f0',
            title: { text: `${t.axisY} (${currentCurr})`, font: { size: 12, weight: 'bold' } },
            tickfont: { family: 'JetBrains Mono, monospace', size: 11, color: '#64748b' },
            dtick: btcCheck.checked ? 50000 : 25000 
        },
        plot_bgcolor: '#ffffff', paper_bgcolor: '#ffffff',
        shapes: shapes, annotations: annotations
    };

    Plotly.newPlot('chart', [...visualTraces, ...interactionTraces], layout, { responsive: true, displayModeBar: false });
}

calc();
