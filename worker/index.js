const keys = require("./keys");
const redis = require("redis");

const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});

const subscription = redisClient.duplicate();

function fib(n) {
    if (n == 0) {
        return 0;
    }
    if (n == 1) {
        return 1;
    }
    if (n == 2) {
        return 2;
    }
    return fib(n - 1) + fib(n - 1);
}

// if we get a new message(a new n) run fib
subscription.on("message", (channel, message) => {
    redisClient.hset("values", message, fib(parseInt(message)));
});

subscription.subscribe("insert");






