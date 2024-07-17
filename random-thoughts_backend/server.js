import express from 'express';
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import env from "dotenv";
import cors from 'cors';

import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";


const app = express();
app.use(cors());
env.config();

const port = process.env.SERVER_PORT;
const saltRounds = 10;

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { secure: true }
    })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

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

app.get("/api/logout", (req, res) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.json({ message: "Logout! successfully!" });
    });
});

app.post(
    "/api/login",
    (req, res, next) => {
        passport.authenticate("local", (err, user, info) => {
            console.log("this is point E");
            if (info) {
                console.log(info);
            }

            if (err) {
                if (err === "User not found") {
                    console.log("this is point I");
                    return res.status(401).json({ message: "Account not exist, Try SignUp" });
                }
                console.log("this is point F");
                return res.status(500).json({ error: "Internal Server Error" });
            }
            if (!user) {
                console.log("this is point G");
                return res.status(401).json({ message: "Wrong password" });
            }
            console.log("this is point H");
            return res.json({ message: "correct password" });
        })(req, res, next);
    });

app.post("/api/register", async (req, res) => {
    const data = req.body;
    console.log(data.email);

    try {
        const returnData = await db.query(
            "SELECT * FROM users_detail WHERE email = $1",
            [data.email]
        );
        console.log(returnData.rows);
        if (returnData.rows.length > 0) {
            res.json({ message: "Account already exist, Try Login" });
        } else {
            bcrypt.hash(data.password, saltRounds, async (err, hash) => {
                if (err) {
                    console.error("Error hashing password:", err);
                } else {
                    console.log("Hashed Password:", hash);
                    const result = await db.query(
                        "INSERT INTO users_detail (full_name, username,email,password) VALUES ($1, $2,$3,$4) RETURNING * ;",
                        [data.name, data.username, data.email, hash]
                    );
                    const user = result.rows[0];
                    req.login(user, (err) => {
                        console.log(" registration success");
                        res.json({ message: "Registraion Done successfully!" });
                    });
                }
            });
        }
    } catch (error) {
        console.error('Error Registraion:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

passport.use(
    new Strategy(async function verify(email, password, cb) {
        console.log("strategy Called for", email);
        console.log(password);
        try {
            const data = await db.query(
                "SELECT * FROM users_detail WHERE  email=$1 ;",
                [email],
            );
            console.log(data.rows);
            if (data.rows.length > 0) {
                const user = data.rows[0];
                const storedHashedPassword = user.password;

                bcrypt.compare(password, storedHashedPassword, (err, valid) => {
                    if (err) {
                        console.error("Error comparing passwords:", err);
                        console.log("this is point A");
                        return cb(err);
                    } else {
                        if (valid) {
                            console.log("this is point B");
                            console.log(user);
                            return cb(null, user);
                        } else {
                            console.log("this is point C");
                            return cb(null, false);
                        }
                    }
                });
            } else {
                console.log("this is point D");
                return cb("User not found");
            }
        } catch (err) {
            console.log(err);
        }
    })
);

passport.serializeUser((user, cb) => {
    cb(null, user);
});

passport.deserializeUser((user, cb) => {
    cb(null, user);
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});