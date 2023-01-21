const keys = require("./keys");

const express = require("express");
const cors = require("cors"); // allows us to make requests to different domains hence, redis
const app = express();

app.use(cors());
app.use(express.json());

// connect to postgres
const { Pool } = require("pg");
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
});

pgClient.on("connect", (client) => {
    client.query("CREATE TABLE IF NOT EXISTS values (number INT)")
        .catch((err) => console.error(err));
});

// connect to redis
const redis = require("redis");
const redisClient = redis.createClient({
    host: keys.pgHost,
    port: keys.pgPort,
    retry_strategy: () => 1000
});

const publisher = redisClient.duplicate();

app.get("/", (req, res) => {
    res.send("Hi");
});

app.get("/values/all", async (req, res) => {
    const values = await pgClient.query("SELECT * FROM values");
    res.send(values.rows);
});

app.get("/values/current", async (req, res) => {
    redisClient.hgetall('values', (err, values) => {
        res.send(values);
    });
});

app.post("/values", async (req, res) => {
    const index = req.body.index;
    if (parseInt(index) > 40) {
        return res.status(422).send("Index too high");
    }

    redisClient.hset("values", index, "Nothing yet");
    publisher.publish("insert", index);
    pgClient.query("INSERT INTO values(number) VALUES($1)", [index]);
    res.send({ working: true });
});

app.listen(5000, () => console.log("Listening on port 5000"))






