const socket = io();

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


let strangerName = "陌生人";


// =========================
// 判斷目前是不是聊天室
// =========================

let inChat = false;


// =========================
// 滾動到底
// =========================

function scrollToBottom() {

    requestAnimationFrame(() => {

        messages.scrollTop =
            messages.scrollHeight;

    });

}


// =========================
// 開始聊天
// =========================

startChat.addEventListener(
    "click",
    () => {

        inChat = true;

        home.style.display =
            "none";

        chatPage.style.display =
            "flex";


        strangerName =
            "陌生人";


        messages.innerHTML = "";


        addSystemMessage(
            "🌙 正在尋找一位陌生人……"
        );


        socket.emit(
            "findStranger"
        );


        // 不要一進聊天室就強制叫出鍵盤
        messageInput.blur();

    }
);


// =========================
// 系統訊息
// =========================

function addSystemMessage(text) {

    const message =
        document.createElement("div");

    message.className =
        "message other";


    const name =
        document.createElement("span");

    name.className =
        "name";

    name.textContent =
        "寂寞星球";


    const bubble =
        document.createElement("div");

    bubble.className =
        "bubble";

    bubble.textContent =
        text;


    message.appendChild(name);

    message.appendChild(bubble);

    messages.appendChild(message);


    scrollToBottom();
}


// =========================
// 等待配對
// =========================

socket.on(
    "waiting",
    () => {

        console.log(
            "正在等待陌生人..."
        );

    }
);


// =========================
// 配對成功
// =========================

socket.on(
    "matched",
    (anonymousName) => {

        strangerName =
            anonymousName;


        messages.innerHTML =
            "";


        const message =
            document.createElement("div");

        message.className =
            "message other";


        const name =
            document.createElement("span");

        name.className =
            "name";

        name.textContent =
            "寂寞星球";


        const bubble =
            document.createElement("div");

        bubble.className =
            "bubble";


        bubble.append(
            "✨ 配對成功！\n\n"
        );


        bubble.append(
            "你遇見了："
        );


        const strong =
            document.createElement("strong");

        strong.textContent =
            anonymousName;


        bubble.appendChild(
            document.createElement("br")
        );

        bubble.appendChild(
            strong
        );


        bubble.appendChild(
            document.createElement("br")
        );

        bubble.appendChild(
            document.createElement("br")
        );


        bubble.append(
            "現在可以開始聊天了 🌙"
        );


        message.appendChild(
            name
        );

        message.appendChild(
            bubble
        );


        messages.appendChild(
            message
        );


        scrollToBottom();


        // 配對成功後才讓使用者點擊輸入
        messageInput.blur();

    }
);


// =========================
// 發送訊息
// =========================

function send() {

    const text =
        messageInput.value.trim();


    if (!text) {

        return;

    }


    // =========================
    // 先清空輸入框
    // =========================

    messageInput.value =
        "";


    // =========================
    // 顯示自己的訊息
    // =========================

    const message =
        document.createElement("div");

    message.className =
        "message me";


    const name =
        document.createElement("span");

    name.className =
        "name";

    name.textContent =
        "你";


    const bubble =
        document.createElement("div");

    bubble.className =
        "bubble";

    bubble.textContent =
        text;


    message.appendChild(
        name
    );

    message.appendChild(
        bubble
    );


    messages.appendChild(
        message
    );


    // =========================
    // 傳給對方
    // =========================

    socket.emit(
        "sendMessage",
        text
    );


    // =========================
    // 關閉鍵盤
    // =========================

    messageInput.blur();


    // =========================
    // iPhone 鍵盤收起後再捲到底
    // =========================

    setTimeout(
        () => {

            scrollToBottom();

        },
        50
    );


    setTimeout(
        () => {

            scrollToBottom();

        },
        250
    );


    setTimeout(
        () => {

            scrollToBottom();

        },
        500
    );

}


// =========================
// 點擊送出
// =========================

sendMessage.addEventListener(
    "click",
    (event) => {

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

        if (
            event.key === "Enter"
        ) {

            event.preventDefault();

            send();

        }

    }
);


// =========================
// 收到陌生人訊息
// =========================

socket.on(
    "receiveMessage",
    (text) => {

        const message =
            document.createElement("div");

        message.className =
            "message other";


        const name =
            document.createElement("span");

        name.className =
            "name";

        name.textContent =
            strangerName;


        const bubble =
            document.createElement("div");

        bubble.className =
            "bubble";

        bubble.textContent =
            text;


        message.appendChild(
            name
        );

        message.appendChild(
            bubble
        );


        messages.appendChild(
            message
        );


        scrollToBottom();

    }
);


// =========================
// 陌生人離開
// =========================

socket.on(
    "strangerLeft",
    () => {

        const message =
            document.createElement("div");

        message.className =
            "message other";


        const name =
            document.createElement("span");

        name.className =
            "name";

        name.textContent =
            "寂寞星球";


        const bubble =
            document.createElement("div");

        bubble.className =
            "bubble";


        bubble.textContent =
            `${strangerName} 已離開聊天室。\n\n` +
            `也許下一次，會遇見另一個想說說話的人。`;


        message.appendChild(
            name
        );

        message.appendChild(
            bubble
        );


        messages.appendChild(
            message
        );


        // =========================
        // 再找一個人
        // =========================

        const button =
            document.createElement("button");

        button.id =
            "findAgain";

        button.type =
            "button";

        button.textContent =
            "🌙 再找一個人";


        messages.appendChild(
            button
        );


        scrollToBottom();


        button.addEventListener(
            "click",
            () => {

                button.remove();

                messages.innerHTML =
                    "";


                strangerName =
                    "陌生人";


                addSystemMessage(
                    "🌙 正在尋找一位陌生人……"
                );


                socket.emit(
                    "findStranger"
                );

            }
        );

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


        inChat =
            false;


        messageInput.value =
            "";


        messageInput.blur();


        chatPage.style.display =
            "none";


        home.style.display =
            "flex";

    }
);


// =========================
// Socket 重新連線
// =========================

socket.on(
    "connect",
    () => {

        console.log(
            "Socket 已連線：",
            socket.id
        );

    }
);


socket.on(
    "disconnect",
    () => {

        console.log(
            "Socket 已斷線"
        );

    }
);


// =========================
// iPhone / Safari：
// 鍵盤高度變化時保持畫面到底
// =========================

if (
    window.visualViewport
) {

    window.visualViewport.addEventListener(
        "resize",
        () => {

            if (!inChat) {
                return;
            }


            setTimeout(
                () => {

                    scrollToBottom();

                },
                50
            );

        }
    );


    window.visualViewport.addEventListener(
        "scroll",
        () => {

            if (!inChat) {
                return;
            }

            setTimeout(
                () => {

                    scrollToBottom();

                },
                50
            );

        }
    );

}
* =========================================================
   🔌 Socket.io
========================================================= */

const socket = io();


/* =========================================================
   📌 DOM
========================================================= */

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


/* =========================================================
   👤 目前聊天對象
========================================================= */

let strangerName = "陌生人";


/* =========================================================
   🔒 防止重複送出
========================================================= */

let sending = false;


/* =========================================================
   🔌 Socket 連線
========================================================= */

socket.on("connect", () => {

    console.log(
        "Socket 已連線：",
        socket.id
    );

});


socket.on("disconnect", () => {

    console.log(
        "Socket 已斷線"
    );

});


/* =========================================================
   📜 捲動到底
========================================================= */

function scrollToBottom() {

    /*
     * 第一層：立即捲到底
     */

    messages.scrollTop =
        messages.scrollHeight;


    /*
     * 第二層：等瀏覽器完成 DOM 排版後
     * 再捲一次。
     */

    requestAnimationFrame(() => {

        messages.scrollTop =
            messages.scrollHeight;

    });

}


/* =========================================================
   📱 鍵盤收起
========================================================= */

function closeKeyboard() {

    /*
     * iPhone Safari：
     * blur 可以讓輸入框失去焦點。
     */

    if (
        document.activeElement ===
        messageInput
    ) {

        messageInput.blur();

    }

}


/* =========================================================
   📱 鍵盤收起後重新捲到底
========================================================= */

function scrollAfterKeyboard() {

    scrollToBottom();


    setTimeout(() => {

        scrollToBottom();

    }, 100);


    setTimeout(() => {

        scrollToBottom();

    }, 300);


    setTimeout(() => {

        scrollToBottom();

    }, 500);

}


/* =========================================================
   🌙 開始聊天
========================================================= */

startChat.addEventListener(
    "click",
    () => {

        home.style.display =
            "none";


        chatPage.style.display =
            "flex";


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


        scrollToBottom();


        /*
         * 開始配對
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


/* =========================================================
   ⏳ 等待配對
========================================================= */

socket.on(
    "waiting",
    () => {

        console.log(
            "正在等待陌生人..."
        );

    }
);


/* =========================================================
   ✨ 配對成功
========================================================= */

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
                        ${escapeHtml(
                            anonymousName
                        )}
                    </strong>

                    <br><br>

                    現在可以開始聊天了 🌙

                </div>

            </div>
        `;


        scrollToBottom();


        /*
         * 故意不自動 focus。
         *
         * 避免 iPhone 自動跳出鍵盤。
         */

    }
);


/* =========================================================
   🔐 HTML 安全處理
========================================================= */

function escapeHtml(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}


/* =========================================================
   📨 發送訊息
========================================================= */

function send() {

    /*
     * 防止同一時間重複執行
     */

    if (sending) {

        return;

    }


    const text =
        messageInput.value.trim();


    /*
     * 空白訊息不送
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


    /*
     * 鎖定短時間內的重複觸發
     */

    sending = true;


    /* =====================================================
       先顯示自己的訊息
    ===================================================== */

    const message =
        document.createElement(
            "div"
        );


    message.className =
        "message me";


    const name =
        document.createElement(
            "span"
        );


    name.className =
        "name";


    name.textContent =
        "你";


    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        "bubble";


    bubble.textContent =
        text;


    message.appendChild(
        name
    );


    message.appendChild(
        bubble
    );


    messages.appendChild(
        message
    );


    /*
     * 先把輸入框清空
     */

    messageInput.value =
        "";


    /*
     * 立刻捲到底
     */

    scrollToBottom();


    /* =====================================================
       傳給 Socket.io
    ===================================================== */

    socket.emit(
        "sendMessage",
        text
    );


    /* =====================================================
       iPhone 關閉鍵盤
    ===================================================== */

    closeKeyboard();


    /*
     * 鍵盤開始收起後，
     * 多次確認畫面已經到底。
     */

    scrollAfterKeyboard();


    /*
     * 解鎖
     */

    setTimeout(
        () => {

            sending = false;

        },
        350
    );

}


/* =========================================================
   📤 按「送出」
========================================================= */

sendMessage.addEventListener(
    "click",
    (event) => {

        event.preventDefault();

        send();

    }
);


/* =========================================================
   ⌨️ Enter
========================================================= */

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


/* =========================================================
   💬 收到陌生人訊息
========================================================= */

socket.on(
    "receiveMessage",
    (text) => {

        const message =
            document.createElement(
                "div"
            );


        message.className =
            "message other";


        const name =
            document.createElement(
                "span"
            );


        name.className =
            "name";


        name.textContent =
            strangerName;


        const bubble =
            document.createElement(
                "div"
            );


        bubble.className =
            "bubble";


        bubble.textContent =
            text;


        message.appendChild(
            name
        );


        message.appendChild(
            bubble
        );


        messages.appendChild(
            message
        );


        scrollToBottom();

    }
);


/* =========================================================
   🚪 陌生人離開
========================================================= */

socket.on(
    "strangerLeft",
    () => {

        const message =
            document.createElement(
                "div"
            );


        message.className =
            "message other";


        const name =
            document.createElement(
                "span"
            );


        name.className =
            "name";


        name.textContent =
            "寂寞星球";


        const bubble =
            document.createElement(
                "div"
            );


        bubble.className =
            "bubble";


        bubble.innerHTML =
            "";


        const title =
            document.createTextNode(
                `🌙 ${strangerName} 已離開聊天室。`
            );


        bubble.appendChild(
            title
        );


        bubble.appendChild(
            document.createElement(
                "br"
            )
        );


        bubble.appendChild(
            document.createElement(
                "br"
            )
        );


        bubble.appendChild(
            document.createTextNode(
                "也許下一次，會遇見另一個想說說話的人。"
            )
        );


        message.appendChild(
            name
        );


        message.appendChild(
            bubble
        );


        messages.appendChild(
            message
        );


        /* =================================================
           再找一個人按鈕
        ================================================= */

        const button =
            document.createElement(
                "button"
            );


        button.id =
            "findAgain";


        button.type =
            "button";


        button.textContent =
            "🌙 再找一個人";


        messages.appendChild(
            button
        );


        scrollToBottom();


        /* =================================================
           再找一個人
        ================================================= */

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


                const waitingName =
                    document.createElement(
                        "span"
                    );


                waitingName.className =
                    "name";


                waitingName.textContent =
                    "寂寞星球";


                const waitingBubble =
                    document.createElement(
                        "div"
                    );


                waitingBubble.className =
                    "bubble";


                waitingBubble.textContent =
                    "🌙 正在尋找一位陌生人……";


                waitingMessage.appendChild(
                    waitingName
                );


                waitingMessage.appendChild(
                    waitingBubble
                );


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


/* =========================================================
   🚪 離開聊天室
========================================================= */

leaveChat.addEventListener(
    "click",
    (event) => {

        event.preventDefault();


        /*
         * 通知 Server
         */

        if (
            socket.connected
        ) {

            socket.emit(
                "leaveChat"
            );

        }


        /*
         * 關閉鍵盤
         */

        closeKeyboard();


        /*
         * 清除輸入
         */

        messageInput.value =
            "";


        /*
         * 回首頁
         */

        chatPage.style.display =
            "none";


        home.style.display =
            "flex";


        /*
         * 回到首頁頂部
         */

        window.scrollTo(
            0,
            0
        );

    }
);


/* =========================================================
   📱 頁面恢復時
========================================================= */

window.addEventListener(
    "pageshow",
    () => {

        sending = false;

    }
);
