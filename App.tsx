import React, { useState, useRef, useLayoutEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ProposalData, INITIAL_DATA } from './types';
import { Preview } from './components/Preview';
import { generateProposalWithAI, generateImageWithAI } from './services/geminiService';
import { 
  Wand2, Download, Image as ImageIcon, Plus, Trash2, 
  Layout, Briefcase, TrendingUp, Users, DollarSign, Gift, Upload, Sparkles, Building2, Palette, Eye, EyeOff, Camera
} from 'lucide-react';

const COLORS = [
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'Purple', hex: '#9333ea' },
  { name: 'Orange', hex: '#ea580c' },
  { name: 'Teal', hex: '#0d9488' },
  { name: 'Indigo', hex: '#4f46e5' },
  { name: 'Pink', hex: '#db2777' },
  { name: 'Cyan', hex: '#0891b2' },
  { name: 'Slate', hex: '#475569' },
];

const INPUT_CLASSES = "w-full border-2 border-slate-300 bg-white rounded-xl px-5 py-4 text-slate-900 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all duration-200 placeholder-slate-400 shadow-sm text-base min-h-[56px]";
const SECTION_CLASSES = "bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 transition-all hover:shadow-2xl hover:shadow-slate-200/60 mb-8";

// --- HELPER COMPONENTS ---

// Auto-resizing textarea to solve the "unreadable text" issue
const AutoResizingTextarea = ({ value, onChange, placeholder, className, minHeight = 56 }: any) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const elem = textareaRef.current;
    if (elem) {
      // Collapse to auto to measure scrollHeight correctly
      elem.style.height = 'auto';
      // Set height to scrollHeight (content height)
      elem.style.height = `${Math.max(elem.scrollHeight, minHeight)}px`;
    }
  }, [value, minHeight]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`${className} overflow-hidden resize-none`}
      style={{ minHeight: `${minHeight}px` }}
      rows={1}
    />
  );
};

// Moved outside to prevent re-creation on every render
const SectionHeader = ({ icon: Icon, title, isVisible, onToggle }: { icon: any, title: string, isVisible?: boolean, onToggle?: () => void }) => (
  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
    <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
        <Icon className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
    </div>
    {onToggle && (
        <button
            onClick={onToggle}
            className={`p-2 rounded-lg transition-colors ${isVisible ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}
            title={isVisible ? "Скрыть блок" : "Показать блок"}
        >
            {isVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>
    )}
  </div>
);

// Updated FormRow to be more responsive and support full width better
const FormRow = ({ label, description, children, className="", vertical = false }: { label: string, description?: string, children?: React.ReactNode, className?: string, vertical?: boolean }) => (
  <div className={`flex ${vertical ? 'flex-col items-start gap-3' : 'flex-col sm:flex-row gap-3 sm:gap-6'} border-b border-slate-100 last:border-0 pb-6 mb-6 ${className} w-full`}>
    <div className={`${vertical ? 'w-full' : 'sm:w-1/4'} flex-shrink-0 pt-2`}>
       <label className="text-sm font-bold text-slate-800 block leading-tight">{label}</label>
       {description && <p className="text-xs text-slate-400 mt-2 leading-relaxed text-justify">{description}</p>}
    </div>
    <div className="flex-1 relative w-full min-w-0">
      {children}
    </div>
  </div>
);

export default function App() {
  const [data, setData] = useState<ProposalData>(INITIAL_DATA);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [previewScale, setPreviewScale] = useState(0.6);

  // Main Image Generation State
  const [imageSourceType, setImageSourceType] = useState<'upload' | 'ai'>('upload');
  const [imageGenPrompt, setImageGenPrompt] = useState("");
  const [isImageGenerating, setIsImageGenerating] = useState(false);

  // Process Image Generation State
  const [processImageSourceType, setProcessImageSourceType] = useState<'upload' | 'ai'>('upload');
  const [isProcessImageGenerating, setIsProcessImageGenerating] = useState(false);

  // Footer Image Generation State
  const [footerImageSourceType, setFooterImageSourceType] = useState<'upload' | 'ai'>('upload');

  const updateField = (field: keyof ProposalData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleVisibility = (field: keyof ProposalData) => {
      setData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleImageUpload = (field: 'mainImage' | 'processImage' | 'companyLogo' | 'companyFooterImage', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField(field, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReviewImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
         const newReviews = [...data.reviews];
         newReviews[index].imageUrl = reader.result as string;
         updateField('reviews', newReviews);
      };
      reader.readAsDataURL(file);
    }
  }

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const newImages: string[] = [];
          // Explicit cast to File[] to ensure TS knows these are Blobs
          const files = Array.from(e.target.files) as File[];
          let loadedCount = 0;

          files.forEach(file => {
              const reader = new FileReader();
              reader.onloadend = () => {
                  newImages.push(reader.result as string);
                  loadedCount++;
                  if (loadedCount === files.length) {
                       // Limit total images to 6 for now
                       const currentImages = [...data.galleryImages];
                       const combined = [...currentImages, ...newImages].slice(0, 6);
                       updateField('galleryImages', combined);
                  }
              };
              reader.readAsDataURL(file);
          });
      }
  };

  const removeGalleryImage = (index: number) => {
      const newImages = data.galleryImages.filter((_, i) => i !== index);
      updateField('galleryImages', newImages);
  };

  const handleAiGenerate = async () => {
    if (!aiTopic) return;
    setIsGenerating(true);
    try {
      const aiData = await generateProposalWithAI(aiTopic);
      
      // Enforce limits
      if (aiData.cases && aiData.cases.length > 3) aiData.cases = aiData.cases.slice(0, 3);
      if (aiData.reviews && aiData.reviews.length > 3) aiData.reviews = aiData.reviews.slice(0, 3);
      if (aiData.metrics && aiData.metrics.length > 3) aiData.metrics = aiData.metrics.slice(0, 3);
      if (aiData.companyStats && aiData.companyStats.length > 4) aiData.companyStats = aiData.companyStats.slice(0, 4);

      setData(prev => ({ ...prev, ...aiData }));
    } catch (error) {
      alert("Ошибка при генерации AI. Проверьте API Key и консоль.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imageGenPrompt) return;
    setIsImageGenerating(true);
    try {
        const base64Image = await generateImageWithAI(imageGenPrompt);
        if (base64Image) {
            updateField('mainImage', base64Image);
        } else {
            alert("Не удалось сгенерировать изображение. Попробуйте другой запрос.");
        }
    } catch (e) {
        alert("Ошибка генерации изображения");
    } finally {
        setIsImageGenerating(false);
    }
  };

  const handleGenerateProcessImage = async () => {
      if (data.processSteps.length === 0) {
          alert("Сначала заполните этапы работы, чтобы сгенерировать схему.");
          return;
      }
      setIsProcessImageGenerating(true);
      try {
          const stepsText = data.processSteps.map(s => `${s.title}`).join(' -> ');
          const prompt = `Minimalist professional business process flowchart diagram showing the following steps: ${stepsText}. White background, corporate blue and gray colors. High quality infographic.`;
          const base64Image = await generateImageWithAI(prompt);
          if (base64Image) {
              updateField('processImage', base64Image);
          } else {
              alert("Не удалось сгенерировать изображение схемы.");
          }
      } catch (e) {
          alert("Ошибка генерации изображения");
      } finally {
          setIsProcessImageGenerating(false);
      }
  };

  const downloadPDF = async () => {
    const pages = document.querySelectorAll('.print-page');
    if (pages.length === 0) return;
    
    setIsPdfGenerating(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-10000px';
      container.style.left = '0';
      // Explicitly set width to match the source to ensure layout consistency
      container.style.width = '210mm'; 
      container.style.zIndex = '-1';
      document.body.appendChild(container);

      for (let i = 0; i < pages.length; i++) {
        const originalPage = pages[i] as HTMLElement;
        const clone = originalPage.cloneNode(true) as HTMLElement;
        
        // Remove transform and margins to prevent shifting
        clone.style.transform = 'none';
        clone.style.margin = '0';
        clone.style.boxShadow = 'none';
        
        // Force text stability and cleanup specific for PDF
        clone.style.letterSpacing = 'normal';
        
        container.appendChild(clone);

        // Allow background images to load/render in the DOM
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(clone, { 
          scale: 2, // High resolution
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 794, // Approx A4 width at 96dpi (210mm)
          scrollX: 0,
          scrollY: 0,
          onclone: (doc) => {
              // Ensure no fonts are shifted by ligatures
              const elements = doc.getElementsByTagName('*');
              for (let j = 0; j < elements.length; j++) {
                  (elements[j] as HTMLElement).style.fontVariantLigatures = 'no-common-ligatures';
              }
          }
        });

        container.removeChild(clone);

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }
      
      document.body.removeChild(container);
      pdf.save('commercial-proposal.pdf');
    } catch (err) {
      console.error(err);
      alert("Ошибка при создании PDF");
    } finally {
      setIsPdfGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-100 font-sans">
      
      {/* LEFT PANEL: FORM EDITOR */}
      <div className="w-full lg:w-1/2 h-screen overflow-y-auto bg-slate-50 border-r border-gray-200 shadow-2xl z-10 custom-scrollbar relative">
        <div className="p-8 space-y-8 pb-32">
          
          <header className="mb-8">
             <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold mb-3 uppercase tracking-wider">Editor v3.5</div>
             <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Генератор КП</h1>
             <p className="text-slate-500 font-medium">Заполните поля слева. Структура: 5-6 фиксированных страниц.</p>
          </header>

          {/* AI Controls */}
          <div className="bg-white p-6 rounded-2xl border border-purple-200 shadow-sm ring-1 ring-purple-50">
            <label className="block text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-600"/>
              Автозаполнение (AI)
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                placeholder="Напр: Продажа CRM системы..."
                className={`${INPUT_CLASSES} border-purple-200 focus:ring-purple-300 focus:border-purple-400`}
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
              />
              <button 
                onClick={handleAiGenerate}
                disabled={isGenerating || !aiTopic}
                className="bg-purple-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-purple-700 transition disabled:opacity-50 whitespace-nowrap shadow-md hover:shadow-lg transform active:scale-[0.98]"
              >
                {isGenerating ? "Думаю..." : "Заполнить"}
              </button>
            </div>
            {!process.env.API_KEY && <p className="text-xs text-red-500 mt-2 font-medium">⚠️ API Key не найден. AI функции недоступны.</p>}
          </div>
          
          {/* THEME SELECTION */}
          <section className={SECTION_CLASSES}>
             <SectionHeader icon={Palette} title="Настройки оформления" />
             <FormRow label="Цветовая схема" description="Выберите основной цвет для вашего предложения.">
                <div className="flex flex-wrap gap-3">
                   {COLORS.map((color) => (
                      <button 
                        key={color.hex}
                        onClick={() => updateField('themeColor', color.hex)}
                        className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${data.themeColor === color.hex ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent shadow-sm'}`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                   ))}
                </div>
             </FormRow>
          </section>

          {/* BLOCK 0: Company Info */}
          <section className={SECTION_CLASSES}>
            <SectionHeader icon={Building2} title="0. О компании (Страница 1)" />
            <FormRow label="Логотип" description="Загрузите логотип вашей компании (PNG, JPG).">
              <div className="flex flex-col gap-4">
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={data.noLogo} 
                      onChange={(e) => updateField('noLogo', e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 transition"
                    />
                    <span className="text-sm font-bold text-slate-700">У меня нет логотипа</span>
                 </label>

                {!data.noLogo && (
                  <div className="flex items-center gap-4 transition-all duration-300 ease-in-out">
                    {data.companyLogo && (
                      <div className="w-16 h-16 border border-slate-200 rounded-lg p-1 bg-white relative">
                         <img src={data.companyLogo} className="w-full h-full object-contain" alt="Logo preview" />
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                       <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 shadow-sm border border-slate-200">
                         <Upload className="w-4 h-4"/> {data.companyLogo ? 'Изменить' : 'Загрузить лого'}
                         <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload('companyLogo', e)} />
                      </label>
                      {data.companyLogo && (
                         <button onClick={() => updateField('companyLogo', null)} className="text-red-500 hover:text-red-600 text-xs font-bold flex items-center gap-1"><Trash2 className="w-3 h-3"/> Удалить</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </FormRow>
            <FormRow label="Название компании" vertical={true}>
                <input value={data.companyName} onChange={(e) => updateField('companyName', e.target.value)} className={`${INPUT_CLASSES} font-bold`} placeholder="Моя Компания"/>
            </FormRow>
            <FormRow label="Телефон" description="Будет отображаться в шапке (кликабельный)." vertical={true}>
                <input value={data.companyPhone} onChange={(e) => updateField('companyPhone', e.target.value)} className={INPUT_CLASSES} placeholder="+7 (999) 000-00-00" />
            </FormRow>
            <FormRow label="Email" description="Для связи." vertical={true}>
                <input value={data.companyEmail} onChange={(e) => updateField('companyEmail', e.target.value)} className={INPUT_CLASSES} placeholder="info@company.com" />
            </FormRow>
             <FormRow label="Сайт" description="Опционально." vertical={true}>
                <input value={data.companyWebsite} onChange={(e) => updateField('companyWebsite', e.target.value)} className={INPUT_CLASSES} placeholder="www.company.com" />
            </FormRow>
          </section>

          {/* BLOCK 1: Offer */}
          <section className={SECTION_CLASSES}>
            <SectionHeader icon={Layout} title="1. Главный Оффер (Страница 1)" />
            
            <FormRow label="Заголовок" description="Основное название вашего предложения. Должно цеплять сразу." vertical={true}>
              <AutoResizingTextarea
                  value={data.offerTitle} 
                  onChange={(e: any) => updateField('offerTitle', e.target.value)}
                  className={`${INPUT_CLASSES} text-xl font-bold`} 
                  placeholder="Коммерческое Предложение"
                  minHeight={80}
                />
            </FormRow>

            <FormRow label="Подзаголовок" description="Раскройте суть оффера в одном предложении. Какую главную пользу получит клиент?" vertical={true}>
              <AutoResizingTextarea
                  value={data.offerSubtitle} 
                  onChange={(e: any) => updateField('offerSubtitle', e.target.value)}
                  className={`${INPUT_CLASSES} text-lg`} 
                  placeholder="Стратегия роста вашего бизнеса в 2024 году..."
                  minHeight={80}
                />
            </FormRow>
          </section>

          {/* BLOCK 2: Image */}
          <section className={SECTION_CLASSES}>
            <SectionHeader icon={ImageIcon} title="2. Обложка (Страница 1)" />
            
            <FormRow label="Источник изображения" description="Выберите, хотите ли вы загрузить свое фото или создать уникальное с помощью AI.">
              <div className="flex bg-slate-100 p-1.5 rounded-xl w-full border border-slate-200">
                 <button 
                   onClick={() => setImageSourceType('upload')}
                   className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${imageSourceType === 'upload' ? 'bg-white text-slate-900 shadow-sm border border-gray-100' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   <Upload className="w-4 h-4 inline mr-2" />
                   Загрузить
                 </button>
                 <button 
                   onClick={() => setImageSourceType('ai')}
                   className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${imageSourceType === 'ai' ? 'bg-white text-purple-700 shadow-sm border border-gray-100' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   <Sparkles className="w-4 h-4 inline mr-2" />
                   AI Генерация
                 </button>
              </div>
            </FormRow>

            {imageSourceType === 'upload' ? (
              <FormRow label="Загрузка файла" description="Поддерживаются форматы PNG, JPG. Рекомендуемый размер 1200x600px.">
                 <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload('mainImage', e)} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-blue-50 hover:border-blue-400 transition bg-slate-50">
                        <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600">
                           <Upload className="w-6 h-6" />
                        </div>
                        <span className="text-slate-900 font-bold block">Нажмите для выбора файла</span>
                        <span className="text-slate-400 text-sm">или перетащите сюда</span>
                    </div>
                 </div>
              </FormRow>
            ) : (
              <FormRow label="AI Промпт" description="Опишите, что должно быть на изображении. Например: 'Современный офис в стиле хай-тек'." vertical={true}>
                 <div className="flex flex-col gap-3">
                    <AutoResizingTextarea
                      value={imageGenPrompt}
                      onChange={(e: any) => setImageGenPrompt(e.target.value)}
                      placeholder="Опишите желаемое изображение..."
                      className={INPUT_CLASSES}
                      minHeight={80}
                    />
                    <button 
                      onClick={handleGenerateImage}
                      disabled={isImageGenerating || !imageGenPrompt}
                      className="bg-purple-600 text-white w-full py-3 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-2"
                    >
                      {isImageGenerating ? <span className="animate-pulse">Создаю шедевр...</span> : <><Sparkles className="w-4 h-4"/> Сгенерировать</>}
                    </button>
                 </div>
              </FormRow>
            )}
            
            {data.mainImage && (
               <FormRow label="Предпросмотр" description="Так выглядит текущая обложка.">
                  <div className="rounded-xl overflow-hidden border-2 border-slate-200 h-48 relative group shadow-sm bg-slate-100">
                    <img src={data.mainImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
               </FormRow>
            )}
          </section>

          {/* BLOCK 3: Context */}
          <section className={SECTION_CLASSES}>
            <SectionHeader icon={Briefcase} title="3. Контекст клиента (Страница 2)" isVisible={data.showContext} onToggle={() => toggleVisibility('showContext')} />
            
            {data.showContext && (
                <>
                <FormRow label="Текущая ситуация" description="Опишите проблемы. Нажмите Enter, чтобы создать новый пункт списка (буллет)." vertical={true}>
                    <AutoResizingTextarea 
                      value={data.currentSituation} 
                      onChange={(e: any) => updateField('currentSituation', e.target.value)}
                      className={INPUT_CLASSES} 
                      placeholder="Вы сталкиваетесь с высокой конкуренцией..."
                      minHeight={100}
                    />
                </FormRow>

                <FormRow label="Запрос (Цель)" description="Какого результата клиент хочет достичь? Нажмите Enter для новых пунктов." vertical={true}>
                    <AutoResizingTextarea 
                      value={data.clientRequest} 
                      onChange={(e: any) => updateField('clientRequest', e.target.value)}
                      className={INPUT_CLASSES} 
                      placeholder="Необходимо увеличить объем продаж на 30%..."
                      minHeight={100}
                    />
                </FormRow>
                </>
            )}
          </section>

          {/* BLOCK 4: Solution */}
          <section className={SECTION_CLASSES}>
            <SectionHeader icon={Layout} title="4. Ваше Решение (Страница 2)" isVisible={data.showSolution} onToggle={() => toggleVisibility('showSolution')} />
            
            {data.showSolution && (
                <>
                <FormRow label="Название решения" description="Краткое и емкое название вашего продукта или услуги." vertical={true}>
                    <AutoResizingTextarea
                      value={data.solutionTitle} 
                      onChange={(e: any) => updateField('solutionTitle', e.target.value)}
                      className={`${INPUT_CLASSES} font-bold text-lg`} 
                      placeholder="Комплексный маркетинг..."
                    />
                </FormRow>

                <FormRow label="Описание решения" description="Детально распишите, что именно вы предлагаете сделать. Не более 1/3 страницы." vertical={true}>
                    <AutoResizingTextarea 
                      value={data.solutionDescription} 
                      onChange={(e: any) => updateField('solutionDescription', e.target.value)}
                      className={INPUT_CLASSES} 
                      placeholder="Мы предлагаем внедрить..."
                      minHeight={150}
                    />
                </FormRow>
                </>
            )}
          </section>

          {/* BLOCK 5: Metrics */}
          <section className={SECTION_CLASSES}>
            <SectionHeader icon={TrendingUp} title="5. Показатели (Страница 2)" isVisible={data.showMetrics} onToggle={() => toggleVisibility('showMetrics')} />
            
            {data.showMetrics && (
                <>
                <div className="space-y-4 mb-6">
                {data.metrics.map((metric, idx) => (
                    <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm relative group">
                    <div className="absolute right-4 top-4">
                        <button onClick={() => {
                            const newMetrics = data.metrics.filter((_, i) => i !== idx);
                            updateField('metrics', newMetrics);
                        }} className="text-slate-300 hover:text-red-500 transition p-1">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4 pr-8">
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Показатель</label>
                            <input value={metric.indicator} onChange={(e) => {
                            const newMetrics = [...data.metrics];
                            newMetrics[idx].indicator = e.target.value;
                            updateField('metrics', newMetrics);
                            }} className={`${INPUT_CLASSES} font-bold`} placeholder="Напр: Конверсия сайта" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Было</label>
                            <input value={metric.current} onChange={(e) => {
                            const newMetrics = [...data.metrics];
                            newMetrics[idx].current = e.target.value;
                            updateField('metrics', newMetrics);
                            }} className={INPUT_CLASSES} placeholder="100 заявок..." />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-green-600 uppercase mb-2 block">Станет</label>
                            <input value={metric.future} onChange={(e) => {
                            const newMetrics = [...data.metrics];
                            newMetrics[idx].future = e.target.value;
                            updateField('metrics', newMetrics);
                            }} className={`${INPUT_CLASSES} font-bold text-green-700 bg-green-50 border-green-200 focus:border-green-500 focus:ring-green-100`} placeholder="300 заявок..." />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">За счет чего</label>
                        <input value={metric.cause} onChange={(e) => {
                            const newMetrics = [...data.metrics];
                            newMetrics[idx].cause = e.target.value;
                            updateField('metrics', newMetrics);
                        }} className={INPUT_CLASSES} placeholder="Внедрения скриптов..." />
                    </div>
                    </div>
                ))}
                </div>
                
                {data.metrics.length < 3 ? (
                <button onClick={() => updateField('metrics', [...data.metrics, { indicator: '', current: '', future: '', cause: '' }])} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-2 transition group">
                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" /> Добавить метрику (Макс. 3)
                </button>
                ) : (
                    <p className="text-center text-sm text-amber-600 font-bold mt-6 bg-amber-50 py-2 rounded-lg">Достигнут лимит показателей (3 шт.)</p>
                )}
                </>
            )}
          </section>

          {/* BLOCK 6: Cases */}
          <section className={SECTION_CLASSES}>
            <SectionHeader icon={Briefcase} title="6. Успешные Кейсы (Страница 3)" isVisible={data.showCases} onToggle={() => toggleVisibility('showCases')} />
            
            {data.showCases && (
                <>
                <FormRow label="Заголовок блока" description="Как вы назовете раздел с вашими достижениями?">
                <input 
                    value={data.casesTitle} 
                    onChange={(e) => updateField('casesTitle', e.target.value)}
                    className={`${INPUT_CLASSES} font-bold`} 
                />
                </FormRow>
                
                <div className="space-y-6">
                {data.cases.map((c, idx) => (
                    <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative shadow-sm">
                    <div className="flex justify-between items-start mb-4 border-b border-slate-200 pb-2">
                        <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">Кейс #{idx + 1}</span>
                        <button onClick={() => {
                            const newCases = data.cases.filter((_, i) => i !== idx);
                            updateField('cases', newCases);
                            }} className="text-slate-400 hover:text-red-500 transition">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                        <label className="text-sm font-bold text-slate-700 block mb-2">Название компании</label>
                        <input 
                            value={c.title} 
                            onChange={(e) => {
                                const newCases = [...data.cases];
                                newCases[idx].title = e.target.value;
                                updateField('cases', newCases);
                            }}
                            className={`${INPUT_CLASSES} font-bold`} 
                            placeholder="Название компании"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-700 block mb-2">Результат</label>
                            <AutoResizingTextarea 
                              value={c.description} 
                              onChange={(e: any) => {
                                  const newCases = [...data.cases];
                                  newCases[idx].description = e.target.value;
                                  updateField('cases', newCases);
                              }}
                              className={INPUT_CLASSES} 
                              placeholder="Чего удалось достичь..."
                              minHeight={80}
                            />
                        </div>
                        </div>
                    </div>
                ))}
                </div>
                
                {data.cases.length < 3 ? (
                <button onClick={() => updateField('cases', [...data.cases, { title: 'Новый кейс', description: '' }])} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-2 mt-6 transition group">
                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" /> Добавить кейс (Макс. 3)
                </button>
                ) : (
                <p className="text-center text-sm text-amber-600 font-bold mt-6 bg-amber-50 py-2 rounded-lg">Достигнут лимит кейсов (3 шт.)</p>
                )}
                </>
            )}
          </section>

          {/* BLOCK 7: Reviews */}
           <section className={SECTION_CLASSES}>
            <SectionHeader icon={Users} title="7. Отзывы (Страница 3)" isVisible={data.showReviews} onToggle={() => toggleVisibility('showReviews')} />
            
            {data.showReviews && (
                <>
                <div className="space-y-6">
                {data.reviews.map((r, idx) => (
                    <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative shadow-sm">
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="w-full">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Имя</label>
                            <input value={r.author} onChange={(e) => {
                            const newReviews = [...data.reviews];
                            newReviews[idx].author = e.target.value;
                            updateField('reviews', newReviews);
                            }} className={INPUT_CLASSES} placeholder="Иван Иванов" />
                        </div>
                        <div className="w-full">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Должность</label>
                            <input value={r.role} onChange={(e) => {
                            const newReviews = [...data.reviews];
                            newReviews[idx].role = e.target.value;
                            updateField('reviews', newReviews);
                            }} className={INPUT_CLASSES} placeholder="Директор" />
                        </div>
                    </div>
                    
                    <div className="mb-4">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Текст отзыва</label>
                        <AutoResizingTextarea
                           value={r.text} 
                           onChange={(e: any) => {
                            const newReviews = [...data.reviews];
                            newReviews[idx].text = e.target.value;
                            updateField('reviews', newReviews);
                            }} 
                            className={`${INPUT_CLASSES} italic text-slate-600`} 
                            placeholder="Напишите текст отзыва..."
                            minHeight={80}
                        />
                    </div>
                    
                    <div className="flex items-center gap-4 pt-4 border-t border-slate-200 mt-4">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Фото (Аватар)</label>
                            <input type="file" accept="image/*" onChange={(e) => handleReviewImageUpload(idx, e)} className="text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-white file:text-blue-600 file:shadow-sm hover:file:bg-blue-50 transition cursor-pointer w-full" />
                        </div>
                        <button onClick={() => {
                            const newReviews = data.reviews.filter((_, i) => i !== idx);
                            updateField('reviews', newReviews);
                        }} className="bg-red-50 text-red-500 hover:bg-red-100 p-2.5 rounded-xl transition">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                    </div>
                ))}
                </div>
                
                {data.reviews.length < 3 ? (
                <button onClick={() => updateField('reviews', [...data.reviews, { author: '', role: '', text: '' }])} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-2 mt-6 transition group">
                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" /> Добавить отзыв (Макс. 3)
                </button>
                ) : (
                    <p className="text-center text-sm text-amber-600 font-bold mt-6 bg-amber-50 py-2 rounded-lg">Достигнут лимит отзывов (3 шт.)</p>
                )}
                </>
            )}
          </section>
          
          {/* BLOCK 8: Steps */}
          <section className={SECTION_CLASSES}>
            <SectionHeader icon={Layout} title="8. Этапы работы (Страница 4)" isVisible={data.showProcess} onToggle={() => toggleVisibility('showProcess')} />
            
            {data.showProcess && (
                <>
                <FormRow label="Заголовок блока" description="Название раздела с планом работ.">
                <input 
                    value={data.processTitle} 
                    onChange={(e) => updateField('processTitle', e.target.value)}
                    className={`${INPUT_CLASSES} font-bold`} 
                />
                </FormRow>

                <div className="space-y-4 mb-6">
                {data.processSteps.map((step, idx) => (
                    <div key={idx} className="flex flex-col gap-4 items-start bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
                      <div className="flex justify-between w-full items-center">
                         <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 text-sm font-bold shadow-inner">{idx + 1}</div>
                         <button onClick={() => {
                              const newSteps = data.processSteps.filter((_, i) => i !== idx);
                              updateField('processSteps', newSteps);
                          }} className="text-slate-300 hover:text-red-500 p-1.5 transition">
                              <Trash2 className="w-5 h-5" />
                          </button>
                      </div>
                      
                      <div className="flex-1 space-y-3 w-full">
                          <input value={step.title} onChange={(e) => {
                              const newSteps = [...data.processSteps];
                              newSteps[idx].title = e.target.value;
                              updateField('processSteps', newSteps);
                          }} className={`${INPUT_CLASSES} font-bold`} placeholder="Название этапа" />
                          
                          <AutoResizingTextarea 
                            value={step.description} 
                            onChange={(e: any) => {
                              const newSteps = [...data.processSteps];
                              newSteps[idx].description = e.target.value;
                              updateField('processSteps', newSteps);
                            }} 
                            className={INPUT_CLASSES} 
                            placeholder="Описание действий"
                            minHeight={70}
                          />
                      </div>
                    </div>
                ))}
                </div>
                
                {data.processSteps.length < 8 ? (
                    <button onClick={() => updateField('processSteps', [...data.processSteps, { title: '', description: '' }])} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-2 mb-8 transition">
                    <Plus className="w-5 h-5" /> Добавить этап (Макс 8)
                    </button>
                ) : (
                    <p className="text-center text-sm text-amber-600 font-bold mt-6 mb-8 bg-amber-50 py-2 rounded-lg">Достигнут лимит этапов (8 шт.)</p>
                )}
                
                <FormRow label="Схема процесса" description="Загрузите или сгенерируйте AI схему на основе описанных выше этапов.">
                <div className="flex flex-col gap-3">
                    <div className="flex bg-slate-100 p-1.5 rounded-xl w-full border border-slate-200 mb-2">
                    <button 
                        onClick={() => setProcessImageSourceType('upload')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${processImageSourceType === 'upload' ? 'bg-white text-slate-900 shadow-sm border border-gray-100' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Upload className="w-4 h-4 inline mr-2" />
                        Загрузить
                    </button>
                    <button 
                        onClick={() => setProcessImageSourceType('ai')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${processImageSourceType === 'ai' ? 'bg-white text-purple-700 shadow-sm border border-gray-100' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Sparkles className="w-4 h-4 inline mr-2" />
                        AI Генерация
                    </button>
                    </div>

                    {processImageSourceType === 'upload' ? (
                    <div className="p-1 border-2 border-dashed border-slate-300 rounded-xl hover:bg-slate-50 transition relative h-20 flex items-center justify-center cursor-pointer">
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload('processImage', e)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"/>
                        <div className="flex items-center gap-3 text-slate-500">
                            <ImageIcon className="w-5 h-5"/>
                            <span className="font-medium text-sm">Нажмите для загрузки файла</span>
                        </div>
                    </div>
                    ) : (
                    <button 
                        onClick={handleGenerateProcessImage}
                        disabled={isProcessImageGenerating || data.processSteps.length === 0}
                        className="bg-purple-600 text-white w-full py-4 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-2"
                        >
                        {isProcessImageGenerating ? <span className="animate-pulse">Рисую схему...</span> : <><Sparkles className="w-4 h-4"/> Сгенерировать схему по этапам</>}
                        </button>
                    )}
                    
                    {data.processImage && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 h-32 relative group shadow-sm bg-slate-100">
                        <img src={data.processImage} alt="Process Preview" className="w-full h-full object-contain" />
                        <button onClick={() => updateField('processImage', null)} className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-red-500 hover:text-red-600 shadow-sm">
                            <Trash2 className="w-4 h-4"/>
                        </button>
                    </div>
                    )}
                </div>
                </FormRow>
                </>
            )}
          </section>

          {/* BLOCK 9: Tariffs */}
          <section className={SECTION_CLASSES}>
            <SectionHeader icon={DollarSign} title="9. Тарифы (Страница 4)" isVisible={data.showTariffs} onToggle={() => toggleVisibility('showTariffs')} />
            
            {data.showTariffs && (
                <div className="space-y-8">
                {data.tariffs.map((t, idx) => (
                <div key={idx} className="border border-slate-200 rounded-2xl p-6 bg-slate-50 relative shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div className="px-3 py-1 bg-slate-200 rounded-lg text-xs font-bold text-slate-600 uppercase tracking-widest">Тариф {idx + 1}</div>
                    </div>
                    
                    <div className="space-y-5">
                    <div className="flex flex-col gap-4">
                        <div className="w-full">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Название</label>
                            <input value={t.title} onChange={(e) => {
                                const newTariffs = [...data.tariffs];
                                newTariffs[idx].title = e.target.value;
                                updateField('tariffs', newTariffs);
                            }} className={INPUT_CLASSES} placeholder="Напр: Базовый" />
                        </div>
                        <div className="w-full">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Цена</label>
                            <input value={t.price} onChange={(e) => {
                                const newTariffs = [...data.tariffs];
                                newTariffs[idx].price = e.target.value;
                                updateField('tariffs', newTariffs);
                            }} className={`${INPUT_CLASSES} font-bold text-blue-600`} />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Услуга (Подзаголовок)</label>
                        <input value={t.serviceName} onChange={(e) => {
                            const newTariffs = [...data.tariffs];
                            newTariffs[idx].serviceName = e.target.value;
                            updateField('tariffs', newTariffs);
                        }} className={`${INPUT_CLASSES} font-bold`} />
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Что входит (каждый пункт с новой строки)</label>
                        <AutoResizingTextarea 
                          value={t.features.join('\n')} 
                          onChange={(e: any) => {
                            const newTariffs = [...data.tariffs];
                            newTariffs[idx].features = e.target.value.split('\n');
                            updateField('tariffs', newTariffs);
                          }} 
                          className={INPUT_CLASSES} 
                          placeholder="Аудит&#10;Настройка&#10;Отчет..."
                          minHeight={100}
                        />
                    </div>
                    </div>
                </div>
                ))}
                </div>
            )}
          </section>

          {/* BLOCK Gallery (New) */}
          <section className={SECTION_CLASSES}>
            <SectionHeader icon={Camera} title="10. Фотогалерея (Страница 5)" isVisible={data.showGallery} onToggle={() => toggleVisibility('showGallery')} />
            {data.showGallery && (
                <>
                <FormRow label="Заголовок" description="Название раздела с фотографиями.">
                    <input 
                        value={data.galleryTitle} 
                        onChange={(e) => updateField('galleryTitle', e.target.value)}
                        className={`${INPUT_CLASSES} font-bold`} 
                        placeholder="Реализованные проекты"
                    />
                </FormRow>

                <FormRow label="Загрузка фото" description="Загрузите фотографии (до 6 шт).">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {data.galleryImages.map((img, idx) => (
                                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 group bg-white shadow-sm">
                                    <img src={img} className="w-full h-full object-cover" alt={`gallery-${idx}`} />
                                    <button 
                                        onClick={() => removeGalleryImage(idx)}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Удалить фото"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {data.galleryImages.length < 6 && (
                                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition aspect-video bg-white">
                                    <Plus className="w-8 h-8 text-slate-300 mb-1" />
                                    <span className="text-xs font-bold text-slate-400">Добавить</span>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        multiple 
                                        onChange={handleGalleryUpload} 
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                        {data.galleryImages.length >= 6 && <p className="text-xs text-amber-600 font-bold bg-amber-50 p-2 rounded">Максимум 6 фотографий</p>}
                    </div>
                </FormRow>
                </>
            )}
          </section>

          {/* BLOCK 10: Bonuses & Company Info (Final) */}
          <section className={SECTION_CLASSES}>
             <SectionHeader icon={Building2} title="11. О Компании и Финал" isVisible={data.showFooter} onToggle={() => toggleVisibility('showFooter')} />
             
             {data.showFooter && (
                <>
                 <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-blue-600"/> Подробно о компании</h3>

                <FormRow label="Фото компании/офиса" description="Загрузите фото команды или офиса для левой части блока.">
                     <div className="flex bg-slate-100 p-1.5 rounded-xl w-full border border-slate-200 mb-2">
                         <button onClick={() => setFooterImageSourceType('upload')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${footerImageSourceType === 'upload' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>Загрузить</button>
                         {/* AI not implemented for this specifically in state logic above but UI placeholder */}
                         {/* <button onClick={() => setFooterImageSourceType('ai')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${footerImageSourceType === 'ai' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>AI</button> */}
                     </div>
                     <div className="relative h-40 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition flex items-center justify-center overflow-hidden">
                         {data.companyFooterImage ? (
                             <img src={data.companyFooterImage} className="w-full h-full object-cover opacity-80" alt="Footer Preview" />
                         ) : (
                             <div className="flex flex-col items-center text-slate-400">
                                 <ImageIcon className="w-8 h-8 mb-2"/>
                                 <span className="text-xs font-bold">Нажмите для загрузки</span>
                             </div>
                         )}
                         <input type="file" accept="image/*" onChange={(e) => handleImageUpload('companyFooterImage', e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                         {data.companyFooterImage && <button onClick={(e) => {e.preventDefault(); updateField('companyFooterImage', null)}} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow text-red-500"><Trash2 className="w-4 h-4"/></button>}
                     </div>
                </FormRow>

                <FormRow label="Описание компании" description="Расскажите о себе: опыт, миссия, чем занимаетесь.">
                    <AutoResizingTextarea
                        value={data.companyDescription}
                        onChange={(e: any) => updateField('companyDescription', e.target.value)}
                        className={INPUT_CLASSES}
                        placeholder="Мы работаем с 2010 года..."
                        minHeight={100}
                    />
                </FormRow>

                <FormRow label="Цифры и факты" description="4 ключевых показателя.">
                    <label className="flex items-center gap-2 mb-4 cursor-pointer">
                        <input type="checkbox" checked={data.showCompanyStats} onChange={(e) => updateField('showCompanyStats', e.target.checked)} className="w-5 h-5 text-blue-600 rounded" />
                        <span className="text-sm font-bold text-slate-700">Показывать цифры</span>
                    </label>
                    {data.showCompanyStats && (
                        <div className="grid grid-cols-2 gap-4">
                            {data.companyStats.map((stat, idx) => (
                                <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <input 
                                        value={stat.value} 
                                        onChange={(e) => {
                                            const newStats = [...data.companyStats];
                                            newStats[idx].value = e.target.value;
                                            updateField('companyStats', newStats);
                                        }}
                                        className="w-full bg-transparent font-black text-xl text-blue-600 mb-1 outline-none placeholder-blue-300"
                                        placeholder="100+"
                                    />
                                    <input 
                                        value={stat.label} 
                                        onChange={(e) => {
                                            const newStats = [...data.companyStats];
                                            newStats[idx].label = e.target.value;
                                            updateField('companyStats', newStats);
                                        }}
                                        className="w-full bg-transparent text-xs font-bold text-slate-500 uppercase outline-none placeholder-slate-300"
                                        placeholder="Проектов"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </FormRow>

                <hr className="my-8 border-slate-200" />
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Gift className="w-5 h-5 text-purple-600"/> Бонусы и CTA</h3>

                <FormRow label="Бонус" description="Что клиент получит бесплатно при заказе?" vertical={true}>
                    <input value={data.bonuses} onChange={(e) => updateField('bonuses', e.target.value)} className={INPUT_CLASSES} placeholder="Бесплатная консультация..." />
                </FormRow>
                
                <FormRow label="CTA (Призыв)" description="Финальная фраза, побуждающая к действию." vertical={true}>
                    <input value={data.ctaText} onChange={(e) => updateField('ctaText', e.target.value)} className={`${INPUT_CLASSES} font-bold`} />
                </FormRow>

                <FormRow label="Контакты (Действие)" description="Основной контакт для кнопки связи." vertical={true}>
                    <input value={data.contactInfo} onChange={(e) => updateField('contactInfo', e.target.value)} className={INPUT_CLASSES} />
                </FormRow>

                </>
             )}
          </section>
        </div>
      </div>

      {/* RIGHT PANEL: PREVIEW */}
      <div className="w-full lg:w-1/2 bg-slate-200 h-screen overflow-hidden relative flex flex-col">
        
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center z-20 shadow-sm">
           <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-700 hidden sm:inline uppercase tracking-wide">Предпросмотр</span>
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
                 <button onClick={() => setPreviewScale(s => Math.max(0.4, s - 0.1))} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-md text-slate-600 transition shadow-sm">-</button>
                 <span className="text-xs w-10 text-center font-mono font-bold text-slate-700">{Math.round(previewScale * 100)}%</span>
                 <button onClick={() => setPreviewScale(s => Math.min(1.5, s + 0.1))} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-md text-slate-600 transition shadow-sm">+</button>
              </div>
           </div>
           <button 
             id="btn-download"
             onClick={downloadPDF}
             disabled={isPdfGenerating}
             className="bg-slate-900 hover:bg-blue-600 disabled:bg-slate-400 text-white px-5 py-2.5 rounded-xl flex items-center gap-2.5 font-bold transition shadow-lg shadow-slate-300 hover:shadow-blue-200 active:scale-95"
           >
             <Download className="w-4 h-4" /> {isPdfGenerating ? 'Генерация...' : 'Скачать PDF'}
           </button>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-auto p-8 flex justify-center bg-slate-300 custom-scrollbar">
           <div 
             style={{ 
               transform: `scale(${previewScale})`, 
               transformOrigin: 'top center',
               transition: 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
               marginTop: '20px',
               marginBottom: '100px'
             }}
           >
             <Preview data={data} id="kp-preview" />
           </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
          border: 3px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>
    </div>
  );
}