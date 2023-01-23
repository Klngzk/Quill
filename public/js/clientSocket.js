var connected = false;


// const port      = process.env.PORT || "3003"
// const url = "http://localhost:3003" || "https://dry-badlands-19252.herokuapp.com"
var socket = io();
socket.emit("setup", userLoggedIn)

socket.on("connected", ()=>{
    connected = true
})
socket.on("mess received", (newMessage)=>{
    messageReceived(newMessage)
    refreshMessagegsBadge()
})

socket.on("notification received", ()=>{
    $.get("/api/notifications/latest", (notificationData) => {
        showNotificationPopup(notificationData)
        refreshNotificationsBadge()
    })
})

function emitNotification(userId){
    if(userId == userLoggedIn._id)return;

    socket.emit("notification received", userId)
}