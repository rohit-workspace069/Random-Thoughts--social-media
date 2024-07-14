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

app.post("/api/login", (req, res) => {
    try {
        console.log("request made!");
        const { email, password } = req.body;
        console.log(email);
        console.log(password);
        res.json({ message: "Login successful!" });

    } catch (error) {
        console.error('Error Login:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post("/api/register", (req, res) => {
    try {
        console.log("registration request made!");
        const data = req.body;
        console.log(data);
        res.json({ message: "Registraion Done successfully!" });

    } catch (error) {
        console.error('Error Registraion:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});