// ========== КОНФИГУРАЦИЯ ==========
// URL вашего бэкенда (Node.js сервер)
const API_URL = 'http://localhost:5000/api';

// ========== ФУНКЦИИ РАБОТЫ С БЭКЕНДОМ ==========
async function loadBooksFromBackend() {
    try {
        const response = await fetch(`${API_URL}/books`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const books = await response.json();
        console.log(`✅ Загружено ${books.length} книг с сервера`);
        return books || [];
    } catch (error) {
        console.error('Ошибка загрузки книг:', error);
        return [];
    }
}
const dbConfig = {
    server: process.env.DB_SERVER || 'localhost',
    options: {
        port: parseInt(process.env.DB_PORT) || 1433,
        database: process.env.DB_NAME || 'Ebook_service',
        encrypt: false,
        trustServerCertificate: true,
        trustedConnection: true,     // ← Включаем Windows аутентификацию
        connectTimeout: 30000,
        requestTimeout: 30000
    }
};
async function loadPopularBooksFromBackend() {
    try {
        const response = await fetch(`${API_URL}/books/popular`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const books = await response.json();
        console.log(`✅ Загружено ${books.length} популярных книг`);
        return books || [];
    } catch (error) {
        console.error('Ошибка загрузки популярных книг:', error);
        return [];
    }
}

async function searchBooksInBackend(query) {
    if (!query || query.length < 2) {
        return await loadBooksFromBackend();
    }
    
    try {
        const response = await fetch(`${API_URL}/books/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const books = await response.json();
        console.log(`✅ Найдено ${books.length} книг по запросу "${query}"`);
        return books || [];
    } catch (error) {
        console.error('Ошибка поиска:', error);
        return [];
    }
}

// ========== ФУНКЦИИ ОТРИСОВКИ ==========
function renderBooks(books, containerId = 'booksGrid') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!books || books.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px;">📚 Книги не найдены</div>';
        return;
    }
    
    container.innerHTML = books.map(book => `
        <div class="book-card" data-id="${book.id}">
            <div class="book-cover">
                <img src="${book.cover_image || 'https://placehold.co/300x400/e2e8f0/1e3c3a?text=📖+No+Cover'}" 
                     alt="${book.title}" 
                     onerror="this.src='https://placehold.co/300x400/e2e8f0/1e3c3a?text=📖+No+Cover'">
            </div>
            <div class="book-info">
                <div class="book-title">${escapeHtml(book.title)}</div>
                <div class="book-author">${escapeHtml(book.author)}</div>
                <div class="book-description">${book.description ? escapeHtml(book.description.substring(0, 80)) + '...' : ''}</div>
                <div class="book-actions">
                    <div class="price-group">
                        <span class="price">${book.purchase_price} ₽</span>
                        <span class="rent-price">${book.rent_price} ₽/аренда</span>
                    </div>
                    <div class="button-group">
                        <button class="rent-btn" data-id="${book.id}" data-title="${escapeHtml(book.title)}" data-price="${book.rent_price}">Арендовать</button>
                        <button class="buy-btn" data-id="${book.id}" data-title="${escapeHtml(book.title)}" data-price="${book.purchase_price}">Купить</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Добавляем обработчики для кнопок
    attachButtonHandlers(containerId);
}

function renderPopularBooks(books) {
    const container = document.getElementById('popularBooksGrid');
    if (!container) return;
    
    if (!books || books.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px;">⭐ Популярные книги не найдены</div>';
        return;
    }
    
    container.innerHTML = books.map(book => `
        <div class="book-card popular-card" data-id="${book.id}">
            <div class="book-cover">
                <img src="${book.cover_image || 'https://placehold.co/300x400/e2e8f0/1e3c3a?text=📖+No+Cover'}" 
                     alt="${book.title}" 
                     onerror="this.src='https://placehold.co/300x400/e2e8f0/1e3c3a?text=📖+No+Cover'">
                <div class="popular-badge">🔥 Популярное</div>
            </div>
            <div class="book-info">
                <div class="book-title">${escapeHtml(book.title)}</div>
                <div class="book-author">${escapeHtml(book.author)}</div>
                <div class="book-description">${book.description ? escapeHtml(book.description.substring(0, 80)) + '...' : ''}</div>
                <div class="book-actions">
                    <span class="price">${book.purchase_price} ₽</span>
                    <div>
                        <button class="rent-btn" data-id="${book.id}" data-title="${escapeHtml(book.title)}" data-price="${book.rent_price}">Аренда ${book.rent_price} ₽</button>
                        <button class="buy-btn" data-id="${book.id}" data-title="${escapeHtml(book.title)}" data-price="${book.purchase_price}">Купить</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    attachButtonHandlers('popularBooksGrid');
}

function attachButtonHandlers(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.querySelectorAll('.rent-btn, .buy-btn').forEach(btn => {
        // Убираем старые обработчики, чтобы не было дублирования
        btn.removeEventListener('click', handleBookAction);
        btn.addEventListener('click', handleBookAction);
    });
}

function handleBookAction(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const bookId = btn.getAttribute('data-id');
    const title = btn.getAttribute('data-title');
    const price = btn.getAttribute('data-price');
    const action = btn.classList.contains('rent-btn') ? 'аренду' : 'покупку';
    
    alert(`✅ Книга "${title}" добавлена для ${action} за ${price} ₽`);
    updateCartBadge();
    
    // Здесь можно добавить реальное добавление в корзину через API
    // addToCart(bookId, title, price, action);
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function updateCartBadge() {
    const badge = document.querySelector('.cart-badge');
    if (badge) {
        let current = parseInt(badge.innerText) || 0;
        badge.innerText = current + 1;
        
        // Анимация
        badge.style.transform = 'scale(1.2)';
        setTimeout(() => {
            badge.style.transform = 'scale(1)';
        }, 200);
    }
}

function setupSearch() {
    const searchToggle = document.getElementById('searchToggle');
    const searchBar = document.getElementById('searchBar');
    const searchInput = document.getElementById('searchInput');
    
    if (searchToggle && searchBar) {
        searchToggle.addEventListener('click', () => {
            searchBar.classList.toggle('open');
            if (searchBar.classList.contains('open')) {
                searchInput?.focus();
            }
        });
    }
    
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', async (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value;
            
            // Показываем индикатор загрузки
            const booksGrid = document.getElementById('booksGrid');
            if (booksGrid && query.length >= 2) {
                booksGrid.innerHTML = '<div style="text-align: center; padding: 40px;">🔍 Поиск...</div>';
            }
            
            searchTimeout = setTimeout(async () => {
                const books = await searchBooksInBackend(query);
                renderBooks(books);
            }, 500);
        });
    }
}

function mobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const nav = document.querySelector('.nav');
    const actions = document.querySelector('.header-actions');
    
    if (btn && nav && actions) {
        let isOpen = false;
        btn.addEventListener('click', () => {
            if (!isOpen) {
                nav.style.display = 'flex';
                actions.style.display = 'flex';
                nav.style.flexDirection = 'column';
                nav.style.position = 'absolute';
                nav.style.top = '70px';
                nav.style.left = '0';
                nav.style.width = '100%';
                nav.style.backgroundColor = 'white';
                nav.style.padding = '20px';
                nav.style.gap = '16px';
                nav.style.zIndex = '1000';
                nav.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                
                actions.style.position = 'absolute';
                actions.style.top = '200px';
                actions.style.left = '0';
                actions.style.width = '100%';
                actions.style.justifyContent = 'center';
                actions.style.backgroundColor = 'white';
                actions.style.padding = '16px';
                actions.style.zIndex = '1000';
                
                isOpen = true;
            } else {
                nav.style.display = '';
                actions.style.display = '';
                nav.style.cssText = '';
                actions.style.cssText = '';
                isOpen = false;
            }
        });
    }
}

// Проверка подключения к серверу
async function checkServerConnection() {
    try {
        const response = await fetch('http://localhost:5000/api/health');
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Сервер доступен:', data);
            return true;
        }
    } catch (error) {
        console.error('❌ Сервер недоступен:', error.message);
        return false;
    }
}

// ========== ЗАПУСК ПРИ ЗАГРУЗКЕ СТРАНИЦЫ ==========
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📚 Ebook: Загрузка данных из SQL Server...');
    
    // Проверяем подключение к серверу
    const serverAvailable = await checkServerConnection();
    
    if (!serverAvailable) {
        const message = '❌ Сервер не запущен!\n\nЗапустите бэкенд командой:\ncd backend\nnode server.js';
        console.error(message);
        
        const booksGrid = document.getElementById('booksGrid');
        if (booksGrid) {
            booksGrid.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #e74c3c;">
                    <i class="fas fa-database" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <h3>Сервер не запущен</h3>
                    <p>Запустите бэкенд в папке backend командой: <strong>node server.js</strong></p>
                    <p>После запуска обновите страницу (F5)</p>
                </div>
            `;
        }
        
        const popularContainer = document.getElementById('popularBooksGrid');
        if (popularContainer) {
            popularContainer.innerHTML = '<div style="text-align: center; padding: 40px;">⚠️ Сервер недоступен</div>';
        }
        return;
    }
    
    // Загружаем популярные книги
    const popularContainer = document.getElementById('popularBooksGrid');
    if (popularContainer) {
        popularContainer.innerHTML = '<div style="text-align: center; padding: 40px;">📚 Загрузка популярных книг...</div>';
    }
    
    const popularBooks = await loadPopularBooksFromBackend();
    renderPopularBooks(popularBooks);
    
    // Загружаем все книги
    const booksGrid = document.getElementById('booksGrid');
    if (booksGrid) {
        booksGrid.innerHTML = '<div style="text-align: center; padding: 40px;">📚 Загрузка книг...</div>';
    }
    
    const allBooks = await loadBooksFromBackend();
    renderBooks(allBooks);
    
    // Настройка поиска и меню
    setupSearch();
    mobileMenu();
    
    // Корзина
    const cartBtn = document.querySelector('.cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            alert('🛒 Корзина\n\nЗдесь будут отображаться добавленные книги.\nФункция в разработке.');
        });
    }
    
    // Кнопка входа
    const loginBtn = document.querySelector('.btn-outline');
    if (loginBtn && loginBtn.innerText.trim() === 'Войти') {
        loginBtn.addEventListener('click', () => {
            alert('🔐 Форма входа будет доступна в ближайшее время');
        });
    }
    
    // Кнопка "Смотреть весь каталог"
    const catalogBtn = document.querySelector('.catalog-footer .btn-outline');
    if (catalogBtn) {
        catalogBtn.addEventListener('click', () => {
            alert('📚 Весь каталог будет доступен в следующей версии!');
        });
    }
    
    // Кнопка "Начать чтение"
    const startReadingBtn = document.querySelector('.btn-primary');
    if (startReadingBtn && startReadingBtn.innerText.includes('Начать чтение')) {
        startReadingBtn.addEventListener('click', () => {
            const booksSection = document.querySelector('.catalog-preview');
            if (booksSection) {
                booksSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // Кнопка "Выбрать книгу в аренду" в секции rent-cta
    const rentCtaBtn = document.querySelector('.rent-cta .btn-primary');
    if (rentCtaBtn) {
        rentCtaBtn.addEventListener('click', () => {
            const booksSection = document.querySelector('.catalog-preview');
            if (booksSection) {
                booksSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    console.log('✅ Инициализация завершена');
});