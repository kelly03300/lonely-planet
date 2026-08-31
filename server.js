const express = require("express");
const http = require("http");
const crypto = require("crypto");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true
    }
});

app.use(express.json());
app.use(express.static(__dirname));


// =========================
// 正在等待配對的人
// =========================

let waitingUser = null;


// =========================
// 目前在線使用者
// =========================

const onlineUsers = new Map();


// =========================
// 管理員設定
// =========================

const ADMIN_PASSWORD =
    process.env.ADMIN_PASSWORD || "請在Render設定管理員密碼";


// =========================
// 管理員 Session
// =========================

const adminSessions = new Map();

const SESSION_TIME =
    2 * 60 * 60 * 1000;


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
// Cookie
// =========================

function getCookie(req, name) {

    const cookies = req.headers.cookie;

    if (!cookies) {
        return null;
    }

    const parts = cookies.split(";");

    for (const part of parts) {

        const [key, ...valueParts] =
            part.trim().split("=");

        if (key === name) {

            return decodeURIComponent(
                valueParts.join("=")
            );

        }
    }

    return null;
}


// =========================
// 檢查管理員登入
// =========================

function isAdminAuthenticated(req) {

    const sessionId =
        getCookie(req, "admin_session");

    if (!sessionId) {
        return false;
    }

    const session =
        adminSessions.get(sessionId);

    if (!session) {
        return false;
    }

    if (
        Date.now() - session.createdAt >
        SESSION_TIME
    ) {

        adminSessions.delete(sessionId);

        return false;
    }

    return true;
}


// =========================
// 管理員登入
// =========================

app.post(
    "/api/admin-login",
    (req, res) => {

        const { password } =
            req.body;

        if (
            !password ||
            password !== ADMIN_PASSWORD
        ) {

            return res.status(401).json({

                success: false,

                message: "管理員密碼錯誤"

            });

        }

        const sessionId =
            crypto
                .randomBytes(32)
                .toString("hex");

        adminSessions.set(
            sessionId,
            {
                createdAt: Date.now()
            }
        );

        res.setHeader(
            "Set-Cookie",
            `admin_session=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=7200`
        );

        res.json({
            success: true
        });
    }
);


// =========================
// 管理員登出
// =========================

app.post(
    "/api/admin-logout",
    (req, res) => {

        const sessionId =
            getCookie(req, "admin_session");

        if (sessionId) {

            adminSessions.delete(
                sessionId
            );
        }

        res.setHeader(
            "Set-Cookie",
            "admin_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
        );

        res.json({
            success: true
        });
    }
);


// =========================
// 管理後台：在線人數
// =========================

app.get(
    "/api/online-users",
    (req, res) => {

        if (!isAdminAuthenticated(req)) {

            return res.status(401).json({

                success: false,

                message: "需要管理員登入"

            });
        }

        const users =
            [...onlineUsers.values()]
                .map(user => ({

                    name: user.name,

                    connectedAt:
                        user.connectedAt

                }));

        res.json({

            count: users.length,

            users

        });
    }
);


// =========================
// Socket.IO
// =========================

io.on(
    "connection",
    (socket) => {

        console.log(
            "有人連線了：",
            socket.id
        );


        // =========================
        // 建立匿名名稱
        // =========================

        socket.anonymousName =
            createAnonymousName();


        console.log(
            "匿名名稱：",
            socket.anonymousName
        );


        // =========================
        // 加入在線名單
        // =========================

        onlineUsers.set(
            socket.id,
            {
                id: socket.id,

                name:
                    socket.anonymousName,

                connectedAt:
                    new Date()
            }
        );


        console.log(
            "目前在線人數：",
            onlineUsers.size
        );


        // =========================
        // 找陌生人
        // =========================

        socket.on(
            "findStranger",
            () => {

                // 防止自己重複加入等待
                if (
                    waitingUser &&
                    waitingUser.id === socket.id
                ) {

                    return;
                }


                // 清理已經斷線的等待者
                if (
                    waitingUser &&
                    !waitingUser.connected
                ) {

                    waitingUser = null;
                }


                // =========================
                // 有人正在等待
                // =========================

                if (waitingUser) {

                    const partner =
                        waitingUser;


                    const room =
                        `room-${partner.id}-${socket.id}`;


                    // 雙方加入房間
                    partner.join(room);
                    socket.join(room);


                    // 記錄聊天室
                    partner.currentRoom =
                        room;

                    socket.currentRoom =
                        room;


                    partner.partnerId =
                        socket.id;

                    socket.partnerId =
                        partner.id;


                    // 傳送配對成功
                    partner.emit(
                        "matched",
                        socket.anonymousName
                    );

                    socket.emit(
                        "matched",
                        partner.anonymousName
                    );


                    console.log(
                        "✨ 配對成功：",
                        partner.anonymousName,
                        "↔",
                        socket.anonymousName
                    );


                    // 清除等待者
                    waitingUser = null;

                }

                // =========================
                // 沒有人等待
                // =========================

                else {

                    waitingUser = socket;

                    socket.emit(
                        "waiting"
                    );


                    console.log(
                        "🌙 有人正在等待配對：",
                        socket.anonymousName
                    );
                }

            }
        );


        // =========================
        // 傳送訊息
        // =========================

        socket.on(
            "sendMessage",
            (message) => {

                if (
                    typeof message !== "string"
                ) {
                    return;
                }


                const text =
                    message.trim();


                if (!text) {
                    return;
                }


                // 限制訊息長度
                const safeText =
                    text.slice(0, 1000);


                // 如果有目前聊天室
                if (socket.currentRoom) {

                    socket
                        .to(socket.currentRoom)
                        .emit(
                            "receiveMessage",
                            safeText
                        );

                }

            }
        );


        // =========================
        // 主動離開聊天室
        // =========================

        socket.on(
            "leaveChat",
            () => {

                leaveCurrentRoom(
                    socket,
                    true
                );

            }
        );


        // =========================
        // 斷線
        // =========================

        socket.on(
            "disconnect",
            () => {

                console.log(
                    "使用者離線：",
                    socket.anonymousName
                );


                // 如果他正在等待
                if (
                    waitingUser &&
                    waitingUser.id === socket.id
                ) {

                    waitingUser = null;
                }


                // 如果正在聊天
                leaveCurrentRoom(
                    socket,
                    false
                );


                // 從在線名單移除
                onlineUsers.delete(
                    socket.id
                );


                console.log(
                    "目前在線人數：",
                    onlineUsers.size
                );

            }
        );

    }
);


// =========================
// 離開聊天室
// =========================

function leaveCurrentRoom(
    socket,
    notifyPartner
) {

    const room =
        socket.currentRoom;


    if (!room) {
        return;
    }


    const partnerId =
        socket.partnerId;


    // 通知對方
    if (notifyPartner) {

        socket
            .to(room)
            .emit(
                "strangerLeft"
            );
    }


    // 對方離開房間
    if (partnerId) {

        const partner =
            io.sockets.sockets.get(
                partnerId
            );


        if (partner) {

            partner.leave(room);

            partner.currentRoom =
                null;

            partner.partnerId =
                null;

        }

    }


    // 自己離開
    socket.leave(room);


    socket.currentRoom =
        null;

    socket.partnerId =
        null;

}


// =========================
// 啟動伺服器
// =========================

const PORT =
    process.env.PORT || 3000;


server.listen(
    PORT,
    () => {

        console.log(
            "🌌 寂寞星球伺服器啟動！"
        );

        console.log(
            `伺服器埠號：${PORT}`
        );

    }
);
 express = require("express");
const http = require("http");
const crypto = require("crypto");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server);

app.use(express.json());
app.use(express.static(__dirname));


// =========================
// 正在等待配對的人
// =========================

let waitingUser = null;


// =========================
// 目前在線的使用者
// =========================

const onlineUsers = new Map();


// =========================
// 管理員設定
// =========================

// 真正密碼會放在 Render 的環境變數
const ADMIN_PASSWORD =
    process.env.ADMIN_PASSWORD || "請在Render設定管理員密碼";


// =========================
// 管理員登入 Session
// =========================

const adminSessions = new Map();


// Session 有效時間：2 小時
const SESSION_TIME = 2 * 60 * 60 * 1000;


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
// 取得 Cookie
// =========================

function getCookie(req, name) {

    const cookies = req.headers.cookie;

    if (!cookies) {
        return null;
    }

    const parts = cookies.split(";");

    for (const part of parts) {

        const [key, ...valueParts] =
            part.trim().split("=");

        if (key === name) {

            return decodeURIComponent(
                valueParts.join("=")
            );

        }

    }

    return null;

}


// =========================
// 檢查管理員登入
// =========================

function isAdminAuthenticated(req) {

    const sessionId =
        getCookie(req, "admin_session");

    if (!sessionId) {
        return false;
    }


    const session =
        adminSessions.get(sessionId);

    if (!session) {
        return false;
    }


    // Session 過期
    if (
        Date.now() - session.createdAt
        > SESSION_TIME
    ) {

        adminSessions.delete(sessionId);

        return false;

    }


    return true;

}


// =========================
// 管理員登入
// =========================

app.post(
    "/api/admin-login",
    (req, res) => {

        const { password } =
            req.body;


        if (
            !password ||
            password !== ADMIN_PASSWORD
        ) {

            return res.status(401).json({

                success: false,

                message: "管理員密碼錯誤"

            });

        }


        // 建立隨機 Session ID
        const sessionId =
            crypto.randomBytes(32).toString("hex");


        adminSessions.set(
            sessionId,
            {
                createdAt: Date.now()
            }
        );


        // 設定 Cookie
        res.setHeader(
            "Set-Cookie",
            `admin_session=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=7200`
        );


        res.json({
            success: true
        });

    }
);


// =========================
// 管理員登出
// =========================

app.post(
    "/api/admin-logout",
    (req, res) => {

        const sessionId =
            getCookie(req, "admin_session");


        if (sessionId) {

            adminSessions.delete(
                sessionId
            );

        }


        res.setHeader(
            "Set-Cookie",
            "admin_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
        );


        res.json({
            success: true
        });

    }
);


// =========================
// 管理後台：取得在線使用者
// =========================

app.get(
    "/api/online-users",
    (req, res) => {

        // 沒登入不能查看
        if (!isAdminAuthenticated(req)) {

            return res.status(401).json({

                success: false,

                message: "需要管理員登入"

            });

        }


        const users =
            [...onlineUsers.values()]
                .map(user => ({

                    name: user.name,

                    connectedAt:
                        user.connectedAt

                }));


        res.json({

            count: users.length,

            users: users

        });

    }
);


// =========================
// 使用者連線
// =========================

io.on("connection", (socket) => {

    console.log(
        "有人連線了：",
        socket.id
    );


    // 建立匿名名稱
    socket.anonymousName =
        createAnonymousName();


    console.log(
        "匿名名稱：",
        socket.anonymousName
    );


    // 加入在線名單
    onlineUsers.set(
        socket.id,
        {
            id: socket.id,

            name:
                socket.anonymousName,

            connectedAt:
                new Date()
        }
    );


    console.log(
        "目前在線人數：",
        onlineUsers.size
    );


    // =========================
    // 找陌生人
    // =========================

    socket.on(
        "findStranger",
        () => {

            if (
                waitingUser &&
                waitingUser.connected
            ) {

                const room =
                    `room-${waitingUser.id}-${socket.id}`;


                waitingUser.join(room);
                socket.join(room);


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

        }
    );


    // =========================
    // 傳送訊息
    // =========================

    socket.on(
        "sendMessage",
        (message) => {

            const rooms =
                [...socket.rooms];


            rooms.forEach(
                (room) => {

                    if (
                        room !== socket.id
                    ) {

                        socket
                            .to(room)
                            .emit(
                                "receiveMessage",
                                message
                            );

                    }

                }
            );

        }
    );


    // =========================
    // 主動離開聊天室
    // =========================

    socket.on(
        "leaveChat",
        () => {

            const rooms =
                [...socket.rooms];


            rooms.forEach(
                (room) => {

                    if (
                        room !== socket.id
                    ) {

                        socket
                            .to(room)
                            .emit(
                                "strangerLeft"
                            );


                        socket.leave(room);

                    }

                }
            );


            console.log(
                "🌙 使用者主動離開：",
                socket.anonymousName
            );

        }
    );


    // =========================
    // 真正斷線
    // =========================

    socket.on(
        "disconnect",
        () => {

            if (
                waitingUser &&
                waitingUser.id === socket.id
            ) {

                waitingUser = null;

            }


            // 從在線名單移除
            onlineUsers.delete(
                socket.id
            );


            console.log(
                "使用者離線：",
                socket.anonymousName
            );


            console.log(
                "目前在線人數：",
                onlineUsers.size
            );

        }
    );

});


// =========================
// 啟動伺服器
// =========================

const PORT =
    process.env.PORT || 3000;


server.listen(
    PORT,
    () => {

        console.log(
            "🌌 寂寞星球伺服器啟動！"
        );

        console.log(
            `伺服器埠號：${PORT}`
        );

    }
);
