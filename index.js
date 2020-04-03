// express stuffs
const express = require("express");
const app = express();

// server stuffs
const http = require("http");
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// io stuffs
const socketio = require("socket.io");
const io = socketio(server);

// util stuffs
const path = require("path");
const moment = require("moment");
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

class User{
    constructor(username, password, role, status){
        this.id = -1;
        this.username = username;
        this.password = password;
        this.role = role;
        this.status = status;
        this.vote = 0;
        this.werewolfVote = 0;
        this.protected = false;
    }
}

// const users = [new User("Murat", "12345", "Villager", 1),
//                 new User("Ahmet", "6789", "Werewolf", 1),
//                 new User("Mehmet", "asdasd", "Doctor", 1),
//                 new User("Kardelen", "asdasd", "Werewolf", 1),
//                 new User("Musa", "asdasd", "Werewolf", 1),
//                 new User("Alper", "asdasd", "Villager", 1),
//                 new User("Can", "asdasd", "Villager", 1)];

let users = [];
let readyGame = false;
let time = 0;
let status = "Day";
let roles = ["Villager","Villager","Villager","Villager","Werewolf","Werewolf","Werewolf"];
let gameFinished = false;
let winner = "";
let gameLoop;

io.on("connection",(socket)=>{
    //console.log("Someone connected with id:" + socket.id );
    socket.on("userJoined",(newUserSocket)=>{
        if(readyGame){
            //socket.emit("error","You cannot join, game is already started.");
        }else{
            console.log("User joined");
            let existingUser = undefined;
            users.forEach((user)=>{
               if(user.username === newUserSocket.player.username)
                existingUser = user;
            });
            if(existingUser == undefined){
                newUserSocket.player.id = socket.id;
                newUserSocket.player.role = randomRole();
                users.push(newUserSocket.player);
                io.emit("current_users", {users});
                socket.emit("role_change", newUserSocket.player.role);
            }else{
                socket.id = newUserSocket.player.id;
            }
        }
        //console.log(readyGame); 
    });

    socket.on("userReady",(readyUserSocket)=>{
        users.forEach((user)=>{
            if(user.username == readyUserSocket.player.username){
                //console.log(`User ${user.username} status changed to ${readyUserSocket.player.status}`);
                user.status = readyUserSocket.player.status;
            }
        });
        let isOk = true;
        users.forEach((user)=>{
            //console.log(`User ${user.username} status is  ${user.status}`);
            if(user.status == 0){
                isOk = false;
            }
        });
        if(isOk) readyGame = true; else readyGame = false;
        if(readyGame){
            gameLoop = setInterval(()=>{
                if(time == "0"){
                    if(status == "Day"){
                        status = "Vote";
                    }else if(status == "Vote"){
                        killMostVoted();
                        status = "Night";
                    }else if(status == "Night"){
                        killMostVoted();
                        status = "Day";
                    }
                    time = 5;
                }else{
                    time = time - 1;
                }

                //console.log(`Time:${time}`);
                //console.log(`Status:${status}`);
                io.emit("updateGame", {time, status});
            },1000);
        }
        io.emit("gameStarted", readyGame);
        //console.log(readyGame);
    });

    socket.on("finishGameS",()=>{
        console.log("game finished");
        clearInterval(gameLoop);
    })

    socket.on("vote_update_user",(afterVoteSocket)=>{
        newUser = afterVoteSocket.user;
        users.forEach((user)=>{
            if(user.username == newUser.username){
                user.vote = newUser.vote;
                user.werewolfVote = newUser.werewolfVote;
            }
        });
        io.emit("current_users", {users});
    });

    socket.on("doctor_update_user",(afterVoteSocket)=>{
        newUser = afterVoteSocket.user;
        users.forEach((user)=>{
            if(user.username == newUser.username){
                user.protected = newUser.protected;
            }
        });
        io.emit("current_users", {users});
    });

    socket.on("disconnect",(exitedUser)=>{
        users.forEach((value, index)=>{
            if(value.id == socket.id){
                users.splice(index, 1);
            }
        });
        //console.log(users);
        io.emit("current_users", {users});
    });
});

app.use(express.static(path.join(__dirname, "public")));
server.listen(port, ()=> console.log("Server established on port " + port));


function voteClear(){
    users.forEach((user)=>{
        user.werewolfVote = 0;
        user.vote = 0;
        user.protected = false;
    });
}

function killMostVoted() {
    let max = 0;
    let selectedUserId;
    if(status == "Vote"){
        users.forEach((user, index) => {
            if(max < user.vote){
                selectedUserId = index;
                max = user.vote;
            }
        });
        if(selectedUserId != undefined){
            //document.querySelector("button#"+users[selectedUserId].username).remove();
            //if(player.username == users[selectedUserId]){
            //    userKilled = true;
            //}
            //console.log(`User ${users[selectedUserId].username} killed with votes`);
            users.splice(selectedUserId, 1);
            voteClear();
            io.emit("after_killed_users", {users});
        }
    }else if(status == "Night"){
        console.log(users);
        users.forEach((user, index) => {
            if(max < user.werewolfVote){
                selectedUserId = index;
                max = user.werewolfVote;
            }
        });
        console.log(selectedUserId);
        if(selectedUserId != undefined){
            if(!users[selectedUserId].protected){
                // document.querySelector("button#"+users[selectedUserId].username).remove();
                // if(player.username == users[selectedUserId]){
                //     killUser();
                // }
                users.splice(selectedUserId, 1);
                // console.log("AFTER DEATH USERS");
                voteClear();
                io.emit("after_killed_users", {users});
            }else{
                //console.log(`SOMEONE PROTECTED(${users[selectedUserId].username})`);
            }
        }
    }

    let villageWin = true;
    let werewolfWin = true;
    users.forEach((user) =>{
        if(user.role == "Villager" || user.role == "Doctor"){
            werewolfWin = false;
        }else if(user.role == "Werewolf"){
            villageWin = false;
        }
    });
    console.log(villageWin);
    console.log(werewolfWin);
    if(villageWin && !werewolfWin){
        gameFinished = true;
        winner = "Villager";
        io.emit("finishGame", winner);
        clearInterval(gameLoop);
    }else if(!villageWin && werewolfWin){
        gameFinished = true;
        winner = "Werewolf";
        io.emit("finishGame", winner);
    }else{
        gameFinished = false;
    }
}

function randomRole(){
    let randomIndex = Math.floor(Math.random() * roles.length);
    let randomString = roles[randomIndex];
    roles.splice(randomIndex, 1);
    console.log(roles);
    return randomString;
}