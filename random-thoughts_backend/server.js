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

//API request

app.get("/api/allpost", async (req, res) => {
  try {
    const posts = await db.query(
      "SELECT * FROM public.allpost_detail ORDER BY post_id DESC ;"
    );
    res.json(posts.rows);
  } catch (error) {
    console.error("Error Getting Post:", error);
    res.status(500).json({ error: "Internal Server Error" });
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

app.post("/api/login", (req, res) => {
  passport.authenticate("local", (err, user) => {
    if (err) {
      if (err === "User not found") {
        return res.json({ message: "Account not exist, Try SignUp" });
      }
      return res.json({ error: "Internal Server Error" });
    }
    if (!user) {
      return res.json({ message: "Wrong password" });
    }
    return res.json(user);
  })(req, res);
});

app.post("/api/register", async (req, res) => {
  const usersDetail = req.body;
  console.log(usersDetail);
  try {
    const returnData = await db.query(
      "SELECT * FROM users_detail WHERE email = $1",
      [usersDetail.email]
    );
    console.log(returnData.rows);
    if (returnData.rows.length > 0) {
      res.json({ message: "Account already exist, Try Login" });
    } else {
      bcrypt.hash(usersDetail.password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          const result = await db.query(
            "INSERT INTO users_detail (full_name,email,password) VALUES ($1, $2,$3) RETURNING * ;",
            [usersDetail.name, usersDetail.email, hash]
          );
          const user = result.rows[0];
          req.login(user, (err) => {
            console.log(" registration success");
            res.json(user);
          });
        }
      });
    }
  } catch (error) {
    console.error("Error Registraion:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/createpost", async (req, res) => {
  const postDetail = req.body;
  console.log(postDetail);
  try {
    const result = await db.query(
      "INSERT INTO allpost_detail (content, username) VALUES ($1, $2) RETURNING *;",
      [postDetail.content, postDetail.username]
    );
    res.json(result.rows);
  } catch (error) {
    console.log("this is point 2");
    console.error("Error Registraion:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

passport.use(
  new Strategy(async function verify(username, password, cb) {
    try {
      const data = await db.query(
        "SELECT * FROM users_detail WHERE  email=$1 ;",
        [username]
      );
      if (data.rows.length > 0) {
        const user = data.rows[0];
        const storedHashedPassword = user.password;

        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              console.log(user);
              return cb(null, user);
            } else {
              return cb(null, false);
            }
          }
        });
      } else {
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
