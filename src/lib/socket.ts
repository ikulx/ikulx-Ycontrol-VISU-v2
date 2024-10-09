import { Server } from "socket.io";

const socketHandler = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Setze dies auf deine tatsächliche Domain in der Produktion
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });

    socket.on("updateValue", (data) => {
      console.log("Update received:", data);
      // Benachrichtige alle Clients über die Änderung
      io.emit("valueUpdated", data);
    });
  });
};

export default socketHandler;
