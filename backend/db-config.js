const { Connection } = require('tedious');
require('dotenv').config();

// Конфигурация подключения к SQL Server
const dbConfig = {
    server: process.env.DB_SERVER || 'localdb',
    authentication: {
        type: 'default'
    },
    options: {
        port: parseInt(process.env.DB_PORT) || 1433,
        database: process.env.DB_NAME || 'Ebook_service',
        encrypt: false,           // Для локальной разработки
        trustServerCertificate: true,
        connectTimeout: 30000,
        requestTimeout: 30000
    }
};

// Функция для выполнения запросов к БД
function executeQuery(sqlQuery, params = []) {
    return new Promise((resolve, reject) => {
        const connection = new Connection(dbConfig);
        const rows = [];
        
        connection.on('connect', (err) => {
            if (err) {
                reject(err);
                return;
            }
            
            const request = new (require('tedious').Request)(sqlQuery, (err) => {
                connection.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
            
            // Добавляем параметры, если есть
            params.forEach((param, index) => {
                request.addParameter(`param${index}`, param.type, param.value);
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
        
        connection.connect();
    });
}

// Функция для выполнения запросов с несколькими параметрами (INSERT, UPDATE, DELETE)
function executeNonQuery(sqlQuery, params = []) {
    return new Promise((resolve, reject) => {
        const connection = new Connection(dbConfig);
        
        connection.on('connect', (err) => {
            if (err) {
                reject(err);
                return;
            }
            
            const request = new (require('tedious').Request)(sqlQuery, (err, rowCount) => {
                connection.close();
                if (err) {
                    reject(err);
                } else {
                    resolve({ affectedRows: rowCount });
                }
            });
            
            params.forEach((param) => {
                request.addParameter(param.name, param.type, param.value);
            });
            
            connection.execSql(request);
        });
        
        connection.connect();
    });
}

module.exports = { dbConfig, executeQuery, executeNonQuery };