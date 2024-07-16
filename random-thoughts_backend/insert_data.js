import pg from "pg";
import env from "dotenv";
import Post from "./posts.js";

env.config();

// PostgreSQL connection settings
const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});
db.connect();

// Insert data into the "post" table
async function insertData() {
    for (const post of Post) {
        try {
            // await db.query(
            //     "INSERT INTO allpost_detail(post_id, content, like_count, comment_count, username) VALUES ($1, $2,$3,$4,$5)",
            //     [post.id, post.content, post.like, post.commentCount, post.username],
            // );

        } catch (error) {
            console.error('Error Registraion:', error);
        }
    }
}

insertData()
    .then(() => {
        console.log('Data inserted successfully!');
    })
    .catch((err) => {
        console.error('Error inserting data:', err);
    })
    .finally(() => {
        db.end();
    });