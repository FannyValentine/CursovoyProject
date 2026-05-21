// Данные книг
const booksData = [
    { title: "Мастер и Маргарита", 
     author: "М. Булгаков", 
     price: 349, 
     rentPrice: 99, 
     cover: "https://imo10.labirint.ru/books/1004277/ph_01.jpg/484-0" 
    },
    { title: "1984", 
     author: "Дж. Оруэлл", 
     price: 299, 
     rentPrice: 89, 
     cover: "https://imo10.labirint.ru/books/1004277/ph_01.jpg/484-0" 
    },
    { title: "Атлант расправил плечи", 
     author: "А. Рэнд", 
     price: 599, 
     rentPrice: 149, 
     cover: "https://imo10.labirint.ru/books/1004277/ph_01.jpg/484-0" 
    },
    { title: "Маленькая жизнь", 
     author: "Х. Янагихара", 
     price: 499, 
     rentPrice: 129, 
     cover: "https://imo10.labirint.ru/books/1004277/ph_01.jpg/484-0" 
    },
    { title: "Дюна", 
     author: "Ф. Герберт", 
     price: 449, 
     rentPrice: 119, 
     cover: "https://imo10.labirint.ru/books/1004277/ph_01.jpg/484-0" 
    },
    { title: "Преступление и наказание", 
     author: "Ф. Достоевский", 
     price: 279, 
     rentPrice: 79, 
     cover: "https://imo10.labirint.ru/books/1004277/ph_01.jpg/484-0" 
    },
    { title: "Гарри Поттер и философский камень", 
     author: "Дж. Роулинг", 
     price: 399, 
     rentPrice: 109, 
     cover: "https://imo10.labirint.ru/books/1004277/ph_01.jpg/484-0" 
    },
    { title: "Хребты Безумия", 
     author: "Лав Крафт", 
     price: 699, 
     rentPrice: 209, 
     cover: "https://imo10.labirint.ru/books/1004277/ph_01.jpg/484-0" },
    { title: "Первому Игроку Подготовиться", 
     author: "Ран Долфин", 
     price: 299, 
     rentPrice: 99, 
     cover: "https://imo10.labirint.ru/books/1004277/ph_01.jpg/484-0" },
    { title: "Дон Ки Хот", 
     author: "Луиз Де Мартье", 
     price: 199, 
     rentPrice: 99, 
     cover: "https://imo10.labirint.ru/books/1004277/ph_01.jpg/484-0" 
    }
];

function renderBooks() {
    const container = document.getElementById('booksGrid');
    if (!container) return;
    
    container.innerHTML = booksData.map(book => `
        <div class="book-card">
            <div class="book-cover">
                <img src="${book.cover}" alt="${book.title}" 
                     onerror="this.src='https://placehold.co/300x400/e2e8f0/1e3c3a?text=📖+No+Cover'">
            </div>
            <div class="book-info">
                <div class="book-title">${book.title}</div>
                <div class="book-author">${book.author}</div>
                <div class="book-actions">
                    <span class="price">${book.price} ₽</span>
                    <div>
                        <button class="rent-btn" data-title="${book.title}" data-price="${book.rentPrice}">Аренда</button>
                        <button class="buy-btn" data-title="${book.title}" data-price="${book.price}">Купить</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.rent-btn, .buy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const title = btn.getAttribute('data-title');
            const price = btn.getAttribute('data-price');
            const action = btn.classList.contains('rent-btn') ? 'аренду' : 'покупку';
            alert(`✅ Книга "${title}" добавлена для ${action} за ${price} ₽`);
            updateCartBadge();
        });
    });
}

function updateCartBadge() {
    const badge = document.querySelector('.cart-badge');
    if (badge) {
        let current = parseInt(badge.innerText) || 0;
        badge.innerText = current + 1;
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
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.book-card');
            cards.forEach(card => {
                const title = card.querySelector('.book-title')?.innerText.toLowerCase() || '';
                const author = card.querySelector('.book-author')?.innerText.toLowerCase() || '';
                if (title.includes(query) || author.includes(query)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
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
                actions.style.position = 'absolute';
                actions.style.top = '200px';
                actions.style.left = '0';
                actions.style.width = '100%';
                actions.style.justifyContent = 'center';
                actions.style.backgroundColor = 'white';
                actions.style.padding = '16px';
                isOpen = true;
            } else {
                nav.style.display = '';
                actions.style.display = '';
                nav.style = '';
                actions.style = '';
                isOpen = false;
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderBooks();
    setupSearch();
    mobileMenu();
    
    const cartBtn = document.querySelector('.cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', () => alert('🛒 Корзина: пока пуста. Добавьте книгу!'));
    }
    
    const loginBtn = document.querySelector('.btn-outline');
    if (loginBtn && loginBtn.innerText.includes('Войти')) {
        loginBtn.addEventListener('click', () => alert('🔐 Форма входа будет доступна в ближайшее время'));
    }
});
