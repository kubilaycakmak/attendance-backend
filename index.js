import bodyParser from "body-parser";
import express from "express";
import dotenv from 'dotenv';
import cors from 'cors';
import header_middleware from './middleware/header.js';
import AuthRoutes from './routes/auth.js';
import UserRoutes from './routes/users.js';
import db from './db/db.js'

const app = express();
dotenv.config();

app.use(header_middleware);
app.use(bodyParser.json({ limit: "30mb", extended: true}));
app.use(bodyParser.urlencoded({limit: "30mb", extended: true}));

app.use(cors());

app.get("/health", (req, res) => {
    res.json({
        author: "admin",
        message: "server is healthy.."
    })
})

app.use("/api/auth", AuthRoutes);
app.use("/api/users", UserRoutes);

app.listen(process.env.PORT, (req, res) => {
    console.log(`app is listening to PORT ${process.env.PORT}`)
})