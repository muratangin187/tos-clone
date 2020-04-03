//const canvas = document.getElementById("canvas");
//const context = canvas.getContext("2d");

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

const users = [new User("Murat", "12345", "Villager", 1),
                new User("Ahmet", "6789", "Werewolf", 1),
                new User("Mehmet", "asdasd", "Doctor", 1),
                new User("Kardelen", "asdasd", "Werewolf", 1),
                new User("Musa", "asdasd", "Werewolf", 1),
                new User("Alper", "asdasd", "Villager", 1),
                new User("Can", "asdasd", "Villager", 1)];

const player = users[1];

const timer = document.getElementById('timer');
const status = document.getElementById('status');
const buttonsDOM = document.getElementById("vote_buttons");
let currentUI;

let elapsedTime = 0;

function setup() {
    const usernameDOM = document.getElementById('user_name');
    const userroleDOM = document.getElementById('user_role');
    usernameDOM.innerText = player.username;
    userroleDOM.innerText = player.role;
    dayNormalUI(true);
}

function dayNormalUI(isDisabled){
    
    if(currentUI != "Day"){
        voteClear();
        buttonsDOM.innerHTML = "";
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
    currentUI = "Day";
}

function werewolfUI(){
    if(currentUI != "Werewolf"){
        voteClear();
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
    currentUI = "Werewolf";
}

function doctorUI(){
    if(currentUI != "Doctor"){
        voteClear();
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
    currentUI = "Doctor";
}

function draw(){

    render();

    //game loop
    elapsedTime += deltaTime;
    if(elapsedTime > 1000){
        if(timer.innerText == "0"){
            if(status.innerText == "Day"){
                setAllButtonsDisable(false);
                status.innerText = "Vote";
            }else if(status.innerText == "Vote"){
                setAllButtonsDisable(true);
                killMostVoted();
                status.innerText = "Night";
            }else if(status.innerText == "Night"){
                killMostVoted();
                status.innerText = "Day";
            }
            timer.innerText = 5;
        }else{
            timer.innerText = timer.innerText - 1;
        }
        elapsedTime = 0;
    }
}

function render(){
    //<li id="murat">murat <span id="murat_vote">0</span></li>
    const ul = document.getElementById("users");
    ul.innerHTML = "";
    if(status.innerText == "Night"){
        // Night rendering
        users.forEach((user)=>{
            const li = document.createElement("li");
            li.id = user.username;
            let text = `${user.username} <span id="${user.username}_vote">${user.werewolfVote}</span>`;
            li.innerHTML = text;
            ul.appendChild(li);
        });
        if(player.role == "Werewolf"){
            werewolfUI();
        }else if(player.role == "Doctor"){
            doctorUI();
        }
    }else if(status.innerText == "Day"){
        // Day rendering
        users.forEach((user)=>{
            const li = document.createElement("li");
            li.id = user.username;
            let text = `${user.username} <span id="${user.username}_vote">${user.vote}</span>`;
            li.innerHTML = text;
            ul.appendChild(li);
        });
        dayNormalUI(true);
    }else if(status.innerText == "Vote"){
        // Vote rendering
        users.forEach((user)=>{
            const li = document.createElement("li");
            li.id = user.username;
            let text = `${user.username} <span id="${user.username}_vote">${user.vote}</span>`;
            li.innerHTML = text;
            ul.appendChild(li);
        });
        dayNormalUI(false);
    }
}

function voteClear(){
    users.forEach((user)=>{
        user.werewolfVote = 0;
        user.vote = 0;
    });
}

function killMostVoted() {
    let max = 0;
    let selectedUserId;
    if(status.innerText == "Vote"){
        users.forEach((user, index) => {
            if(max < user.vote)
                selectedUserId = index;
        });
        if(selectedUserId != undefined){
            console.log("button#"+users[selectedUserId].username);
            document.querySelector("button#"+users[selectedUserId].username).remove();
            users.splice(selectedUserId, 1);
        }
    }else if(status.innerText == "Night"){
        users.forEach((user, index) => {
            if(max < user.werewolfVote)
                selectedUserId = index;
        });
        if(selectedUserId != undefined){
            if(!users[selectedUserId].protected){
                console.log("button#"+users[selectedUserId].username);
                document.querySelector("button#"+users[selectedUserId].username).remove();
                users.splice(selectedUserId, 1);
            }else{
                console.log(`SOMEONE PROTECTED(${users[selectedUserId].username})`);
            }
        }
    }
}

function doctorVote(voted) {
    users.forEach(user => {
        if(user.username.toLowerCase() == voted.toLowerCase()){
            user.protected++;
        }
    });
    setAllButtonsDisable(true);
}

function killVote(voted) {
    users.forEach(user => {
        if(user.username.toLowerCase() == voted.toLowerCase()){
            user.werewolfVote++;
        }
    });
    setAllButtonsDisable(true);
}

function vote(voted) {
    users.forEach(user => {
        if(user.username.toLowerCase() == voted.toLowerCase()){
            user.vote++;
        }
    });
    setAllButtonsDisable(true);
}

function setAllButtonsDisable(isDisabled) {
    let buttons = document.getElementById("vote_buttons").getElementsByTagName('*');
    for (let i = 0; i < buttons.length; i++){
        if(users[i] != player)
        buttons[i].disabled = isDisabled;
    }
}