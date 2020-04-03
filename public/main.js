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
let currentUI;
let time = 0;
let status = "Day";
let elapsedTime = 0;
let userKilled = false;
let notVoted = true;
// io things
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
        userKilled = true;
    }else{
        userKilled = false;
    }
    users.forEach((user, index)=>{
        let isKilled = true;
        afterKilledUsersSocket.users.forEach((newUsers)=>{
            if(user.username == newUsers)
                isKilled = false;
        });
        if(isKilled){
                //document.querySelector("button#"+users[index].username).remove();
        }
    });
    users = afterKilledUsersSocket.users;
    render();
});

// socket.on("error",(socketError)=>{
//     document.body.innerHTML = socketError;
// });

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
    console.log(result);
    const span = document.createElement("div");
    span.align = "center";
    span.innerHTML = result
    buttonsDOM.insertAdjacentElement("beforebegin",span);
    socket.emit("finishGameS", true);
});

socket.on("updateGame",(updateGame)=>{
    //console.log(status);
    //console.log(updateGame.status);
    render();
    time = updateGame.time;
    if(status != updateGame.status){
        if(updateGame.status == "Day"){
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
    const usernameDOM = document.getElementById('user_name');
    
    const readyDOM = document.getElementById('ready');
    readyDOM.addEventListener("click",(e)=>{
        player.status = 1;
        readyDOM.disabled = true;
        socket.emit("userReady", {player});
    });
    usernameDOM.innerText = player.username;
    document.getElementById("chat-form").addEventListener("submit",(e)=>sendMessage(e));
    document.getElementById("room-name").innerText = room;
    socket.emit("userJoined",{player});
}

function dayNormalUI(){
    //voteClear();
    //console.log("dayUI");
    buttonsDOM.innerHTML = "";
    //console.table(users);
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
}

function werewolfUI(){
    //voteClear();
    //console.log("werewolfUI");
    //setAllButtonsDisable(false);
    const buttonsDOM = document.getElementById("vote_buttons");
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
}

function doctorUI(){
    //voteClear();
    //console.log("doctorUI");
    //setAllButtonsDisable(false);
    const buttonsDOM = document.getElementById("vote_buttons");
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
}

function render(){
    //<li id="murat">murat <span id="murat_vote">0</span></li>
    const ul = document.getElementById("users");
    ul.innerHTML = "";
    //console.log(`Current status is ${status}`);
    if(status == "Night"){
        // Night rendering
        //console.log("night rendering for role " + player.role);
        users.forEach((user)=>{
            const li = document.createElement("li");
            li.id = user.username;
            let text = `${user.username} <span id="${user.username}_vote">${user.werewolfVote}</span>`;
            li.innerHTML = text;
            ul.appendChild(li);
        });
        if(player.role == "Werewolf" && !userKilled){
            console.log("Werewolf rendering");
            werewolfUI();
        }else if(player.role == "Doctor"  && !userKilled){
            doctorUI();
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
        if(!userKilled){
            console.log("Normal rendering");
            dayNormalUI();
        }
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
                user.protected = true;;
                socket.emit("doctor_update_user",{user});
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

socket.on("messageN",(socket)=>{
    console.log(`Gece mesaji ${socket}`);
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
