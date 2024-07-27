import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import env from "dotenv";
import cors from "cors";

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
    cookie: { secure: true },
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

passport.use(
  new Strategy(async function verify(email, password, cb) {
    console.log("strategy Called for", email);
    console.log(password);
    try {
      const data = await db.query(
        "SELECT * FROM users_detail WHERE  email=$1 ;",
        [email]
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
