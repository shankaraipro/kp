import React from 'react';
import { ProposalData, Metric, CaseStudy, Review, Step } from '../types';
import { Check, TrendingUp, Target, Phone, Gift, Globe, Mail } from 'lucide-react';

interface PreviewProps {
  data: ProposalData;
  id: string;
}

/* --- HELPER COMPONENTS --- */

const RenderTextWithBullets: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) return null;
  
  return (
    <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
      {lines.map((line, i) => (
         <li key={i} className="pl-1 break-words break-all">{line}</li>
      ))}
    </ul>
  );
};

/* --- BLOCKS --- */

const CompanyHeaderBlock: React.FC<{ data: ProposalData }> = ({ data }) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b-2 border-slate-100 pb-6 gap-4">
    <div className={`flex items-center ${data.noLogo ? '' : 'gap-4'}`}>
       {!data.noLogo && (
         data.companyLogo ? (
           <img src={data.companyLogo} alt="Logo" className="h-16 w-auto object-contain" />
         ) : (
           <div className="h-16 w-16 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400 font-bold border border-slate-200">
             LOGO
           </div>
         )
       )}
       <div>
         <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{data.companyName}</h2>
         {data.companyWebsite && <a href={data.companyWebsite.startsWith('http') ? data.companyWebsite : `https://${data.companyWebsite}`} target="_blank" rel="noreferrer" className="text-sm text-slate-400 hover:text-[var(--theme-color)] block transition-colors">{data.companyWebsite}</a>}
       </div>
    </div>
    <div className="flex flex-col items-start md:items-end gap-1">
       {data.companyPhone && (
          <a href={`tel:${data.companyPhone}`} className="text-lg font-bold text-slate-900 hover:text-[var(--theme-color)] flex items-center gap-2 transition-colors">
             {data.companyPhone}
          </a>
       )}
       {data.companyEmail && (
          <a href={`mailto:${data.companyEmail}`} className="text-sm font-medium text-slate-500 hover:text-[var(--theme-color)] transition-colors">
             {data.companyEmail}
          </a>
       )}
    </div>
  </div>
);

const HeaderBlock: React.FC<{ data: ProposalData }> = ({ data }) => (
  <header className="mb-8 border-l-8 border-[var(--theme-color)] pl-6 py-2">
    {/* Added break-words to prevent horizontal overflow for long words */}
    <h1 className="text-5xl font-bold text-slate-900 mb-4 leading-[1.1] break-words break-all">{data.offerTitle}</h1>
    <p className="text-2xl text-slate-500 font-medium leading-normal break-words break-all">{data.offerSubtitle}</p>
  </header>
);

const ImageBlock: React.FC<{ data: ProposalData }> = ({ data }) => (
  data.mainImage ? (
    <div className="mb-8 rounded-2xl overflow-hidden shadow-2xl h-96 relative border border-slate-200 mt-auto">
      {/* Changed to background-image for better html2canvas export support */}
      <div 
        className="w-full h-full bg-cover bg-center"
        style={{ backgroundImage: `url(${data.mainImage})` }}
      />
    </div>
  ) : null
);

const ContextBlock: React.FC<{ data: ProposalData }> = ({ data }) => (
  <div className="grid grid-cols-2 gap-8">
    <div className="bg-slate-50 p-6 rounded-2xl border-l-4 border-orange-400 shadow-sm overflow-hidden h-auto">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900">
        <Target className="w-6 h-6 text-orange-500" />
        Текущая ситуация
      </h3>
      <div className="text-slate-700 text-base leading-relaxed">
        <RenderTextWithBullets text={data.currentSituation} />
      </div>
    </div>
    <div className="bg-slate-50 p-6 rounded-2xl border-l-4 border-green-400 shadow-sm overflow-hidden h-auto">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900">
        <Check className="w-6 h-6 text-green-500" />
        Цель
      </h3>
      <div className="text-slate-700 text-base leading-relaxed">
         <RenderTextWithBullets text={data.clientRequest} />
      </div>
    </div>
  </div>
);

const SolutionBlock: React.FC<{ data: ProposalData }> = ({ data }) => (
  <section className="overflow-hidden">
    <h2 className="text-3xl font-bold text-slate-900 mb-6 border-b border-slate-200 pb-2">Наше решение</h2>
    <h3 className="text-xl font-bold text-[var(--theme-color)] mb-3 break-words">{data.solutionTitle}</h3>
    <div className="text-lg text-slate-600 leading-relaxed break-words whitespace-pre-wrap">
      {data.solutionDescription}
    </div>
  </section>
);

const MetricsTitle: React.FC = () => (
    <h3 className="text-2xl font-bold mb-4 flex items-center gap-3 text-slate-900 mt-2">
      <TrendingUp className="w-7 h-7 text-[var(--theme-color)]" />
      Ожидаемые изменения
    </h3>
);

// Define grid template for metrics table to ensure fixed widths: 25% | 15% | 15% | 45%
const metricsGridClass = "grid grid-cols-[25%_15%_15%_45%]";

const MetricsTableHeader: React.FC = () => (
    <div className={`bg-[var(--theme-light)] text-slate-700 uppercase text-xs font-bold tracking-wider rounded-t-xl border border-slate-200 border-b-0 shadow-sm ${metricsGridClass}`}>
      <div className="p-3 border-r border-slate-200 flex items-center">Показатель</div>
      <div className="p-3 border-r border-slate-200 flex items-center">Было</div>
      <div className="p-3 border-r border-slate-200 flex items-center">Станет</div>
      <div className="p-3 flex items-center">За счет чего</div>
    </div>
);

const MetricRow: React.FC<{ m: Metric, isLast: boolean }> = ({ m, isLast }) => (
  // Removed overflow-hidden and line-clamp to prevent text cutoff in PDF
  <div className={`text-sm border border-slate-200 bg-white -mt-px relative z-0 ${metricsGridClass} ${isLast ? 'rounded-b-xl shadow-sm' : ''}`}>
    <div className="p-3 font-bold text-slate-900 text-base border-r border-slate-100 flex items-center">
      <span className="break-words break-all">{m.indicator}</span>
    </div>
    <div className="p-3 font-medium text-slate-500 text-base border-r border-slate-100 flex items-center">
      <span className="break-words break-all">{m.current}</span>
    </div>
    <div className="p-3 font-bold text-green-600 text-lg border-r border-slate-100 flex items-center">
      <span className="break-words break-all">{m.future}</span>
    </div>
    <div className="p-3 text-slate-700 text-base flex items-center">
      <span className="break-words break-all leading-tight">{m.cause}</span>
    </div>
  </div>
);

const CasesHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="mb-6 border-b border-slate-200 pb-2 pt-4">
    <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
  </div>
);

const CaseItem: React.FC<{ c: CaseStudy, idx: number }> = ({ c, idx }) => (
  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm mb-6 break-inside-avoid">
     <div className="flex items-center gap-3 mb-3">
        <span className="bg-[var(--theme-light)] text-[var(--theme-color)] text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex-shrink-0">Кейс {idx+1}</span>
        <h4 className="font-bold text-xl text-slate-900 break-words">{c.title}</h4>
     </div>
     {/* Added break-all to prevent long strings from breaking layout */}
     <p className="text-base text-slate-600 leading-relaxed border-l-2 border-slate-100 pl-4 break-words break-all">{c.description}</p>
  </div>
);

const ReviewsHeader: React.FC = () => (
   <div className="mb-6 border-b border-slate-200 pb-2 pt-4">
      <h2 className="text-3xl font-bold text-slate-900">Отзывы клиентов</h2>
   </div>
);

const ReviewItem: React.FC<{ r: Review }> = ({ r }) => (
  <div className="flex gap-5 items-start bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6 break-inside-avoid">
    {r.imageUrl ? (
      // Changed to background image div
      <div 
        className="w-16 h-16 rounded-full bg-cover bg-center flex-shrink-0 border-2 border-white shadow-sm"
        style={{ backgroundImage: `url(${r.imageUrl})` }}
      />
    ) : (
      <div className="w-16 h-16 rounded-full bg-[var(--theme-light)] flex items-center justify-center text-[var(--theme-color)] font-bold flex-shrink-0 text-xl shadow-inner">
        {r.author.charAt(0)}
      </div>
    )}
    <div className="flex-1 min-w-0">
      <div className="relative">
          <span className="absolute -left-2 -top-2 text-4xl text-slate-200 font-serif leading-none">“</span>
          <p className="text-slate-700 italic text-base mb-3 leading-relaxed relative z-10 break-words">{r.text}</p>
      </div>
      <div>
          <p className="font-bold text-slate-900 text-lg break-words">{r.author}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wide font-bold break-words">{r.role}</p>
      </div>
    </div>
  </div>
);

const ProcessHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="mb-6 border-b border-slate-200 pb-4 pt-4">
    <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
  </div>
);

const ProcessImage: React.FC<{ src: string }> = ({ src }) => (
  <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 h-40 mb-6 break-inside-avoid">
     <img src={src} alt="Process" className="object-contain w-full h-full opacity-95 bg-white" />
  </div>
);

const TariffsBlock: React.FC<{ data: ProposalData }> = ({ data }) => (
  <section className="mb-10 pt-4">
    <h2 className="text-3xl font-bold mb-6 text-slate-900 border-b border-slate-200 pb-4">Тарифы</h2>
    <div className="grid grid-cols-3 gap-5">
      {data.tariffs.map((t, idx) => (
        <div key={idx} className={`border rounded-2xl p-5 relative flex flex-col ${idx === 1 ? 'border-[var(--theme-color)] bg-[var(--theme-light)] shadow-lg scale-105 z-10' : 'border-slate-200 bg-white shadow-sm'}`}>
          <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 mb-2">{t.title}</h3>
          <div className="text-sm font-bold text-slate-900 mb-3 min-h-[40px] leading-tight break-words">{t.serviceName}</div>
          <div className="text-2xl font-black text-[var(--theme-color)] mb-5">{t.price}</div>
          {/* Reduced spacing here using space-y-1.5 */}
          <ul className="space-y-1.5 flex-1">
            {t.features.filter(f => f.trim() !== '').map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> <span className="leading-tight font-medium break-words break-all">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </section>
);

const CTABlock: React.FC<{ data: ProposalData }> = ({ data }) => (
  <footer className="bg-slate-900 text-white p-12 rounded-3xl shadow-xl w-full flex flex-col">
    {/* Company Profile Section (Now First) */}
    <div className="flex flex-col md:flex-row gap-8 items-stretch mb-10 border-b border-slate-700 pb-10">
        {/* Left: Company Image */}
        <div className="w-full md:w-1/3 min-h-[200px] rounded-2xl overflow-hidden border border-slate-700 relative bg-slate-800">
             {data.companyFooterImage ? (
                 <div 
                   className="w-full h-full bg-cover bg-center absolute inset-0"
                   style={{ backgroundImage: `url(${data.companyFooterImage})` }}
                 />
             ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-600">
                     <div className="text-center p-4">
                         <div className="w-12 h-12 border-2 border-slate-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-xl font-bold">?</span>
                         </div>
                         <span className="text-xs uppercase font-bold">Нет фото</span>
                     </div>
                 </div>
             )}
        </div>

        {/* Right: Info & Stats */}
        <div className="flex-1 flex flex-col justify-between">
             <div>
                 <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">О компании</div>
                 <h3 className="text-2xl font-bold text-white mb-3">{data.companyName}</h3>
                 <p className="text-slate-300 text-sm leading-relaxed mb-6 whitespace-pre-wrap break-words">{data.companyDescription}</p>
             </div>

             {data.showCompanyStats && (
                 <div className="grid grid-cols-2 gap-4">
                     {data.companyStats.map((stat, idx) => (
                         <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10">
                             <div className="text-2xl font-black text-[var(--theme-color)] leading-none mb-1 break-all">{stat.value}</div>
                             <div className="text-xs font-bold text-slate-400 uppercase tracking-wide break-words">{stat.label}</div>
                         </div>
                     ))}
                 </div>
             )}
        </div>
    </div>

    {/* CTA Top Section (Now Second/Bottom) */}
    <div className="text-center">
        {data.bonuses && (
        <div className="mb-8 inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
            <Gift className="w-6 h-6 text-yellow-400 animate-pulse" />
            <span className="font-bold text-yellow-100 text-lg break-words">{data.bonuses}</span>
        </div>
        )}
        
        <h2 className="text-4xl font-extrabold mb-8 leading-tight break-words">{data.ctaText}</h2>
        
        <div className="inline-block p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition">
            <div className="flex items-center justify-center gap-4 text-slate-100">
            <Phone className="w-8 h-8 flex-shrink-0" />
            <span className="text-3xl font-bold tracking-wide break-all">{data.contactInfo}</span>
            </div>
        </div>
    </div>
  </footer>
);

export const Preview: React.FC<PreviewProps> = ({ data, id }) => {
  const pageStyle = { 
     width: '210mm', 
     height: '297mm', 
     padding: '40px',
     // Theme Variables
     '--theme-color': data.themeColor,
     '--theme-light': `${data.themeColor}15`, // ~8% opacity
  } as React.CSSProperties;

  return (
    <div id={id}>
      
      {/* PAGE 1: Title, Company, Image */}
      <div className="print-page bg-white shadow-2xl mx-auto mb-8 relative flex flex-col" style={pageStyle}>
          <CompanyHeaderBlock data={data} />
          <div className="flex-1 flex flex-col justify-center">
             <HeaderBlock data={data} />
             <ImageBlock data={data} />
          </div>
          <div className="absolute bottom-4 right-6 text-xs text-slate-300 font-mono">Page 1</div>
          <div className="absolute bottom-4 left-6 text-xs text-slate-400 italic">Титульная страница</div>
      </div>

      {/* PAGE 2: Context, Solution, Metrics - STRICT LAYOUT */}
      <div className="print-page bg-white shadow-2xl mx-auto mb-8 relative flex flex-col" style={pageStyle}>
          <div className="mb-6 border-b border-slate-100 pb-4 flex-shrink-0">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{data.companyName} // Ситуация и Решение</span>
          </div>
          
          <div className="flex-1 flex flex-col gap-8 pb-8">
            {/* 1. Context */}
            {data.showContext && (
                <div className="min-h-0">
                    <ContextBlock data={data} />
                </div>
            )}
            
            {/* 2. Solution */}
            {data.showSolution && (
                <div className={`min-h-0 ${data.showContext ? 'border-t border-slate-100 pt-4' : ''}`}>
                    <SolutionBlock data={data} />
                </div>
            )}

            {/* 3. Metrics */}
            {data.showMetrics && (
                <div className={`min-h-0 flex flex-col justify-start ${data.showContext || data.showSolution ? 'border-t border-slate-100 pt-2' : ''}`}>
                    {data.metrics.length > 0 && (
                        <>
                            <MetricsTitle />
                            <MetricsTableHeader />
                            <div className="flex-1">
                                {data.metrics.slice(0,3).map((m, i) => (
                                    <MetricRow key={i} m={m} isLast={i === data.metrics.length - 1 || i === 2} />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
          </div>

          <div className="absolute bottom-4 right-6 text-xs text-slate-300 font-mono">Page 2</div>
      </div>

      {/* PAGE 3: Cases, Reviews */}
      <div className="print-page bg-white shadow-2xl mx-auto mb-8 relative flex flex-col" style={pageStyle}>
          <div className="mb-6 border-b border-slate-100 pb-4">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{data.companyName} // Опыт и Отзывы</span>
          </div>
          <div className="flex-1">
             {data.showCases && data.cases.length > 0 && (
                 <div className="mb-8">
                    <CasesHeader title={data.casesTitle} />
                    {data.cases.slice(0, 3).map((c, i) => <CaseItem key={i} c={c} idx={i} />)}
                 </div>
             )}
             {data.showReviews && data.reviews.length > 0 && (
                 <div>
                    <ReviewsHeader />
                    {data.reviews.slice(0, 3).map((r, i) => <ReviewItem key={i} r={r} />)}
                 </div>
             )}
          </div>
          <div className="absolute bottom-4 right-6 text-xs text-slate-300 font-mono">Page 3</div>
      </div>

      {/* PAGE 4: Process, Tariffs */}
      <div className="print-page bg-white shadow-2xl mx-auto mb-8 relative flex flex-col" style={pageStyle}>
          <div className="mb-6 border-b border-slate-100 pb-4">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{data.companyName} // Процесс и Стоимость</span>
          </div>
          <div className="flex-1">
             {data.showProcess && data.processSteps.length > 0 && (
                 <div className="mb-8">
                    <ProcessHeader title={data.processTitle} />
                     <div className={`mb-6 ${data.processSteps.length > 3 ? 'grid grid-cols-2 gap-x-8 gap-y-4' : 'flex flex-col gap-4'}`}>
                        {data.processSteps.map((step, i) => (
                            <div key={i} className="flex gap-4 items-start break-inside-avoid">
                                 {/* Added leading-none to prevent vertical shift in PDF export */}
                                 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-lg leading-none">
                                   {i + 1}
                                 </div>
                                 <div>
                                   <h4 className="font-bold text-slate-900 text-sm mb-1 break-words">{step.title}</h4>
                                   <p className="text-xs text-slate-600 leading-snug break-words">{step.description}</p>
                                 </div>
                           </div>
                        ))}
                     </div>
                     {data.processImage && <ProcessImage src={data.processImage} />}
                 </div>
             )}
             {data.showTariffs && <TariffsBlock data={data} />}
          </div>
          <div className="absolute bottom-4 right-6 text-xs text-slate-300 font-mono">Page 4</div>
      </div>

      {/* PAGE 5 (Optional): Gallery */}
      {data.showGallery && (
        <div className="print-page bg-white shadow-2xl mx-auto mb-8 relative flex flex-col" style={pageStyle}>
            <div className="mb-6 border-b border-slate-100 pb-4">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{data.companyName} // {data.galleryTitle}</span>
            </div>
            <div className="flex-1">
                <h2 className="text-3xl font-bold mb-6 text-slate-900">{data.galleryTitle}</h2>
                <div className="grid grid-cols-2 gap-6">
                    {data.galleryImages.map((img, idx) => (
                        <div key={idx} className="aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
                             {/* Changed to background image for better PDF export */}
                            <div 
                                className="w-full h-full bg-cover bg-center"
                                style={{ backgroundImage: `url(${img})` }}
                            />
                        </div>
                    ))}
                    {data.galleryImages.length === 0 && (
                        <div className="col-span-2 flex items-center justify-center h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                           <p>Загрузите фотографии в редакторе</p>
                        </div>
                    )}
                </div>
            </div>
            <div className="absolute bottom-4 right-6 text-xs text-slate-300 font-mono">Page 5</div>
        </div>
      )}

      {/* PAGE 5/6: CTA, Bonus, Company Profile */}
      <div className="print-page bg-white shadow-2xl mx-auto mb-8 relative flex flex-col justify-center text-center" style={pageStyle}>
          <div className="flex-1 flex flex-col items-center justify-center">
             <div className="mb-12">
                 {!data.noLogo && (
                    data.companyLogo ? (
                        <img src={data.companyLogo} alt="Logo" className="h-32 w-auto object-contain mx-auto opacity-70 grayscale hover:grayscale-0 transition-all duration-500" />
                    ) : (
                        <div className="text-4xl font-black text-slate-200">LOGO</div>
                    )
                 )}
             </div>
             
             {data.showFooter && <CTABlock data={data} />}
          </div>
          <div className="absolute bottom-4 right-6 text-xs text-slate-300 font-mono">Page {data.showGallery ? '6' : '5'}</div>
          <div className="absolute bottom-4 left-6 text-xs text-slate-400 italic">О компании и Действие</div>
      </div>

    </div>
  );
}