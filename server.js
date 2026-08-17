const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server);

app.use(express.static(__dirname));


// =========================
// 正在等待配對的人
// =========================

let waitingUser = null;


// =========================
// 匿名名稱
// =========================

const names = [
    "🌙 月光旅人",
    "⭐ 星星旅人",
    "🌌 夜空旅人",
    "☁️ 雲朵旅人",
    "🌿 微風旅人",
    "🌸 晚安旅人",
    "✨ 流星旅人",
    "🌊 海浪旅人"
];


function createAnonymousName() {

    const name =
        names[Math.floor(Math.random() * names.length)];

    const number =
        Math.floor(1000 + Math.random() * 9000);

    return `${name} #${number}`;

}


// =========================
// 使用者連線
// =========================

io.on("connection", (socket) => {

    console.log("有人連線了：", socket.id);


    // 每個使用者建立一個匿名名稱
    socket.anonymousName = createAnonymousName();

    console.log(
        "匿名名稱：",
        socket.anonymousName
    );


    // =========================
    // 找陌生人
    // =========================

    socket.on("findStranger", () => {

        if (waitingUser && waitingUser.connected) {

            const room =
                `room-${waitingUser.id}-${socket.id}`;


            waitingUser.join(room);
            socket.join(room);


            // 告訴雙方各自遇到誰
            waitingUser.emit(
                "matched",
                socket.anonymousName
            );

            socket.emit(
                "matched",
                waitingUser.anonymousName
            );


            console.log(
                "✨ 配對成功：",
                waitingUser.anonymousName,
                "↔",
                socket.anonymousName
            );


            waitingUser = null;

        } else {

            waitingUser = socket;

            socket.emit("waiting");

            console.log(
                "🌙 有人正在等待配對：",
                socket.anonymousName
            );

        }

    });


    // =========================
    // 傳送訊息
    // =========================

    socket.on("sendMessage", (message) => {

        const rooms = [...socket.rooms];

        rooms.forEach((room) => {

            if (room !== socket.id) {

                socket
                    .to(room)
                    .emit(
                        "receiveMessage",
                        message
                    );

            }

        });

    });


    // =========================
    // 主動離開聊天室
    // =========================

    socket.on("leaveChat", () => {

        const rooms = [...socket.rooms];

        rooms.forEach((room) => {

            if (room !== socket.id) {

                socket
                    .to(room)
                    .emit("strangerLeft");

                socket.leave(room);

            }

        });


        console.log(
            "🌙 使用者主動離開：",
            socket.anonymousName
        );

    });


    // =========================
    // 真正斷線
    // =========================

    socket.on("disconnect", () => {

        if (
            waitingUser &&
            waitingUser.id === socket.id
        ) {

            waitingUser = null;

        }


        console.log(
            "使用者離線：",
            socket.anonymousName
        );

    });

});


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

    console.log(
        "🌌 寂寞星球伺服器啟動！"
    );

    console.log(
        `伺服器埠號：${PORT}`
    );

});