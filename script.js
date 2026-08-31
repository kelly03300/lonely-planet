/* =========================
   🔌 Socket.io
========================= */

const socket = io();


/* =========================
   📌 DOM
========================= */

const home =
    document.getElementById("home");

const chatPage =
    document.getElementById("chatPage");

const startChat =
    document.getElementById("startChat");

const leaveChat =
    document.getElementById("leaveChat");

const messageInput =
    document.getElementById("messageInput");

const sendMessage =
    document.getElementById("sendMessage");

const messages =
    document.getElementById("messages");


/* =========================
   👤 目前聊天對象
========================= */

let strangerName =
    "陌生人";


/* =========================
   🔌 Socket 連線狀態
========================= */

socket.on("connect", () => {

    console.log(
        "Socket 已連線"
    );

});


socket.on("disconnect", () => {

    console.log(
        "Socket 已斷線"
    );

});


/* =========================
   📜 捲動到最新訊息
========================= */

function scrollToBottom() {

    /*
     * 使用 requestAnimationFrame
     * 確保新訊息已經真正加入 DOM
     * 再進行捲動。
     */

    requestAnimationFrame(() => {

        messages.scrollTop =
            messages.scrollHeight;

    });

}


/* =========================
   📱 iPhone / 手機鍵盤處理
========================= */

function updateViewportHeight() {

    /*
     * visualViewport 是手機瀏覽器
     * 真正可看到的畫面高度。
     *
     * iPhone 鍵盤出現時，
     * window.innerHeight 不一定會立即正確變化。
     */

    if (!window.visualViewport) {
        return;
    }


    const viewport =
        window.visualViewport;


    /*
     * 計算目前實際可視高度。
     */

    const height =
        viewport.height;


    /*
     * 只有手機尺寸才處理。
     */

    if (window.innerWidth <= 600) {

        chatPage.style.height =
            `${height}px`;

    }

}


/* =========================
   📱 監聽手機鍵盤 / 畫面變化
========================= */

if (window.visualViewport) {

    window.visualViewport.addEventListener(
        "resize",
        () => {

            updateViewportHeight();

            /*
             * 鍵盤出現或消失後，
             * 稍微延遲再捲到底。
             */

            setTimeout(() => {

                scrollToBottom();

            }, 50);

        }
    );


    window.visualViewport.addEventListener(
        "scroll",
        () => {

            updateViewportHeight();

        }
    );

}


/* =========================
   📱 Window resize
========================= */

window.addEventListener(
    "resize",
    () => {

        updateViewportHeight();

    }
);


/* =========================
   🌙 開始找陌生人
========================= */

startChat.addEventListener(
    "click",
    () => {

        home.style.display =
            "none";


        chatPage.style.display =
            "flex";


        /*
         * 重設聊天室
         */

        strangerName =
            "陌生人";


        messageInput.value =
            "";


        messages.innerHTML = `
            <div class="message other">

                <span class="name">
                    寂寞星球
                </span>

                <div class="bubble">
                    🌙 正在尋找一位陌生人……
                </div>

            </div>
        `;


        /*
         * 更新手機可視高度
         */

        updateViewportHeight();


        scrollToBottom();


        /*
         * 開始配對
         */

        if (socket.connected) {

            socket.emit(
                "findStranger"
            );

        } else {

            messages.innerHTML = `
                <div class="message other">

                    <span class="name">
                        寂寞星球
                    </span>

                    <div class="bubble">
                        🔌 正在連線，請稍候……
                    </div>

                </div>
            `;


            /*
             * Socket 連線後再開始配對
             */

            socket.once(
                "connect",
                () => {

                    messages.innerHTML = `
                        <div class="message other">

                            <span class="name">
                                寂寞星球
                            </span>

                            <div class="bubble">
                                🌙 正在尋找一位陌生人……
                            </div>

                        </div>
                    `;


                    socket.emit(
                        "findStranger"
                    );

                }
            );

        }

    }
);


/* =========================
   ⏳ 等待配對
========================= */

socket.on(
    "waiting",
    () => {

        console.log(
            "正在等待陌生人..."
        );

    }
);


/* =========================
   ✨ 配對成功
========================= */

socket.on(
    "matched",
    (anonymousName) => {

        strangerName =
            anonymousName;


        messages.innerHTML = `
            <div class="message other">

                <span class="name">
                    寂寞星球
                </span>

                <div class="bubble">

                    ✨ 配對成功！<br><br>

                    你遇見了：

                    <strong>
                        ${anonymousName}
                    </strong>

                    <br><br>

                    現在可以開始聊天了 🌙

                </div>

            </div>
        `;


        scrollToBottom();


        /*
         * 注意：
         *
         * 這裡不再自動 focus。
         *
         * 避免 iPhone 自動叫出鍵盤。
         */

    }
);


/* =========================
   📨 發送訊息
========================= */

function send() {

    /*
     * 取得輸入文字
     */

    const text =
        messageInput.value.trim();


    /*
     * 不允許空白訊息
     */

    if (text === "") {

        return;

    }


    /*
     * Socket 尚未連線
     */

    if (!socket.connected) {

        console.log(
            "Socket 尚未連線"
        );

        return;

    }


    /* =========================
       顯示自己的訊息
    ========================= */

    const message =
        document.createElement("div");


    message.className =
        "message me";


    message.innerHTML = `
        <span class="name">
            你
        </span>

        <div class="bubble"></div>
    `;


    message
        .querySelector(".bubble")
        .textContent = text;


    messages.appendChild(
        message
    );


    /* =========================
       傳送給陌生人
    ========================= */

    socket.emit(
        "sendMessage",
        text
    );


    /* =========================
       清空輸入框
    ========================= */

    messageInput.value =
        "";


    /* =========================
       手機鍵盤收起
    ========================= */

    messageInput.blur();


    /* =========================
       捲到最新訊息
    ========================= */

    scrollToBottom();


    /*
     * iPhone 鍵盤開始收起後，
     * 再補一次捲動。
     */

    setTimeout(() => {

        scrollToBottom();

    }, 100);


    setTimeout(() => {

        scrollToBottom();

    }, 300);

}


/* =========================
   📤 點擊送出
========================= */

sendMessage.addEventListener(
    "click",
    (event) => {

        /*
         * 防止手機瀏覽器
         * 產生額外的預設行為。
         */

        event.preventDefault();


        send();

    }
);


/* =========================
   ⌨️ Enter 送出
========================= */

messageInput.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Enter"
        ) {

            event.preventDefault();

            send();

        }

    }
);


/* =========================
   💬 收到陌生人的訊息
========================= */

socket.on(
    "receiveMessage",
    (text) => {

        const message =
            document.createElement("div");


        message.className =
            "message other";


        message.innerHTML = `
            <span class="name"></span>

            <div class="bubble"></div>
        `;


        message
            .querySelector(".name")
            .textContent =
            strangerName;


        message
            .querySelector(".bubble")
            .textContent =
            text;


        messages.appendChild(
            message
        );


        scrollToBottom();

    }
);


/* =========================
   🚪 陌生人離開
========================= */

socket.on(
    "strangerLeft",
    () => {

        const message =
            document.createElement("div");


        message.className =
            "message other";


        message.innerHTML = `
            <span class="name">
                寂寞星球
            </span>

            <div class="bubble">

                🌙 ${strangerName}
                已離開聊天室。<br><br>

                也許下一次，
                會遇見另一個想說說話的人。

            </div>
        `;


        messages.appendChild(
            message
        );


        /* =========================
           再找一個人
        ========================= */

        const button =
            document.createElement(
                "button"
            );


        button.id =
            "findAgain";


        button.textContent =
            "🌙 再找一個人";


        messages.appendChild(
            button
        );


        scrollToBottom();


        /* =========================
           再找一個人
        ========================= */

        button.addEventListener(
            "click",
            () => {

                button.remove();


                messages.innerHTML =
                    "";


                strangerName =
                    "陌生人";


                messageInput.value =
                    "";


                const waitingMessage =
                    document.createElement(
                        "div"
                    );


                waitingMessage.className =
                    "message other";


                waitingMessage.innerHTML = `
                    <span class="name">
                        寂寞星球
                    </span>

                    <div class="bubble">
                        🌙 正在尋找一位陌生人……
                    </div>
                `;


                messages.appendChild(
                    waitingMessage
                );


                scrollToBottom();


                /*
                 * 開始新的配對
                 */

                if (
                    socket.connected
                ) {

                    socket.emit(
                        "findStranger"
                    );

                }

            }
        );

    }
);


/* =========================
   🚪 離開聊天室
========================= */

leaveChat.addEventListener(
    "click",
    () => {

        socket.emit(
            "leaveChat"
        );


        /*
         * 收起手機鍵盤
         */

        messageInput.blur();


        /*
         * 清空輸入框
         */

        messageInput.value =
            "";


        /*
         * 回到首頁
         */

        chatPage.style.display =
            "none";


        home.style.display =
            "flex";


        /*
         * 清除手機高度設定
         */

        chatPage.style.height =
            "";

    }
);
 socket = io();

const home = document.getElementById("home");
const chatPage = document.getElementById("chatPage");

const startChat = document.getElementById("startChat");
const leaveChat = document.getElementById("leaveChat");

const messageInput = document.getElementById("messageInput");
const sendMessage = document.getElementById("sendMessage");
const messages = document.getElementById("messages");


// =========================
// 目前聊天對象的匿名名稱
// =========================

let strangerName = "陌生人";


// =========================
// Socket 連線狀態
// =========================

let socketConnected = false;

socket.on("connect", () => {

    socketConnected = true;

    console.log("Socket 已連線");

});


socket.on("disconnect", () => {

    socketConnected = false;

    console.log("Socket 已斷線");

});


// =========================
// 開始找陌生人
// =========================

startChat.addEventListener("click", () => {

    home.style.display = "none";

    chatPage.style.display = "flex";

    // 新的配對先重設
    strangerName = "陌生人";


    messages.innerHTML = `
        <div class="message other">

            <span class="name">
                寂寞星球
            </span>

            <div class="bubble">
                🌙 正在尋找一位陌生人……
            </div>

        </div>
    `;


    // 確認 Socket 已經連線
    if (socket.connected) {

        socket.emit("findStranger");

    } else {

        messages.innerHTML = `
            <div class="message other">

                <span class="name">
                    寂寞星球
                </span>

                <div class="bubble">
                    🔌 正在連線，請稍候……
                </div>

            </div>
        `;

        // Socket 重新連線後再尋找
        socket.once("connect", () => {

            messages.innerHTML = `
                <div class="message other">

                    <span class="name">
                        寂寞星球
                    </span>

                    <div class="bubble">
                        🌙 正在尋找一位陌生人……
                    </div>

                </div>
            `;

            socket.emit("findStranger");

        });

    }

});


// =========================
// 等待配對
// =========================

socket.on("waiting", () => {

    console.log("正在等待陌生人...");

});


// =========================
// 配對成功
// =========================

socket.on("matched", (anonymousName) => {

    // 記住這次配對的陌生人名字
    strangerName = anonymousName;


    messages.innerHTML = `
        <div class="message other">

            <span class="name">
                寂寞星球
            </span>

            <div class="bubble">

                ✨ 配對成功！<br><br>

                你遇見了：

                <strong>
                    ${anonymousName}
                </strong>

                <br><br>

                現在可以開始聊天了 🌙

            </div>

        </div>
    `;


    messages.scrollTop =
        messages.scrollHeight;


    /*
     * 不在這裡直接 focus。
     *
     * 手機瀏覽器特別是 iPhone，
     * 自動 focus 可能會直接叫出鍵盤，
     * 並造成第一次點擊輸入框或送出按鈕時行為異常。
     *
     * 所以讓使用者自己點擊輸入框。
     */

});


// =========================
// 發送訊息
// =========================

function send() {

    // 取得文字
    const text =
        messageInput.value.trim();


    // 空白訊息不送出
    if (text === "") {

        return;

    }


    // Socket 尚未連線
    if (!socket.connected) {

        console.log("Socket 尚未連線");

        return;

    }


    // =========================
    // 顯示自己的訊息
    // =========================

    const message =
        document.createElement("div");

    message.className =
        "message me";


    message.innerHTML = `
        <span class="name">
            你
        </span>

        <div class="bubble"></div>
    `;


    message.querySelector(".bubble").textContent =
        text;


    messages.appendChild(message);


    // =========================
    // 傳送給陌生人
    // =========================

    socket.emit(
        "sendMessage",
        text
    );


    // =========================
    // 清空輸入框
    // =========================

    messageInput.value = "";


    // =========================
    // 捲到最新訊息
    // =========================

    messages.scrollTop =
        messages.scrollHeight;


    /*
     * 延遲 focus。
     *
     * 避免手機瀏覽器在 click / keydown
     * 事件期間發生奇怪的鍵盤行為。
     */

    setTimeout(() => {

        messageInput.focus();

    }, 50);

}


// =========================
// 收到陌生人的訊息
// =========================

socket.on("receiveMessage", (text) => {

    const message =
        document.createElement("div");


    message.className =
        "message other";


    message.innerHTML = `
        <span class="name"></span>

        <div class="bubble"></div>
    `;


    // 使用目前配對的匿名名稱
    message.querySelector(".name").textContent =
        strangerName;


    message.querySelector(".bubble").textContent =
        text;


    messages.appendChild(message);


    // 捲到最新訊息
    messages.scrollTop =
        messages.scrollHeight;

});


// =========================
// 陌生人離開
// =========================

socket.on("strangerLeft", () => {

    const message =
        document.createElement("div");


    message.className =
        "message other";


    message.innerHTML = `
        <span class="name">
            寂寞星球
        </span>

        <div class="bubble">

            🌙 ${strangerName} 已離開聊天室。<br><br>

            也許下一次，
            會遇見另一個想說說話的人。

        </div>
    `;


    messages.appendChild(message);


    // =========================
    // 再找一個人的按鈕
    // =========================

    const button =
        document.createElement("button");


    button.id =
        "findAgain";


    button.textContent =
        "🌙 再找一個人";


    messages.appendChild(button);


    messages.scrollTop =
        messages.scrollHeight;


    // =========================
    // 再找一個人
    // =========================

    button.addEventListener("click", () => {

        button.remove();


        // 清除上一個聊天室
        messages.innerHTML = "";


        // 重設陌生人名稱
        strangerName =
            "陌生人";


        // 清空輸入框
        messageInput.value = "";


        const waitingMessage =
            document.createElement("div");


        waitingMessage.className =
            "message other";


        waitingMessage.innerHTML = `
            <span class="name">
                寂寞星球
            </span>

            <div class="bubble">
                🌙 正在尋找一位陌生人……
            </div>
        `;


        messages.appendChild(waitingMessage);


        messages.scrollTop =
            messages.scrollHeight;


        // 開始新的配對
        if (socket.connected) {

            socket.emit(
                "findStranger"
            );

        }

    });

});


// =========================
// 點擊送出
// =========================

sendMessage.addEventListener(
    "click",
    (event) => {

        /*
         * 防止按鈕的預設行為
         * 造成手機瀏覽器第一次點擊異常。
         */

        event.preventDefault();

        send();

    }
);


// =========================
// Enter 送出
// =========================

messageInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            send();

        }

    }
);


// =========================
// 離開聊天室
// =========================

leaveChat.addEventListener(
    "click",
    () => {

        socket.emit(
            "leaveChat"
        );


        chatPage.style.display =
            "none";


        home.style.display =
            "flex";


        // 清空輸入框
        messageInput.value = "";

    }
); socket = io();

const home = document.getElementById("home");
const chatPage = document.getElementById("chatPage");

const startChat = document.getElementById("startChat");
const leaveChat = document.getElementById("leaveChat");

const messageInput = document.getElementById("messageInput");
const sendMessage = document.getElementById("sendMessage");
const messages = document.getElementById("messages");


// =========================
// 目前聊天對象的匿名名稱
// =========================

let strangerName = "陌生人";


// =========================
// 開始找陌生人
// =========================

startChat.addEventListener("click", () => {

    home.style.display = "none";
    chatPage.style.display = "flex";

    // 新的配對先重設
    strangerName = "陌生人";

    messages.innerHTML = `
        <div class="message other">

            <span class="name">
                寂寞星球
            </span>

            <div class="bubble">
                🌙 正在尋找一位陌生人……
            </div>

        </div>
    `;

    socket.emit("findStranger");

});


// =========================
// 等待配對
// =========================

socket.on("waiting", () => {

    console.log("正在等待陌生人...");

});


// =========================
// 配對成功
// =========================

socket.on("matched", (anonymousName) => {

    // 記住這次配對的陌生人名字
    strangerName = anonymousName;

    messages.innerHTML = `
        <div class="message other">

            <span class="name">
                寂寞星球
            </span>

            <div class="bubble">

                ✨ 配對成功！<br><br>

                你遇見了：

                <strong>
                    ${anonymousName}
                </strong>

                <br><br>

                現在可以開始聊天了 🌙

            </div>

        </div>
    `;

    messageInput.focus();

});


// =========================
// 發送訊息
// =========================

function send() {

    const text = messageInput.value.trim();

    if (text === "") {
        return;
    }


    // 顯示自己的訊息

    const message = document.createElement("div");

    message.className = "message me";

    message.innerHTML = `
        <span class="name">
            你
        </span>

        <div class="bubble"></div>
    `;

    message.querySelector(".bubble").textContent = text;

    messages.appendChild(message);


    // 傳送給陌生人

    socket.emit("sendMessage", text);


    messageInput.value = "";

    messages.scrollTop = messages.scrollHeight;

    messageInput.focus();

}


// =========================
// 收到陌生人的訊息
// =========================

socket.on("receiveMessage", (text) => {

    const message = document.createElement("div");

    message.className = "message other";

    message.innerHTML = `
        <span class="name"></span>

        <div class="bubble"></div>
    `;


    // 使用目前配對的匿名名稱
    message.querySelector(".name").textContent =
        strangerName;


    message.querySelector(".bubble").textContent =
        text;


    messages.appendChild(message);

    messages.scrollTop = messages.scrollHeight;

});


// =========================
// 陌生人離開
// =========================

socket.on("strangerLeft", () => {

    const message = document.createElement("div");

    message.className = "message other";

    message.innerHTML = `
        <span class="name">
            寂寞星球
        </span>

        <div class="bubble">

            🌙 ${strangerName} 已離開聊天室。<br><br>

            也許下一次，
            會遇見另一個想說說話的人。

        </div>
    `;

    messages.appendChild(message);


    // 再找一個人

    const button = document.createElement("button");

    button.id = "findAgain";

    button.textContent = "🌙 再找一個人";

    messages.appendChild(button);

    messages.scrollTop = messages.scrollHeight;


    // =========================
    // 再找一個人
    // =========================

    button.addEventListener("click", () => {

        button.remove();

        // 清除上一個聊天室
        messages.innerHTML = "";

        // 重設陌生人名稱
        strangerName = "陌生人";


        const waitingMessage =
            document.createElement("div");

        waitingMessage.className =
            "message other";

        waitingMessage.innerHTML = `
            <span class="name">
                寂寞星球
            </span>

            <div class="bubble">
                🌙 正在尋找一位陌生人……
            </div>
        `;

        messages.appendChild(waitingMessage);

        messages.scrollTop =
            messages.scrollHeight;


        // 開始新的配對
        socket.emit("findStranger");

    });

});


// =========================
// 點擊送出
// =========================

sendMessage.addEventListener("click", send);


// =========================
// Enter 送出
// =========================

messageInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        send();
    }

});


// =========================
// 離開聊天室
// =========================

leaveChat.addEventListener("click", () => {

    socket.emit("leaveChat");

    chatPage.style.display = "none";
    home.style.display = "flex";

});
