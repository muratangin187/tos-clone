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

const timerDOM = document.getElementById('timer');
const statusDOM = document.getElementById('status');
const buttonsDOM = document.getElementById("vote_buttons");
let currentUI;
let time = 0;
let status = "Day";
let elapsedTime = 0;
let userKilled = false;

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
    document.getElementById("readyInfo").innerHTML == result;
    socket.emit("finishGameS", true);
});

socket.on("updateGame",(updateGame)=>{
    //console.log(status);
    //console.log(updateGame.status);
    time = updateGame.time;
    if(status != updateGame.status){
        if(updateGame.status == "Day"){
            // Day started
            setAllButtonsDisable(true);
        }else if(updateGame.status == "Vote" && !userKilled){
            // Vote started
            setAllButtonsDisable(false);
        }else if(updateGame.status == "Night"){
            // Night started
            setAllButtonsDisable(true);
        }
    }
    status =  updateGame.status;
    render();
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
    socket.emit("userJoined",{player});
}

function dayNormalUI(isDisabled){
    //voteClear();
    //console.log("dayUI");
    buttonsDOM.innerHTML = "";
    //console.table(users);
    users.forEach((user)=>{
        //<button id="murat">VOTE FOR MURAT</button>
        const btn = document.createElement("button");
        btn.id = user.username;
        btn.innerText = `VOTE FOR ${user.username}`;
        btn.disabled = isDisabled;
        btn.style.display = "block";
        btn.style.margin = "10px auto";
        btn.addEventListener("click", (e)=>{vote(e.srcElement.id)})
        buttonsDOM.appendChild(btn);
    });
}

function werewolfUI(){
    //voteClear();
    //console.log("werewolfUI");
    setAllButtonsDisable(false);
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
    setAllButtonsDisable(false);
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
        if(!userKilled)
            dayNormalUI(true);
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
            dayNormalUI(false);
    }
}

function doctorVote(voted) {
    users.forEach(user => {
        if(user.username.toLowerCase() == voted.toLowerCase()){
            user.protected = true;;
            socket.emit("doctor_update_user",{user});
        }
    });
    setAllButtonsDisable(true);
}

function killVote(voted) {
    users.forEach(user => {
        if(user.username.toLowerCase() == voted.toLowerCase()){
            user.werewolfVote++;
            socket.emit("vote_update_user",{user});
        }
    });
    setAllButtonsDisable(true);
}

function vote(voted) {
    users.forEach(user => {
        if(user.username.toLowerCase() == voted.toLowerCase()){
            user.vote++;
            socket.emit("vote_update_user",{user});
        }
    });
    setAllButtonsDisable(true);
}

function setAllButtonsDisable(isDisabled) {
    let buttons = document.getElementById("vote_buttons").getElementsByTagName('*');
    for (let i = 0; i < buttons.length; i++){
            buttons[i].disabled = isDisabled;
    }
}