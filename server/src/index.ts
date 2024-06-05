import WebSocket from "ws"
import http, { IncomingMessage } from "http"
import { v4 as uuidv4 } from "uuid"
import {} from "./types"

const server = http.createServer()
const wsServer = new WebSocket.Server({ server })

const port = 8080
const connections: {[id: string]: WebSocket} = {}
const users: any = {} 

const handleMessage = async (bytes: any, uuid: string) => {
  const message = JSON.parse(bytes.toString())
  const user = users[uuid]
  console.log("user: ", user)
  broadcast()

  console.log(
    `${user.username} updated their updated state: ${JSON.stringify(
      user.state,
    )}`,
  )
}

const handleClose = async (uuid: string) => {
  const user = users[uuid]
  console.log(`user ${user} disconeccted`)
  broadcast()
}

const broadcast = () => {
  Object.keys(connections).forEach((uuid) => {
    const connection = connections[uuid]
    const message = JSON.stringify(users)
    connection.send(message)
  })
}

wsServer.on("connection", async (connection: WebSocket, request: IncomingMessage) => {
  

  connection.on("message", async (message: any) => await handleMessage(message, "1"))
  connection.on("close", async () => await handleClose("1"))
})

server.listen(port, () => {
  console.log(`WebSocket server is running on port ${port}`)
})