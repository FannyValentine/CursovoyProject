const express = require('express');
const cors = require('cors');
const { Connection, Request, TYPES } = require('tedious');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ========== КОНФИГУРАЦИЯ - WINDOWS АУТЕНТИФИКАЦИЯ ==========
const dbConfig = {
    server: 'localhost',
    options: {
        database: 'EbookDB',
        port: 1433,
        encrypt: false,
        trustServerCertificate: true,
        trustedConnection: true,
        connectTimeout: 30000,
        requestTimeout: 30000
    }
};

console.log('🔧 Настройки подключения:');
console.log(`   Сервер: ${dbConfig.server}`);
console.log(`   БД: ${dbConfig.options.database}`);
console.log(`   Тип аутентификации: Windows (текущий пользователь)`);

// ========== ФУНКЦИЯ ЗАПРОСОВ (ОДНА ВЕРСИЯ) ==========
function executeQuery(sqlQuery, params = []) {
    return new Promise((resolve, reject) => {
        const connection = new Connection(dbConfig);
        const rows = [];
        
        connection.on('connect', (err) => {
            if (err) {
                console.error('❌ Ошибка подключения к БД:', err.message);
                reject(err);
                return;
            }
            
            console.log('✅ Подключено к SQL Server');
            
            const request = new Request(sqlQuery, (err) => {
                connection.close();
                if (err) {
                    console.error('❌ Ошибка запроса:', err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
            
            params.forEach((param) => {
                request.addParameter(param.name, param.type, param.value);
            });
            
            request.on('row', (columns) => {
                const row = {};
                columns.forEach(column => {
                    row[column.metadata.colName] = column.value;
                });
                rows.push(row);
            });
            
            connection.execSql(request);
        });
        
        connection.on('error', (err) => {
            reject(err);
        });
        
        connection.connect();
    });
}

// ========== API РОУТЫ ==========

app.get('/', (req, res) => {
    res.send(`
        <h1>📚 Ebook API Сервер</h1>
        <p>Сервер работает с SQL Server!</p>
        <ul>
            <li><a href="/api/health">/api/health</a> - Проверка БД</li>
            <li><a href="/api/books">/api/books</a> - Все книги</li>
            <li><a href="/api/books/popular">/api/books/popular</a> - Популярные книги</li>
        </ul>
    `);
});

app.get('/api/health', async (req, res) => {
    try {
        await executeQuery('SELECT 1 AS connected');
        res.json({ 
            status: 'OK', 
            database: 'connected',
            auth: 'Windows',
            user: process.env.USERNAME
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'ERROR', 
            database: 'disconnected', 
            error: error.message 
        });
    }
});

app.get('/api/books', async (req, res) => {
    try {
        const sqlQuery = `
            SELECT 
                id, title, author, description,
                purchase_price, rent_price, cover_image
            FROM books 
            ORDER BY id DESC
        `;
        
        const books = await executeQuery(sqlQuery);
        console.log(`📚 Загружено ${books.length} книг из БД`);
        res.json(books);
    } catch (error) {
        console.error('Ошибка при загрузке книг:', error.message);
        res.status(500).json({ error: 'Ошибка сервера', details: error.message });
    }
});

app.get('/api/books/popular', async (req, res) => {
    try {
        const sqlQuery = `
            SELECT TOP 4
                id, title, author, description,
                purchase_price, rent_price, cover_image
            FROM books 
            ORDER BY id DESC
        `;
        
        const books = await executeQuery(sqlQuery);
        console.log(`⭐ Загружено ${books.length} популярных книг`);
        res.json(books);
    } catch (error) {
        console.error('Ошибка при загрузке популярных книг:', error.message);
        res.status(500).json({ error: 'Ошибка сервера', details: error.message });
    }
});

app.get('/api/books/search', async (req, res) => {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
        try {
            const books = await executeQuery('SELECT id, title, author, description, purchase_price, rent_price, cover_image FROM books ORDER BY id DESC');
            return res.json(books);
        } catch (error) {
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
    }
    
    try {
        const sqlQuery = `
            SELECT 
                id, title, author, description,
                purchase_price, rent_price, cover_image
            FROM books 
            WHERE title LIKE @search OR author LIKE @search
            ORDER BY title
        `;
        
        const params = [
            { name: 'search', type: TYPES.NVarChar, value: `%${q}%` }
        ];
        
        const books = await executeQuery(sqlQuery, params);
        console.log(`🔍 Найдено ${books.length} книг по запросу "${q}"`);
        res.json(books);
    } catch (error) {
        console.error('Ошибка при поиске:', error.message);
        res.status(500).json({ error: 'Ошибка сервера', details: error.message });
    }
});

app.get('/api/books/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const sqlQuery = `
            SELECT id, title, author, description,
                   purchase_price, rent_price, cover_image
            FROM books 
            WHERE id = @id
        `;
        
        const params = [
            { name: 'id', type: TYPES.Int, value: parseInt(id) }
        ];
        
        const books = await executeQuery(sqlQuery, params);
        
        if (books.length === 0) {
            return res.status(404).json({ error: 'Книга не найдена' });
        }
        
        res.json(books[0]);
    } catch (error) {
        console.error('Ошибка при загрузке книги:', error.message);
        res.status(500).json({ error: 'Ошибка сервера', details: error.message });
    }
});

// ========== ЗАПУСК СЕРВЕРА ==========
app.listen(PORT, () => {
    console.log(`\n🚀 Сервер запущен на http://localhost:${PORT}`);
    console.log(`👤 Пользователь Windows: ${process.env.USERNAME}`);
    console.log(`📋 Доступные эндпоинты:`);
    console.log(`   • http://localhost:${PORT}/api/health`);
    console.log(`   • http://localhost:${PORT}/api/books`);
    console.log(`   • http://localhost:${PORT}/api/books/popular`);
    console.log(`   • http://localhost:${PORT}/api/books/search?q=1984\n`);
});