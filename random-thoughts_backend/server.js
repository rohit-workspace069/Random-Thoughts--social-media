import express from 'express';
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";
import cors from 'cors';


const app = express();
app.use(cors());

env.config();
const port = process.env.PORT;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});
db.connect();

app.get("/api/allpost", async (req, res) => {
    try {
        const posts = await db.query(
            "SELECT * FROM public.allpost_detail ;"
        );
        res.json(posts.rows);
    } catch (error) {
        console.error('Error Getting Post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const data = await db.query(
            "SELECT password FROM users_detail WHERE  email=$1 ;",
            [email]
        );
        if (data.rows.length > 0) {
            if (data.rows[0].password === password) {
                res.json({ message: "correct password" });
            }
            else {
                res.json({ message: "Wrong password" });
            }
        } else {
            res.json({ message: "Account not exist, Try SignUp" });
        }

    } catch (error) {
        console.error('Error Login:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post("/api/register", async (req, res) => {
    const data = req.body;

    try {
        const returnData = await db.query(
            "SELECT password FROM users_detail WHERE  email=$1 ;",
            [data.email]
        );
        if (returnData.rows.length > 0) {
            res.json({ message: "Account already exist, Try Login" });
        } else {
            try {
                await db.query(
                    "INSERT INTO users_detail (full_name, username,email,password) VALUES ($1, $2,$3,$4)",
                    [data.name, data.username, data.email, data.password]
                );
                res.json({ message: "Registraion Done successfully!" });

            } catch (error) {
                console.error('Error Registraion:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    } catch (error) {
        console.error('Error Registraion:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});