const socket = io();

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