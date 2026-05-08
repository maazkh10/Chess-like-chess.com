import React, { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { socketconnection } from "./socket";
import "./App.css";
function App() {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [joinInput, setJoininput] = useState("");

  const [screen, setScreen] = useState("home");
  const [color, setColor] = useState("");
  const [message, setMessage] = useState("");

  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(new Chess().fen());

  useEffect(() => {
    socketconnection.on("room_created", (id) => {
      setRoomId(id);
    });

    socketconnection.on("start_game", () => {
      setScreen("game");
    });

    socketconnection.on("player_color", (clr) => {
      setColor(clr);
    });

    socketconnection.on("room_full", () => {
      setMessage("Room is full");
    });

    socketconnection.on("room_not_found", () => {
      setMessage("Room not found");
    });

    socketconnection.on("check_alert", (msg) => {
 console.log("check recive" , msg)
      setMessage(msg);
    })

    socketconnection.on("game_over" , (msf) =>{
       console.log("ame over" , msf)
      setMessage(msf)
    })


    socketconnection.on("opponent_move", (data) => {
     
     setGame((prev) =>{
       const gameCopy = new Chess(prev.fen());

      gameCopy.move({
        from: data.sourceSquare,
        to: data.targetSquare,
        promotion: "q",
      });

      // setGame(gameCopy);
      setFen(gameCopy.fen());
return gameCopy;
     })

    console.log(data.sourceSquare, data.targetSquare)
    });

    return () => {
      socketconnection.off("room_created");
      socketconnection.off("start_game");
      socketconnection.off("player_color");
      socketconnection.off("room_full");
      socketconnection.off("room_not_found");
      socketconnection.off("opponent_move");
      socketconnection.off("check_alert");
      socketconnection.off("game_over");
    };
  }, []);

  const createRoom = () => {
    socketconnection.emit("create_room");
  };

  const jointRoom = () => {
    socketconnection.emit("join_room", {
      roomId: joinInput,
    });
  };

 function onDrop(sourceSquare, targetSquare) {

  console.log("deopprre")
  if (color === "white" && game.turn() !== "w") return false;
  if (color === "black" && game.turn() !== "b") return false;

  const gameCopy = new Chess(game.fen());

  const move = gameCopy.move({
    from: sourceSquare,
    to: targetSquare,
    promotion: "q",
  });

  if (!move) return false;

  setGame(gameCopy);
setFen(gameCopy.fen());
  socketconnection.emit("move_piece", {
    roomId: roomId || joinInput,
    sourceSquare,
    targetSquare
  });

  return true;
}


const isMyturn = 
(color === "white" && game.turn() === "w") || 
(color === "black" && game.turn() === "b") ; 

  if (screen === "game") {
    return (
  <div className="app-container">
    <div className="game-screen">
      <h1>Chess Game Started</h1>

      <h2>Your Color: {color}</h2>
      <h3>Room ID: {roomId || joinInput}</h3>

      <h2 className="turn-text">
        {game.turn() === "w" ? "White Turn" : "Black Turn"}
      </h2>

      <h2 className="status-text">{message}</h2>

      <div
        className={`board-wrapper ${isMyturn ? "turn" : "waiting"}`}
      >
        <Chessboard
          id="test-board"
          position={fen}
          boardWidth={500}
          arePiecesDraggable={isMyturn}
          onPieceDrop={onDrop}
          boardOrientation={color}
        />
      </div>
    </div>
  </div>
);
  }
return (
  <div className="app-container">
    <div className="home-screen">
      <h1>Chess Game</h1>

      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button onClick={createRoom}>Create Game</button>

      <h3 className="room-id">Room ID: {roomId}</h3>

      <input
        type="text"
        placeholder="Enter room id"
        value={joinInput}
        onChange={(e) => setJoininput(e.target.value)}
      />

      <button onClick={jointRoom}>Join Room</button>

      <p className="message">{message}</p>
    </div>
  </div>
);
}

export default App;