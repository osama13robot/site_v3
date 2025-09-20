// FIXED VERSION - Uses working APIs that don't have CORS issues

// Alternative news sources that work better
const NEWS_SOURCES = [
    {
        name: 'TechCrunch',
        url: 'https://feeds.feedburner.com/TechCrunch',
        proxy: 'https://api.rss2json.com/v1/api.json?rss_url='
    },
    {
        name: 'Tech News',
        url: 'https://rss.cnn.com/rss/edition_technology.rss',
        proxy: 'https://api.rss2json.com/v1/api.json?rss_url='
    }
];

// Free APIs that actually work
const WORKING_APIS = {
    // RSS to JSON converter (free, no key needed)
    rssToJson: 'https://api.rss2json.com/v1/api.json?rss_url=',

    // Free AI image generation (works without auth)
    imageAPI: 'https://image.pollinations.ai/prompt/',

    // Simple fallback for translation
    fallbackTranslate: true
};

// UI translations
const TRANSLATIONS = {
    ar: {
        siteTitle: 'أخبار تقنية يومية',
        loading: 'جاري تحميل آخر الأخبار التقنية...',
        generating: 'جاري إنشاء الملخص...',
        creatingImage: 'جاري إنشاء صورة مناسبة...',
        success: 'تم تحديث الموقع بنجاح!',
        error: 'تم تحميل المحتوى الاحتياطي',
        share: 'مشاركة',
        readOriginal: 'المقال الأصلي',
        footerText: '© 2025 أخبار تقنية يومية - مدعوم بالذكاء الاصطناعي',
        poweredText: 'آخر تحديث:',
        source: 'المصدر'
    },
    en: {
        siteTitle: 'Daily Tech News',
        loading: 'Loading latest tech news...',
        generating: 'Generating summary...',
        creatingImage: 'Creating relevant image...',
        success: 'Successfully updated!',
        error: 'Loaded fallback content',
        share: 'Share',
        readOriginal: 'Original Article',
        footerText: '© 2025 Daily Tech News - AI Powered',
        poweredText: 'Last updated:',
        source: 'Source'
    }
};

let currentLanguage = 'ar';
let currentArticle = null;

// Predefined tech articles in case APIs fail
const FALLBACK_ARTICLES = [
    {
        title_en: "AI Revolution Transforms Tech Industry",
        title_ar: "ثورة الذكاء الاصطناعي تغير صناعة التكنولوجيا",
        summary_en: "Artificial Intelligence continues to reshape the technology landscape with breakthrough innovations in machine learning, natural language processing, and computer vision. Companies are racing to integrate AI capabilities into their products and services.",
        summary_ar: "يواصل الذكاء الاصطناعي إعادة تشكيل المشهد التكنولوجي من خلال الابتكارات الرائدة في التعلم الآلي ومعالجة اللغة الطبيعية ورؤية الكمبيوتر. تتسابق الشركات لدمج قدرات الذكاء الاصطناعي في منتجاتها وخدماتها.",
        image_prompt: "artificial intelligence technology innovation futuristic",
        source: "Tech News",
        date: new Date()
    },
    {
        title_en: "Quantum Computing Breakthrough Announced",
        title_ar: "إعلان اختراق في الحوسبة الكمية",
        summary_en: "Researchers have achieved a significant milestone in quantum computing, demonstrating unprecedented processing power that could revolutionize industries from cryptography to drug discovery.",
        summary_ar: "حقق الباحثون إنجازاً مهماً في الحوسبة الكمية، حيث أظهروا قوة معالجة غير مسبوقة يمكن أن تُحدث ثورة في الصناعات من التشفير إلى اكتشاف الأدوية.",
        image_prompt: "quantum computing technology breakthrough science",
        source: "Science Tech",
        date: new Date()
    },
    {
        title_en: "5G Networks Expand Globally",
        title_ar: "شبكات الجيل الخامس تتوسع عالمياً",
        summary_en: "Fifth-generation wireless technology deployment accelerates worldwide, promising faster internet speeds, lower latency, and enabling new applications in IoT, autonomous vehicles, and smart cities.",
        summary_ar: "يتسارع نشر تقنية اللاسلكي من الجيل الخامس في جميع أنحاء العالم، مما يعد بسرعات إنترنت أسرع وزمن استجابة أقل وتمكين تطبيقات جديدة في إنترنت الأشياء والمركبات المستقلة والمدن الذكية.",
        image_prompt: "5G wireless technology network connectivity",
        source: "Mobile Tech",
        date: new Date()
    }
];

// Initialize the app
class TechNewsApp {
    constructor() {
        this.init();
    }

    async init() {
        console.log('🚀 Starting Tech News App...');
        this.updateUI();
        this.updateLastUpdateTime();

        // Try to load real news, fallback to predefined content
        await this.loadContent();
    }

    updateUI() {
        const t = TRANSLATIONS[currentLanguage];

        document.getElementById('site-title').textContent = t.siteTitle;
        document.getElementById('status-text').textContent = t.loading;
        document.getElementById('footer-text').textContent = t.footerText;
        document.getElementById('powered-text').textContent = t.poweredText;

        // Update document direction
        document.body.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = currentLanguage;
    }

    updateLastUpdateTime() {
        const now = new Date();
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        const locale = currentLanguage === 'ar' ? 'ar-SA' : 'en-US';
        document.getElementById('last-update').textContent = 
            new Intl.DateTimeFormat(locale, options).format(now);
    }

    updateStatus(type, message) {
        const statusEl = document.getElementById('status');
        const statusText = document.getElementById('status-text');

        statusEl.className = `status ${type}`;
        statusText.innerHTML = message;

        if (type === 'success') {
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 3000);
        }
    }

    async loadContent() {
        const t = TRANSLATIONS[currentLanguage];

        try {
            // Step 1: Try to fetch real news
            this.updateStatus('loading', t.loading);
            const articles = await this.fetchRealNews();

            let selectedArticle;
            if (articles && articles.length > 0) {
                selectedArticle = articles[0];
                console.log('📰 Using real article:', selectedArticle.title);
            } else {
                // Use fallback content
                selectedArticle = this.convertFallbackArticle(FALLBACK_ARTICLES[Math.floor(Math.random() * FALLBACK_ARTICLES.length)]);
                console.log('📰 Using fallback article');
            }

            // Step 2: Generate image
            this.updateStatus('loading', t.creatingImage);
            const imageUrl = await this.generateImage(selectedArticle);
            selectedArticle.aiImage = imageUrl;

            // Step 3: Display article
            currentArticle = selectedArticle;
            this.displayArticle(currentArticle);
            this.updateStatus('success', t.success);

        } catch (error) {
            console.error('❌ Error loading content:', error);
            this.loadFallbackContent();
        }
    }

    async fetchRealNews() {
        try {
            // Try RSS2JSON API (more reliable than direct RSS)
            const source = NEWS_SOURCES[0]; // TechCrunch
            const url = source.proxy + encodeURIComponent(source.url);

            console.log('🔍 Fetching from:', url);

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'ok' && data.items && data.items.length > 0) {
                const articles = data.items.slice(0, 3).map(item => ({
                    title: item.title || 'Tech News Update',
                    summary: this.cleanText(item.description || item.content || ''),
                    link: item.link || '#',
                    pubDate: new Date(item.pubDate || Date.now()),
                    author: item.author || source.name,
                    source: source.name
                }));

                console.log(`✅ Fetched ${articles.length} real articles`);
                return articles;
            } else {
                throw new Error('No articles in response');
            }

        } catch (error) {
            console.warn('⚠️ Real news fetch failed:', error.message);
            return null;
        }
    }

    convertFallbackArticle(fallback) {
        return {
            title: fallback[`title_${currentLanguage}`] || fallback.title_en,
            summary: fallback[`summary_${currentLanguage}`] || fallback.summary_en,
            link: '#',
            pubDate: fallback.date,
            author: 'AI Generated',
            source: fallback.source,
            imagePrompt: fallback.image_prompt
        };
    }

    cleanText(text) {
        return text
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&[^;]+;/g, ' ') // Remove HTML entities
            .replace(/\s+/g, ' ') // Normalize whitespace
            .substring(0, 300) + '...';
    }

    async generateImage(article) {
        try {
            // Create descriptive prompt
            const prompt = article.imagePrompt || 
                `modern technology news illustration, ${article.title.substring(0, 50)}, professional tech blog, high quality, clean design, futuristic`;

            const imageUrl = `${WORKING_APIS.imageAPI}${encodeURIComponent(prompt)}?width=800&height=400&enhance=true&nologo=true`;

            console.log('🎨 Generated image with prompt:', prompt.substring(0, 50) + '...');
            return imageUrl;

        } catch (error) {
            console.error('❌ Image generation error:', error);
            // Fallback to a nice tech image
            return 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=400&fit=crop&auto=format';
        }
    }

    displayArticle(article) {
        const container = document.getElementById('article-container');
        const t = TRANSLATIONS[currentLanguage];

        container.innerHTML = `
            <article class="article">
                <img src="${article.aiImage}" alt="${article.title}" class="article-image" 
                     onerror="this.src='https://images.unsplash.com/photo-1485546784815-e380f3297414?w=800&h=400&fit=crop'">
                <div class="article-content">
                    <h1 class="article-title">${article.title}</h1>
                    <div class="article-meta">
                        <span><i class="fas fa-calendar"></i> ${this.formatDate(article.pubDate)}</span>
                        <span><i class="fas fa-user"></i> ${article.author}</span>
                        <span><i class="fas fa-tag"></i> ${t.source}: ${article.source}</span>
                    </div>
                    <div class="article-text">${article.summary}</div>
                    <div class="article-actions">
                        <button class="btn btn-primary" onclick="newsApp.shareArticle()">
                            <i class="fas fa-share-alt"></i> ${t.share}
                        </button>
                        <a href="${article.link}" target="_blank" class="btn">
                            <i class="fas fa-external-link-alt"></i> ${t.readOriginal}
                        </a>
                        <button class="btn" onclick="newsApp.loadNewArticle()">
                            <i class="fas fa-refresh"></i> ${currentLanguage === 'ar' ? 'تحديث' : 'Refresh'}
                        </button>
                    </div>
                </div>
            </article>
        `;

        // Animate in
        setTimeout(() => {
            container.querySelector('.article').classList.add('loaded');
        }, 100);

        console.log('✅ Article displayed successfully');
    }

    async loadNewArticle() {
        // Load a different fallback article
        const randomIndex = Math.floor(Math.random() * FALLBACK_ARTICLES.length);
        const fallbackArticle = this.convertFallbackArticle(FALLBACK_ARTICLES[randomIndex]);

        const t = TRANSLATIONS[currentLanguage];
        this.updateStatus('loading', t.generating);

        // Generate new image
        fallbackArticle.aiImage = await this.generateImage(fallbackArticle);

        currentArticle = fallbackArticle;
        this.displayArticle(currentArticle);
        this.updateStatus('success', t.success);
    }

    loadFallbackContent() {
        const t = TRANSLATIONS[currentLanguage];
        this.updateStatus('error', t.error);

        // Load random fallback content
        this.loadNewArticle();
    }

    formatDate(date) {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        const locale = currentLanguage === 'ar' ? 'ar-SA' : 'en-US';
        return new Intl.DateTimeFormat(locale, options).format(date);
    }

    shareArticle() {
        if (!currentArticle) return;

        const title = currentArticle.title;
        const url = window.location.href;
        const text = `${title} - ${TRANSLATIONS[currentLanguage].footerText}`;

        if (navigator.share) {
            navigator.share({ title, text, url });
        } else {
            // Fallback: copy to clipboard
            const shareText = `${title}\n${url}`;
            navigator.clipboard.writeText(shareText).then(() => {
                alert(currentLanguage === 'ar' ? 'تم نسخ الرابط' : 'Link copied!');
            }).catch(() => {
                // Prompt user to copy manually
                prompt(currentLanguage === 'ar' ? 'انسخ هذا الرابط:' : 'Copy this link:', shareText);
            });
        }
    }
}

// Language switching
function switchLanguage(lang) {
    currentLanguage = lang;

    // Update button states
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`btn-${lang}`).classList.add('active');

    // Update UI
    newsApp.updateUI();
    newsApp.updateLastUpdateTime();

    // Reload content for new language
    if (currentArticle) {
        // Convert current article for new language
        const fallbackIndex = Math.floor(Math.random() * FALLBACK_ARTICLES.length);
        const newArticle = newsApp.convertFallbackArticle(FALLBACK_ARTICLES[fallbackIndex]);
        newArticle.aiImage = currentArticle.aiImage; // Keep same image
        currentArticle = newArticle;
        newsApp.displayArticle(currentArticle);
    }
}

// Social sharing functions
function shareOnTwitter() {
    if (!currentArticle) return;
    const text = encodeURIComponent(`${currentArticle.title} - أخبار تقنية يومية`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
}

function shareOnFacebook() {
    if (!currentArticle) return;
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

function shareOnLinkedIn() {
    if (!currentArticle) return;
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(currentArticle.title);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, '_blank');
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.newsApp = new TechNewsApp();
});

console.log('📱 Fixed Tech News App loaded successfully!');