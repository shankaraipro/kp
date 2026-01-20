export interface Metric {
  indicator: string;
  current: string;
  future: string;
  cause: string;
}

export interface CaseStudy {
  title: string;
  description: string;
}

export interface Review {
  author: string;
  role: string;
  text: string;
  imageUrl?: string; // For uploaded photo
}

export interface Step {
  title: string;
  description: string;
}

export interface Tariff {
  title: string;
  serviceName: string;
  price: string;
  features: string[];
}

export interface CompanyStat {
  value: string;
  label: string;
}

export interface ProposalData {
  // Theme
  themeColor: string;

  // Visibility Flags
  showContext: boolean;
  showSolution: boolean;
  showMetrics: boolean;
  showCases: boolean;
  showReviews: boolean;
  showProcess: boolean;
  showTariffs: boolean;
  showGallery: boolean; // New flag
  showFooter: boolean;

  // Block 0: Company Info
  noLogo: boolean; // Checkbox state
  companyLogo: string | null;
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;

  // Block 1: Offer
  offerTitle: string;
  offerSubtitle: string;

  // Block 2: Image
  mainImage: string | null;

  // Block 3: Context
  currentSituation: string;
  clientRequest: string;

  // Block 4: Solution
  solutionTitle: string;
  solutionDescription: string;

  // Block 5: Changes (Table)
  metrics: Metric[];

  // Block 6: Cases
  casesTitle: string;
  cases: CaseStudy[];

  // Block 7: Reviews
  reviews: Review[];

  // Block 8: Process
  processTitle: string;
  processSteps: Step[];
  processImage: string | null;

  // Block 9: Tariffs
  tariffs: Tariff[];

  // Block Gallery (New)
  galleryTitle: string;
  galleryImages: string[];

  // Block 10: Bonuses & CTA
  bonuses: string;
  ctaText: string;
  contactInfo: string;
  
  // Footer Company Info (New)
  companyFooterImage: string | null;
  companyDescription: string;
  showCompanyStats: boolean;
  companyStats: CompanyStat[];
}

export const INITIAL_DATA: ProposalData = {
  themeColor: "#2563eb", // Default Blue
  
  // Visibility Defaults
  showContext: true,
  showSolution: true,
  showMetrics: true,
  showCases: true,
  showReviews: true,
  showProcess: true,
  showTariffs: true,
  showGallery: false, // New page hidden by default
  showFooter: true,

  noLogo: false,
  companyLogo: null,
  companyName: "Digital Agency",
  companyPhone: "+7 (999) 123-45-67",
  companyEmail: "hello@digital.agency",
  companyWebsite: "www.digital.agency",
  offerTitle: "Коммерческое Предложение",
  offerSubtitle: "Стратегия роста вашего бизнеса в 2024 году",
  mainImage: "https://picsum.photos/800/400",
  currentSituation: "Вы сталкиваетесь с высокой конкуренцией и снижением конверсии в продажах.",
  clientRequest: "Необходимо увеличить объем продаж на 30% и автоматизировать процессы.",
  solutionTitle: "Комплексный маркетинг и автоматизация",
  solutionDescription: "Мы внедрим CRM-систему и запустим таргетированную рекламу для привлечения целевых лидов.",
  metrics: [
    { indicator: "Количество лидов", current: "100 заявок/мес", future: "300 заявок/мес", cause: "Новые каналы трафика" },
    { indicator: "Конверсия в продажу", current: "15%", future: "25%", cause: "Внедрение скриптов" },
  ],
  casesTitle: "Наши успешные кейсы",
  cases: [
    { title: "Компания А", description: "Увеличили выручку в 2 раза за 3 месяца." },
    { title: "Стартап Б", description: "Привлекли 10,000 пользователей на старте." },
    { title: "Завод В", description: "Оптимизировали расходы на логистику на 20%." },
  ],
  reviews: [
    { author: "Иван Иванов", role: "CEO TechCorp", text: "Отличная работа, результаты превзошли ожидания." },
  ],
  processTitle: "Как мы будем достигать результата",
  processSteps: [
    { title: "Анализ", description: "Аудит текущих процессов." },
    { title: "Стратегия", description: "Разработка плана действий." },
    { title: "Внедрение", description: "Техническая реализация." },
  ],
  processImage: null, // Removed by default
  tariffs: [
    { title: "Базовый", serviceName: "Консультация", price: "50 000 ₽", features: ["Аудит", "Отчет"] },
    { title: "Стандарт", serviceName: "Внедрение", price: "150 000 ₽", features: ["Аудит", "Настройка", "Обучение"] },
    { title: "PRO", serviceName: "Сопровождение", price: "300 000 ₽", features: ["Все включено", "Поддержка 24/7", "Личный менеджер"] },
  ],
  galleryTitle: "Фотоотчет",
  galleryImages: [],
  bonuses: "Бесплатная настройка аналитики при оплате за 3 месяца.",
  ctaText: "Готовы начать? Свяжитесь с нами сегодня!",
  contactInfo: "+7 (999) 000-00-00",
  
  // Footer Company Info Defaults
  companyFooterImage: "https://picsum.photos/600/600",
  companyDescription: "Мы — команда экспертов с 10-летним опытом в сфере цифровизации бизнеса. Мы помогаем компаниям масштабироваться, внедряя передовые IT-решения и маркетинговые стратегии.",
  showCompanyStats: true,
  companyStats: [
    { value: "10+", label: "Лет на рынке" },
    { value: "500+", label: "Успешных проектов" },
    { value: "50", label: "Экспертов в штате" },
    { value: "24/7", label: "Поддержка клиентов" }
  ]
};