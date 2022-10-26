const express = require('express');
const app = express();
const userRoutes = require('./routes/UserRoutes')
const helmet = require("helmet");
const morgan = require("morgan");

const rooms = ['general', 'tech', 'finance', 'crypto'];
const cors = require('cors');
const Message = require('./models/Message');
const User = require('./models/User');

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));
app.use(cors());

app.use('/users',userRoutes)
require('./connection')

const server = require('http').createServer(app);
const PORT = 5001
const io = require('socket.io')(server, {
    cors:{
        origin: 'http://localhost:3000',
        methods:['GET','POST']
    }
})



async function getLastMessageFromRoom(room){
    let roomMessage = await Message.aggregate([
        {$match:{to:room}},
        {$group:{_id:'$date',messagesByDate:{$push:'$$ROOT'}}}
    ])
    return roomMessage
}

function sortRoomMessagesByDate(messages){
    return messages.sort(function(a,b){
        let date1 = a._id.split('/');
        let date2 = b._id.split('/')

        date1 = date1[2] + date1[0] + date1[1]
        date2= date2[2] + date2[0] + date2[1]
        return date1 < date2 ? -1 : 1
    })
}

io.on('connection',(socket)=>{
    socket.on('new-user',async ()=>{
        const members = await User.find();
        io.emit('new-user',members)
    })
    socket.on('join-room',async(room)=>{
        socket.join(room)
        let roomMessage = await getLastMessageFromRoom(room)
        roomMessage = sortRoomMessagesByDate(roomMessage)
        socket.emit('room-messages',roomMessage)

    })
    socket.on('message-room', async(room, content, sender, time, date) => {
        const newMessage = await Message.create({content, from: sender, time, date, to: room});
        let roomMessages = await getLastMessageFromRoom(room);
        roomMessages = sortRoomMessagesByDate(roomMessages);
        // sending message to room
        io.to(room).emit('room-messages', roomMessages);
        socket.broadcast.emit('notifications', room)
      })
      app.delete('/logout',async(req,res)=>{
        try {
            const {_id,newMessage} = req.body;
            const user = await User.findById(_id);
            user.status = "offline";
            user.newMessage = newMessage;
            await user.save();
            const members = await User.find();
            socket.broadcast.emit('new-user',members)
            res.status(200).send()

        } catch (e) {
            console.log(e);
            res.status(400).send()
        }
      })
})
app.disable('etag');
app.get('/rooms',(req,res)=>{
    res.json(rooms)
})
server.listen(PORT, ()=>{
    console.log('listening to port',PORT)
})
