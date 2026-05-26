import postgres from 'postgres'

const connectionString = process.env.sb_publishable_q9Xkj9pT4-mpSK-JrX0G_w_Mxygd0ti
const sql = postgres(connectionString)

export default sql