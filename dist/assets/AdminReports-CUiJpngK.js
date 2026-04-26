import{r as u,ah as e}from"./vendor-BideMG-U.js";import{C as n,n as E,o as U}from"./index-D9pEaYaa.js";import{C as g,a as b,b as f,c as C,d as k}from"./chart-BWjFIDGf.js";import{g as M,f as y}from"./admin-reporting-CLEm3Ik2.js";import{f as o}from"./financing-DVI3URRC.js";import{F as q,Q as I,N as K,G as X}from"./icons-Cmb5VJEn.js";import{L as G,C as D,X as R,Y as F,a as Y,B as _,b as H,P,c as $,d as T}from"./charts-CVM3y10P.js";import"./router-Dhm9dmy4.js";import"./supabase-BAszmG4q.js";function B(d){return d.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&apos;")}function Q(d,t){const r=[["Metric","Value"],["Tenant",(d==null?void 0:d.name)??"Tenant"],["Plan",(d==null?void 0:d.plan)??"free"],["Total Receivable",t.totalReceivable.toFixed(2)],["Collected This Month",t.totalCollectedThisMonth.toFixed(2)],["Overdue Amount",t.overdueAmount.toFixed(2)],["Due This Week",t.dueThisWeekAmount.toFixed(2)],["Outstanding Balance",t.totalOutstanding.toFixed(2)],["Collection Coverage Rate",t.collectionCoverageRate.toFixed(2)],["Delinquency Rate",t.delinquencyRate.toFixed(2)],["Average Days Late",t.averageDaysLate.toFixed(2)],["30 Day Forecast",t.thirtyDayForecast.toFixed(2)],["60 Day Forecast",t.sixtyDayForecast.toFixed(2)]],c=[["Month","Collected","Due Pipeline"],...t.collectionTrend.map((i,h)=>{var p;return[i.label,i.value.toFixed(2),((p=t.duePipeline[h])==null?void 0:p.value.toFixed(2))??"0.00"]})],s=[["Bucket","Amount"],...t.agingBuckets.map(i=>[i.label,i.value.toFixed(2)])],l=[["Segment","Count"],...t.riskSegments.map(i=>[i.label,String(i.value)])],v=[["Name","User ID","Overdue Count","Overdue Balance","Outstanding Balance","Next Due"],...t.watchlist.map(i=>[i.user.fullName,i.user.id,String(i.overdueInstallmentCount),i.overdueBalance.toFixed(2),i.outstandingBalance.toFixed(2),i.nextDue?y(i.nextDue.dueDate):"Fully paid"])],x=(i,h)=>`
    <Worksheet ss:Name="${B(i)}">
      <Table>
        ${h.map(p=>`
              <Row>
                ${p.map(j=>`
                      <Cell><Data ss:Type="String">${B(j)}</Data></Cell>
                    `).join("")}
              </Row>
            `).join("")}
      </Table>
    </Worksheet>
  `;return`<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  ${x("Summary",r)}
  ${x("Trends",c)}
  ${x("Aging",s)}
  ${x("Risk",l)}
  ${x("Watchlist",v)}
</Workbook>`}function V(d,t,r){const c=new Blob([d],{type:r}),s=URL.createObjectURL(c),l=document.createElement("a");l.href=s,l.download=t,document.body.appendChild(l),l.click(),document.body.removeChild(l),URL.revokeObjectURL(s)}function J(d,t){const r=window.open("","_blank","width=960,height=720");if(!r)return;const c=t.watchlist.length>0?t.watchlist.map(s=>`
              <tr>
                <td>${s.user.fullName}</td>
                <td>${s.user.id}</td>
                <td>${s.overdueInstallmentCount}</td>
                <td>${o(s.overdueBalance)}</td>
                <td>${o(s.outstandingBalance)}</td>
                <td>${s.nextDue?y(s.nextDue.dueDate):"Fully paid"}</td>
              </tr>
            `).join(""):'<tr><td colspan="6">No watchlist records.</td></tr>';r.document.write(`
    <html>
      <head>
        <title>Tenant Report</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; margin: 0; color: #1f2937; background: #f8fafc; }
          .page { padding: 28px; }
          .hero { background: linear-gradient(135deg, #0f4c81, #2563eb); color: white; border-radius: 18px; padding: 24px; margin-bottom: 20px; }
          .hero h1 { margin: 0 0 6px; font-size: 28px; }
          .hero p { margin: 0; font-size: 13px; opacity: 0.9; }
          h2 { margin: 20px 0 8px; font-size: 18px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .card { background: white; border: 1px solid #dbe4f0; border-radius: 14px; padding: 14px; }
          .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
          .value { font-size: 20px; font-weight: 700; margin-top: 6px; }
          .subgrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; background: white; border-radius: 12px; overflow: hidden; }
          th, td { border: 1px solid #dbe4f0; padding: 8px; font-size: 12px; text-align: left; }
          th { background: #eff6ff; color: #1e3a8a; }
          .section-note { color: #475569; font-size: 12px; margin: 0 0 8px; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="hero">
            <h1>MORTI Pay Premium Report</h1>
            <p>${(d==null?void 0:d.name)??"Tenant"} | Plan: ${(d==null?void 0:d.plan)??"free"} | Generated: ${new Date().toLocaleString()}</p>
          </div>
          <div class="grid">
            <div class="card"><div class="label">Total Receivable</div><div class="value">${o(t.totalReceivable)}</div></div>
            <div class="card"><div class="label">Collected This Month</div><div class="value">${o(t.totalCollectedThisMonth)}</div></div>
            <div class="card"><div class="label">Overdue Amount</div><div class="value">${o(t.overdueAmount)}</div></div>
            <div class="card"><div class="label">30-Day Forecast</div><div class="value">${o(t.thirtyDayForecast)}</div></div>
          </div>
          <div class="subgrid">
            <div class="card"><div class="label">Collection Coverage</div><div class="value">${t.collectionCoverageRate.toFixed(1)}%</div></div>
            <div class="card"><div class="label">Delinquency Rate</div><div class="value">${t.delinquencyRate.toFixed(1)}%</div></div>
          </div>
          <h2>Portfolio Aging</h2>
          <p class="section-note">Outstanding balances grouped by current and delinquency bucket.</p>
          <table>
            <thead><tr><th>Bucket</th><th>Amount</th></tr></thead>
            <tbody>
              ${t.agingBuckets.map(s=>`<tr><td>${s.label}</td><td>${o(s.value)}</td></tr>`).join("")}
            </tbody>
          </table>
          <h2>Risk Segmentation</h2>
          <p class="section-note">Borrowers grouped by current collection risk level.</p>
          <table>
            <thead><tr><th>Risk Segment</th><th>Borrower Count</th></tr></thead>
            <tbody>
              ${t.riskSegments.map(s=>`<tr><td>${s.label}</td><td>${s.value}</td></tr>`).join("")}
            </tbody>
          </table>
          <h2>Borrower Watchlist</h2>
          <p class="section-note">Highest-priority follow-up accounts based on overdue activity and exposure.</p>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>ID</th>
                <th>Overdue Count</th>
                <th>Overdue Balance</th>
                <th>Outstanding</th>
                <th>Next Due</th>
              </tr>
            </thead>
            <tbody>${c}</tbody>
          </table>
        </div>
      </body>
    </html>
  `),r.document.close(),r.focus(),r.print()}function oe(){const[d,t]=u.useState([]),[r,c]=u.useState(null);u.useEffect(()=>{let a=!0;return(async()=>{const[O,W]=await Promise.all([E(),U()]);a&&(t(O.filter(z=>z.role==="tenant_user")),c(W))})(),()=>{a=!1}},[]);const s=u.useMemo(()=>M(d),[d]),l=(r==null?void 0:r.plan)==="premium",v=l?s.collectionTrend:s.collectionTrend.slice(-2),x=l?s.duePipeline:s.duePipeline.slice(0,2),i=l?s.watchlist:s.watchlist.slice(0,3),h={collected:{label:"Collected",color:"#10b981"}},p={due:{label:"Due Pipeline",color:"#2563eb"}},j={aging:{label:"Aging",color:"#f59e0b"}},A={risk:{label:"Risk",color:"#ef4444"}},N=["#cbd5e1","#fbbf24","#fb923c","#ef4444"],w=["#10b981","#f59e0b","#ef4444"],L=()=>{l&&V(Q(r,s),`${(r==null?void 0:r.slug)??"tenant"}-report.xls`,"application/vnd.ms-excel")},S=()=>{l&&J(r,s)};return e.jsxs("div",{className:"space-y-6 p-8",children:[e.jsxs("div",{className:"flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-3xl font-bold text-gray-900",children:"Reports"}),e.jsx("p",{className:"mt-2 text-gray-600",children:"Dedicated analytics and export workspace for tenant-admin reporting."})]}),e.jsxs("div",{className:"flex flex-wrap gap-3",children:[e.jsxs("button",{onClick:S,disabled:!l,className:"inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300",children:[e.jsx(q,{size:16}),"Export PDF"]}),e.jsxs("button",{onClick:L,disabled:!l,className:"inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300",children:[e.jsx(I,{size:16}),"Export Excel"]})]})]}),l?null:e.jsx(n,{className:"rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx(K,{className:"mt-0.5 text-slate-600",size:18}),e.jsxs("div",{children:[e.jsx("p",{className:"font-semibold text-slate-800",children:"Premium Reports Only"}),e.jsx("p",{className:"mt-1 text-sm text-slate-600",children:"Free tenants can view report previews, but PDF and Excel exports are only available on premium."}),e.jsx("p",{className:"mt-2 text-sm text-slate-600",children:"Free preview is limited to shorter reporting history. Premium unlocks the full reporting window and complete exportable analytics."})]})]})}),e.jsxs("div",{className:"grid gap-6 xl:grid-cols-3",children:[e.jsxs(n,{className:"rounded-xl p-6 xl:col-span-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-xl font-bold text-gray-900",children:"Monthly Collection Trend"}),e.jsx("p",{className:"mt-1 text-sm text-gray-600",children:"Paid installment value mapped to scheduled installment months."})]}),e.jsx("div",{className:"rounded-full bg-emerald-50 p-3 text-emerald-600",children:e.jsx(X,{size:20})})]}),e.jsx("div",{className:"mt-6",children:e.jsx(g,{config:h,className:"h-[280px] w-full",children:e.jsxs(G,{data:v,children:[e.jsx(D,{vertical:!1,strokeDasharray:"3 3"}),e.jsx(R,{dataKey:"label",tickLine:!1,axisLine:!1}),e.jsx(F,{hide:!0}),e.jsx(b,{content:e.jsx(f,{})}),e.jsx(C,{content:e.jsx(k,{})}),e.jsx(Y,{type:"monotone",dataKey:"value",name:"Collected",stroke:"var(--color-collected)",strokeWidth:3,dot:{r:4}})]})})})]}),e.jsxs(n,{className:"rounded-xl p-6",children:[e.jsx("h2",{className:"text-xl font-bold text-gray-900",children:"Payment Performance"}),e.jsx("p",{className:"mt-1 text-sm text-gray-600",children:"Coverage and delinquency based on scheduled installments to date."}),e.jsxs("div",{className:"mt-5 space-y-3",children:[e.jsxs("div",{className:"rounded-xl bg-gray-50 px-4 py-3",children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Collection Coverage"}),e.jsxs("p",{className:"mt-1 text-2xl font-bold text-gray-900",children:[s.collectionCoverageRate.toFixed(1),"%"]})]}),e.jsxs("div",{className:"rounded-xl bg-red-50 px-4 py-3",children:[e.jsx("p",{className:"text-xs text-red-600",children:"Delinquency Rate"}),e.jsxs("p",{className:"mt-1 text-2xl font-bold text-red-700",children:[s.delinquencyRate.toFixed(1),"%"]})]}),e.jsxs("div",{className:"rounded-xl bg-gray-50 px-4 py-3",children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Average Days Late"}),e.jsxs("p",{className:"mt-1 text-2xl font-bold text-gray-900",children:[s.averageDaysLate.toFixed(1)," days"]})]})]})]})]}),e.jsxs("div",{className:"grid gap-6 xl:grid-cols-3",children:[e.jsxs(n,{className:"rounded-xl p-6 xl:col-span-2",children:[e.jsx("h2",{className:"text-xl font-bold text-gray-900",children:"Upcoming Due Pipeline"}),e.jsx("p",{className:"mt-1 text-sm text-gray-600",children:"Scheduled unpaid installments across the next four months."}),e.jsx("div",{className:"mt-6",children:e.jsx(g,{config:p,className:"h-[280px] w-full",children:e.jsxs(_,{data:x,children:[e.jsx(D,{vertical:!1,strokeDasharray:"3 3"}),e.jsx(R,{dataKey:"label",tickLine:!1,axisLine:!1}),e.jsx(F,{hide:!0}),e.jsx(b,{content:e.jsx(f,{})}),e.jsx(C,{content:e.jsx(k,{})}),e.jsx(H,{dataKey:"value",name:"Due Pipeline",fill:"var(--color-due)",radius:[8,8,0,0]})]})})})]}),e.jsxs(n,{className:"rounded-xl p-6",children:[e.jsx("h2",{className:"text-xl font-bold text-gray-900",children:"Premium Forecast"}),e.jsx("p",{className:"mt-1 text-sm text-gray-600",children:"Forward-looking collection estimate for premium reporting."}),e.jsxs("div",{className:"mt-5 space-y-3",children:[e.jsxs("div",{className:"rounded-xl bg-gray-50 px-4 py-3",children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Next 30 Days"}),e.jsx("p",{className:"mt-1 text-2xl font-bold text-gray-900",children:l?o(s.thirtyDayForecast):"Locked"})]}),e.jsxs("div",{className:"rounded-xl bg-gray-50 px-4 py-3",children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Next 60 Days"}),e.jsx("p",{className:"mt-1 text-2xl font-bold text-gray-900",children:l?o(s.sixtyDayForecast):"Locked"})]})]})]})]}),e.jsxs("div",{className:"grid gap-6 xl:grid-cols-3",children:[e.jsxs(n,{className:"rounded-xl p-6",children:[e.jsx("h2",{className:"text-xl font-bold text-gray-900",children:"Portfolio Aging"}),e.jsx("div",{className:"mt-4",children:e.jsx(g,{config:j,className:"h-[240px] w-full",children:e.jsxs(P,{children:[e.jsx(b,{content:e.jsx(f,{})}),e.jsx($,{data:s.agingBuckets,dataKey:"value",nameKey:"label",innerRadius:55,outerRadius:90,strokeWidth:2,children:s.agingBuckets.map((a,m)=>e.jsx(T,{fill:N[m%N.length]},a.label))})]})})}),e.jsx("div",{className:"mt-4 space-y-2",children:s.agingBuckets.map(a=>e.jsxs("div",{className:"flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm",children:[e.jsx("span",{className:"text-gray-600",children:a.label}),e.jsx("span",{className:"font-semibold text-gray-900",children:l?o(a.value):"Locked"})]},a.label))})]}),e.jsxs(n,{className:"rounded-xl p-6",children:[e.jsx("h2",{className:"text-xl font-bold text-gray-900",children:"Risk Segmentation"}),e.jsx("div",{className:"mt-4",children:e.jsx(g,{config:A,className:"h-[240px] w-full",children:e.jsxs(P,{children:[e.jsx(b,{content:e.jsx(f,{})}),e.jsx($,{data:s.riskSegments,dataKey:"value",nameKey:"label",innerRadius:55,outerRadius:90,strokeWidth:2,children:s.riskSegments.map((a,m)=>e.jsx(T,{fill:w[m%w.length]},a.label))})]})})}),e.jsx("div",{className:"mt-4 space-y-2",children:s.riskSegments.map(a=>e.jsxs("div",{className:"flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm",children:[e.jsx("span",{className:"text-gray-600",children:a.label}),e.jsx("span",{className:"font-semibold text-gray-900",children:l?a.value:"Locked"})]},a.label))})]}),e.jsxs(n,{className:"rounded-xl p-6",children:[e.jsx("h2",{className:"text-xl font-bold text-gray-900",children:"Report Snapshot"}),e.jsxs("div",{className:"mt-4 space-y-3",children:[e.jsxs("div",{className:"rounded-xl bg-gray-50 px-4 py-3",children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Average Principal"}),e.jsx("p",{className:"mt-1 text-lg font-bold text-gray-900",children:l?o(s.averagePrincipal):"Locked"})]}),e.jsxs("div",{className:"rounded-xl bg-gray-50 px-4 py-3",children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Term Mix"}),e.jsx("div",{className:"mt-2 space-y-1",children:s.termMix.map(a=>e.jsxs("div",{className:"flex items-center justify-between text-sm",children:[e.jsxs("span",{className:"text-gray-600",children:[a.term," months"]}),e.jsx("span",{className:"font-semibold text-gray-900",children:l?a.count:"Locked"})]},a.term))})]})]})]})]}),e.jsxs("div",{className:"grid gap-6 xl:grid-cols-3",children:[e.jsxs(n,{className:"rounded-xl p-6 xl:col-span-2",children:[e.jsx("h2",{className:"text-xl font-bold text-gray-900",children:"Borrower Watchlist"}),e.jsx("p",{className:"mt-1 text-sm text-gray-600",children:l?"Full watchlist with the highest-priority collection follow-ups.":"Preview of the current watchlist. Premium unlocks the full reporting scope."}),e.jsxs("div",{className:"mt-5 space-y-3",children:[i.map(a=>{var m;return e.jsxs("div",{className:"rounded-2xl border border-gray-200 bg-white p-4",children:[e.jsxs("div",{className:"flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"font-semibold text-gray-900",children:a.user.fullName}),e.jsxs("p",{className:"text-sm text-gray-600",children:[a.user.id," | ",(m=a.user.loanProfile)==null?void 0:m.motorcycle]})]}),e.jsx("div",{className:"rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700",children:a.overdueInstallmentCount>0?`${a.overdueInstallmentCount} overdue`:"Upcoming due"})]}),e.jsxs("div",{className:"mt-3 grid gap-3 md:grid-cols-3",children:[e.jsxs("div",{className:"rounded-xl bg-gray-50 px-3 py-2",children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Overdue Balance"}),e.jsx("p",{className:"mt-1 text-sm font-semibold text-red-700",children:o(a.overdueBalance)})]}),e.jsxs("div",{className:"rounded-xl bg-gray-50 px-3 py-2",children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Outstanding Balance"}),e.jsx("p",{className:"mt-1 text-sm font-semibold text-gray-900",children:o(a.outstandingBalance)})]}),e.jsxs("div",{className:"rounded-xl bg-gray-50 px-3 py-2",children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Next Due"}),e.jsx("p",{className:"mt-1 text-sm font-semibold text-gray-900",children:a.nextDue?y(a.nextDue.dueDate):"Fully paid"})]})]})]},a.user.id)}),!l&&s.watchlist.length>i.length?e.jsx("div",{className:"rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600",children:"Premium unlocks the full watchlist and longer reporting history."}):null]})]}),e.jsxs(n,{className:"rounded-xl p-6",children:[e.jsx("h2",{className:"text-xl font-bold text-gray-900",children:"Support Access"}),e.jsx("p",{className:"mt-1 text-sm text-gray-600",children:l?"Priority support channel for premium tenant admins.":"Basic support guidance for free tenants."}),l?e.jsxs("div",{className:"mt-5 space-y-3",children:[e.jsxs("div",{className:"rounded-2xl border border-emerald-200 bg-emerald-50 p-4",children:[e.jsx("p",{className:"text-sm font-semibold text-emerald-900",children:"Priority Support"}),e.jsx("p",{className:"mt-2 text-sm text-emerald-800",children:"Premium tenants receive priority handling for report, monitoring, and tenant operations concerns."})]}),e.jsx("a",{href:`mailto:premium-support@mortipay.local?subject=${encodeURIComponent(`Priority support request - ${(r==null?void 0:r.name)??"Tenant"}`)}`,className:"inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700",children:"Contact Priority Support"})]}):e.jsx("div",{className:"mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600",children:"Free tenants can continue using the standard support path. Upgrade to premium for faster issue handling and priority review."})]})]})]})}export{oe as AdminReports};
