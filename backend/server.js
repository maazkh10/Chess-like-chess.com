import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { Chess } from "chess.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(cors({

    origin :"http://localhost:5173",
       methods: ["GET", "POST"]
    // http://localhost:5173'
}))

const server = http.createServer(app);
const io = new Server(server , {
    cors:{
        origin :"http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const rooms = {};

io.on("connection" , (socket) =>{
    console.log("a user connected" , socket.id);


    socket.on("create_room" ,(data) =>{
        const user = Math.random().toString(36).substring(2, 7);
       rooms[user] = new Chess();
        socket.join(user);
        socket.emit("room_created" , user);
    })

    socket.on("join_room" , (data) =>{
       const roomId = data.roomId;
       const roomcheck = io.sockets.adapter.rooms.get(roomId);
   

       if (roomcheck && roomcheck.size === 1) {
        socket.join(roomId);
        // notify to all 
        io.to(roomId).emit("start_game" , roomId , 
            {message : "Game Started"});

            socket.emit("player_color" , "black")
            socket.to(roomId).emit("player_color" , "white")
   
   
        }
        else if (roomcheck && roomcheck.size >= 2) {
            socket.emit("room_full" , roomId);
        }
        else{
            socket.emit("room_not_found" , roomId);
        }
    })

    socket.on("move_piece" , (data) =>{
        const roomid  = data.roomId;
        const game = rooms[roomid];
    const move = game.move({
        from : data.sourceSquare,
        to : data.targetSquare,
        promotion : "q"
     })
     if (!move) {
        socket.emit("invalid_move" , data);
        return;
     }
     socket.to(roomid).emit("opponent_move" , data);
    if (game.isCheckmate()) {
  io.to(roomid).emit("game_over", "Checkmate!");
}
else if (game.isDraw()) {
  io.to(roomid).emit("game_over", "Draw!");
}
else if (game.isCheck()) {
  io.to(roomid).emit("check_alert", "Check!");
}
console.log("Moved");
console.log("Check?", game.isCheck());
console.log("Mate?", game.isCheckmate());
console.log("Draw?", game.isDraw());
    })


socket.on("disconnect", () =>{
    console.log("a user disconnected" , socket.id);
})

})


const PORT = 5900;

app.get("/" , (req , res) => {
    res.send("Hello World");
})

server.listen(PORT , () => {
    console.log(`Server is running on port ${PORT}`);
});