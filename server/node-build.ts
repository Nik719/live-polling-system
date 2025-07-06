import { createApp } from "./index";

const { app, httpServer } = createApp();

const port = process.env.PORT || 8080;

httpServer.listen(port, () => {
  console.log(`🚀 Live Polling System server running on port ${port}`);
  console.log(`📊 Socket.IO enabled for real-time polling`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
});
