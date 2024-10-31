import mysql from 'mysql2/promise';

export const db = mysql.createPool({
  host: '192.168.10.31',
  user: 'Ygnis',
  password: 'Ygnis6017',
  database: 'Ycontrol',
});
