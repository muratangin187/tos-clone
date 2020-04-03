const socket = io();
const {username, password, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});
class User{
    constructor(username, password, role, status){
        this.username = username;
        this.password = password;
        this.role = role;
        this.status = status;
        this.vote = 0;
        this.werewolfVote = 0;
        this.protected = false;
    }
}
const player = new User(username, password, "Villager", 0);
player.id = socket.id;
let users = [];
let usersChat = [];
const timerDOM = document.getElementById('timer');
const statusDOM = document.getElementById('status');
const buttonsDOM = document.getElementById("vote_buttons");
const chatMessages = document.querySelector('.chat-messages');
let currentUI = "Day";
let time = 0;
let status = "Day";
let elapsedTime = 0;
let userKilled = false;
let notVoted = true;

socket.on("current_users", (currentUsersSocket)=>{
    users = currentUsersSocket.users;
    render();
});
socket.on("role_change",(newRoleSocket)=>{
    player.role = newRoleSocket;
    const userroleDOM = document.getElementById('user_role');
    userroleDOM.innerText = player.role;
});

socket.on("after_killed_users", (afterKilledUsersSocket)=>{
    //console.table(afterKilledUsersSocket.users);
    let indexs = -1;
    afterKilledUsersSocket.users.forEach((user, index)=>{
        if(user.username == player.username)
            indexs = index;
    });
    //console.log(`user.username=, player.username=${player.username}, index=${indexs}`);
    if(indexs == -1){
        // death
        if(!userKilled){
            userKilled = true;
            if(afterKilledUsersSocket.type == 1)
                sendSystemMessage("You hanged by users", 1, "me");
            else
                sendSystemMessage("You killed by someone", 1, "me");
        }
    }else{
        userKilled = false;
        if(afterKilledUsersSocket.type == 1)
            sendSystemMessage(`This turn ${afterKilledUsersSocket.killedUser.username} be hanged.`, 1, "me");
        else
            sendSystemMessage(`This turn ${afterKilledUsersSocket.killedUser.username} killed by someone.`, 1, "me");
    }
    users = afterKilledUsersSocket.users;
    render();
});

socket.on("gameStarted", (socketGameStarted)=>{
    if(socketGameStarted){
        document.getElementById("readyInfo").innerText = "Game is started";
        document.getElementById("info").attributes.removeNamedItem("hidden");
    }else{
        document.getElementById("readyInfo").innerText = "Game is not started";
    }
});

socket.on("finishGame",(winner)=>{
    let result = "GAME FINISHED <b>" + winner  + "</b> WINS";
    //console.log(result);
    //const span = document.createElement("div");
    //span.align = "center";
    //span.innerHTML = result
    //buttonsDOM.insertAdjacentElement("beforebegin",span);
    sendSystemMessage("GAME FINISHED, " + winner + " WINS.", 0, 0);
    socket.emit("finishGameS", true);
});

socket.on("updateGame",(updateGame)=>{
    //console.log(status);
    //console.log(updateGame.status);
    render();
    time = updateGame.time;
    if(status != updateGame.status){
        if(updateGame.status == "Day"){
            notVoted = false;
            // Day started
            //setAllButtonsDisable(true);
        }else if(updateGame.status == "Vote" && !userKilled){
            notVoted = true;
            // Vote started
            //setAllButtonsDisable(false);
        }else if(updateGame.status == "Night"){
            notVoted = true;
            // Night started
            //setAllButtonsDisable(true);
        }
    }
    status =  updateGame.status;
    timerDOM.innerText = time;
    statusDOM.innerText = status;
});

init();
function init() {
    document.getElementById('ready').addEventListener("click",(e)=>{
        player.status = 1;
        document.getElementById('ready').disabled = true;
        socket.emit("userReady", {player});
    });
    document.getElementById('user_name').innerText = player.username;
    document.getElementById("chat-form").addEventListener("submit",(e)=>sendMessage(e));
    document.getElementById("room-name").innerText = room;
    socket.emit("userJoined",{player});
}

function dayNormalUI(){
    //voteClear();
    //console.log("dayUI");
    if(currentUI != "Vote"){
        buttonsDOM.innerHTML = "";
        users.forEach((user)=>{
            //<button id="murat">VOTE FOR MURAT</button>
            const btn = document.createElement("button");
            btn.id = user.username;
            btn.innerText = `VOTE FOR ${user.username}`;
            btn.style.display = "block";
            btn.style.margin = "10px auto";
            btn.addEventListener("click", (e)=>{vote(e.srcElement.id)})
            buttonsDOM.appendChild(btn);
        });
        currentUI = "Vote";
    }
}

function werewolfUI(){
    if(currentUI != "Werewolf"){
        buttonsDOM.innerHTML = "";
        users.forEach((user)=>{
            //<button id="murat">VOTE FOR MURAT</button>
            const btn = document.createElement("button");
            btn.id = user.username;
            btn.innerText = `KILL ${user.username}`;
            btn.style.backgroundColor = "red";
            btn.style.color = "white";
            btn.style.display = "block";
            btn.style.margin = "10px auto";
            btn.addEventListener("click", (e)=>{killVote(e.srcElement.id);})
            buttonsDOM.appendChild(btn);
        });
        currentUI = "Werewolf";
    }
}

function dayClearUI(){
    if(currentUI != "Day"){
        buttonsDOM.innerHTML = "";
        currentUI = "Day";
    }
}

function lookoutUI(){
    if(currentUI != "Lookout"){
        buttonsDOM.innerHTML = "";
        users.forEach((user)=>{
            //<button id="murat">VOTE FOR MURAT</button>
            const btn = document.createElement("button");
            btn.id = user.username;
            btn.innerText = `LOOK OUT ${user.username}`;
            btn.style.backgroundColor = "lightgrey";
            btn.style.color = "black";
            btn.style.display = "block";
            btn.style.margin = "10px auto";
            btn.addEventListener("click", (e)=>{lookoutVote(e.srcElement.id);})
            buttonsDOM.appendChild(btn);
        });
        currentUI = "Lookout";
    }
}

function doctorUI(){
    if(currentUI != "Doctor"){
        buttonsDOM.innerHTML = "";
        users.forEach((user)=>{
            //<button id="murat">VOTE FOR MURAT</button>
            const btn = document.createElement("button");
            btn.id = user.username;
            btn.innerText = `PROTECT ${user.username}`;
            btn.style.backgroundColor = "green";
            btn.style.color = "white";
            btn.style.display = "block";
            btn.style.margin = "10px auto";
            btn.addEventListener("click", (e)=>{doctorVote(e.srcElement.id);})
            buttonsDOM.appendChild(btn);
        });
        currentUI = "Doctor";
    }
}

function veteranUI(){
    if(currentUI != "Veteran"){
        buttonsDOM.innerHTML = "";
        const btn = document.createElement("button");
        btn.innerText = `OPEN ALARM`;
        btn.style.backgroundColor = "red";
        btn.style.color = "white";
        btn.style.display = "block";
        btn.style.margin = "10px auto";
        btn.addEventListener("click", (e)=>{veteranVote();})
        buttonsDOM.appendChild(btn);
    }
}


function render(){
    const ul = document.getElementById("users");
    ul.innerHTML = "";
    //console.log(`Current status is ${status}`);
    if(status == "Night"){
        // Night rendering
        //console.log("night rendering for role " + player.role);
        if(player.role == "Werewolf"){
            users.forEach((user)=>{
                const li = document.createElement("li");
                li.id = user.username;
                let text = `${user.username} <span id="${user.username}_vote">${user.werewolfVote}</span>`;
                li.innerHTML = text;
                ul.appendChild(li);
            });
        }else{
            users.forEach((user)=>{
                const li = document.createElement("li");
                li.id = user.username;
                let text = `${user.username} <span id="${user.username}_vote">${user.vote}</span>`;
                li.innerHTML = text;
                ul.appendChild(li);
            });
        }
        if(player.role == "Werewolf" && !userKilled){
            console.log("Werewolf rendering");
            werewolfUI();
        }else if(player.role == "Doctor"  && !userKilled){
            doctorUI();
        }else if(player.role == "Lookout"  && !userKilled){
            lookoutUI();
        }else if(player.role == "Veteran"  && !userKilled){
            veteranUI();
        }
    }else if(status == "Day"){
        // Day rendering
        users.forEach((user)=>{
            const li = document.createElement("li");
            li.id = user.username;
            let text = `${user.username} <span id="${user.username}_vote">${user.vote}</span>`;
            li.innerHTML = text;
            ul.appendChild(li);
        });
        dayClearUI();
    }else if(status == "Vote"){
        // Vote rendering
        users.forEach((user)=>{
            const li = document.createElement("li");
            li.id = user.username;
            let text = `${user.username} <span id="${user.username}_vote">${user.vote}</span>`;
            li.innerHTML = text;
            ul.appendChild(li);
        });
        if(!userKilled)
            dayNormalUI();
    }
}

function doctorVote(voted) {
    if(notVoted == true){
        users.forEach(user => {
            if(user.username.toLowerCase() == voted.toLowerCase()){
                sendSystemMessage("You will protect " + user.username + " this night!", 1, "me");
                user.protected = true;
                socket.emit("doctor_update_user",{user, player});
            }
        });
        notVoted = false;
    }
}

function veteranVote(){
    if(notVoted == true){
        sendSystemMessage("You will protect yourself this night!", 1, "me");
        player.protected = true;
        socket.emit("veteran_update_user",{player});
        notVoted = false;
    }
}

function lookoutVote(voted) {
    if(notVoted == true){
        users.forEach(user => {
            if(user.username.toLowerCase() == voted.toLowerCase()){
                sendSystemMessage("You will lookout " + user.username + " this night!", 1, "me");
                socket.emit("lookout_update_user",{user, player});
            }
        });
        notVoted = false;
    }
}

function killVote(voted) {
    if(notVoted == true){
        users.forEach(user => {
            if(user.username.toLowerCase() == voted.toLowerCase()){
                user.werewolfVote++;
                socket.emit("vote_update_user",{user});
            }
        });
        notVoted = false;
    }
}

function vote(voted) {
    if(notVoted == true){
        // button disabling
        for(let i = 0; i < buttonsDOM.childElementCount; i++){
            buttonsDOM.children[i].disabled = true;
        }
        document.querySelector("button#" + voted).style.backgroundColor = "lightgreen";
        users.forEach(user => {
            if(user.username.toLowerCase() == voted.toLowerCase()){
                user.vote++;
                socket.emit("vote_update_user",{user});
            }
        });
        notVoted = false;
    }
}


/////////// CHAT //////////////

function createMessage(username, message){
    return {username:username,
            message: message,
            };
}

function addMessage(message){
    asd = message;
    const div = document.createElement('div');
    const msgBox = document.querySelector(".chat-messages");
    if(message.type == 0)
    div.classList.add("server");
    else
        div.classList.add("message");
    div.innerHTML = 
    `<p class="meta">${message.username}
        <span>${message.date}</span></p>
     <p class="text">${message.message}</p>`;
    msgBox.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;

}

function sendMessage(e){
    e.preventDefault();
    const msgBox  = document.getElementById("msg");
    const msg = msgBox.value;
    msgBox.value = "";
    if(status == "Day")
        socket.emit("messageD", createMessage(username, msg));
    else if(status == "Vote")
        socket.emit("messageD", createMessage(username, msg));
    else if(status == "Night" && player.role == "Werewolf")
        socket.emit("messageN", createMessage(username, msg));
}

// to = Werewolf, All, something else for send himself with type = 1
function sendSystemMessage(message, type, to){
    let systemMessage;
    if(type==0){
        //system to everyone
        systemMessage = {message:message,type:0,to:0};
    }else if(type==1){
        systemMessage = {message:message,type:1,to:to};
        //system to $to
    }
    socket.emit("messageS", systemMessage);
}

socket.on("messageN",(socket)=>{
    //console.log(`Gece mesaji ${socket}`);
    addMessage(socket); 
});

socket.on("messageD",(socket)=>addMessage(socket));

socket.on("users", (userss)=> {
    usersChat = userss;
    let ul = document.getElementById("usersc");
    let result = "";
    usersChat.forEach((user =>{
        result += `<li>${user}</li>`;
    }));
    ul.innerHTML = result;
});
