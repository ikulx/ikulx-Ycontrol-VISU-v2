
import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: '192.168.10.31',
  user: 'Ygnis',
  password: 'Ygnis6017',
  database: 'Ycontrol',
  connectionLimit: 10
})

export default  pool ;