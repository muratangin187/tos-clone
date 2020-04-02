//const canvas = document.getElementById("canvas");
//const context = canvas.getContext("2d");

class User{
    constructor(username, password, role, status){
        this.username = username;
        this.password = password;
        this.role = role;
        this.status = status;
        this.vote = 0;
    }
}

const users = [new User("Murat", "12345", "Villager", 1),
                new User("Ahmet", "6789", "Werewolf", 1),
                new User("Mehmet", "asdasd", "Villager", 1),
                new User("Kardelen", "asdasd", "Werewolf", 1),
                new User("Musa", "asdasd", "Werewolf", 1),
                new User("Alper", "asdasd", "Villager", 1),
                new User("Can", "asdasd", "Villager", 1)];

const player = users[1];

const timer = document.getElementById('timer');
const status = document.getElementById('status');
let elapsedTime = 0;

function setup() {
    const buttonsDOM = document.getElementById("vote_buttons");

    users.forEach((user)=>{
        //<button id="murat">VOTE FOR MURAT</button>
        const btn = document.createElement("button");
        btn.id = user.username;
        btn.innerText = `VOTE FOR ${user.username}`;
        btn.disabled = true;
        btn.addEventListener("click", (e)=>{vote(e.srcElement.id)})
        buttonsDOM.appendChild(btn);
    });
}

function draw(){

    render();

    elapsedTime += deltaTime;
    if(elapsedTime > 1000){
        if(timer.innerText == "0"){
            if(status.innerText == "Day"){
                status.innerText = "Vote";
                setAllButtonsDisable(false);
            }else if(status.innerText == "Vote"){
                setAllButtonsDisable(true);
                killMostVoted();
                status.innerText = "Night";
            }else if(status.innerText == "Night"){
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
    users.forEach((user)=>{
        const li = document.createElement("li");
        li.id = user.username;
        let text = `${user.username} <span id="${user.username}_vote">${user.vote}</span>`;
        li.innerHTML = text;
        ul.appendChild(li);
    });

    if(status.innerText == "Night"){
        //night
        if(player.role == "Werewolf"){
            werewolfUI();
        }else{

        }
    }
}

function werewolfUI(){
    const buttonsDOM = document.getElementById("vote_buttons");
    buttonsDOM.innerHTML = "";
    users.forEach((user)=>{
        //<button id="murat">VOTE FOR MURAT</button>
        const btn = document.createElement("button");
        btn.id = user.username;
        btn.innerText = `KILL ${user.username}`;
        btn.style.backgroundColor = "red";
        btn.style.color = "white";
        btn.disabled = true;
        btn.addEventListener("click", (e)=>{vote(e.srcElement.id)})
        buttonsDOM.appendChild(btn);
    });
}

function killMostVoted() {
    let max = 0;
    let selectedUserId;
    users.forEach((user, index) => {
        if(max < user.vote)
            selectedUserId = index;
    });
    if(selectedUserId != undefined){
        users.splice(selectedUserId, 1);
    }
}

function vote(voted) {
    console.log(`VOTED FOR ${voted}`);
    users.forEach(user => {
        if(user.username.toLowerCase() == voted.toLowerCase()){
            user.vote++;
            console.log(user.username);
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