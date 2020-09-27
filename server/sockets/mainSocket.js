const { users, waitingUsers } = require('../data');
const { getIo } = require('../core/SocketManager');
const Chat = require('../core/Chat');
const User = require('../core/User');

const usersInfo = { free: 0, online: 0 }
const io = getIo();

io.on('connection', socket => {
    let user;
    let randomUser;
    let chat;
    usersInfo.online++;
    io.sockets.emit('usersInfo', usersInfo);
    
    
    socket.on('disconnect', () => {
        usersInfo.online--;
        usersInfo.free--;
        io.sockets.emit('usersInfo', usersInfo);
    
        if (user) {
            const userIndex = waitingUsers.findIndex(usr => usr.id === user.id);
            waitingUsers.splice(userIndex, 1);
        }
    });
    
    socket.on('joinSearch', (userData, cb) => {
        usersInfo.free++;
        io.sockets.emit('usersInfo', usersInfo);
        
        user = new User(userData.age, userData.gender, userData.preferAge, userData.preferGender, socket.id);
        users.push(user);
        const allowUsers = waitingUsers.filter(u => u.free &&
            (user.age >= u.preferAge.min && user.age <= u.preferAge.max) &&
            (u.age >= user.preferAge.min && u.age <= u.preferAge.max) &&
            (user.gender === u.preferGender || u.preferGender === 'both') &&
            (u.gender === user.preferGender || user.preferGender === 'both')
        );
        
        
        if (!allowUsers.length) {
            waitingUsers.push(user);
            cb(user);
        } else {
            randomUser = allowUsers[Math.floor(Math.random() * allowUsers.length)];
            chat = new Chat(user, randomUser);
            io.to(randomUser.socketId).emit('chatFound', chat);
            io.to(user.socketId).emit('chatFound', chat);
        }
        
    });
    
    socket.on('quitSearch', (userId, cb) => {
        usersInfo.free--;
        io.sockets.emit('usersInfo', usersInfo);
        const userIndex = waitingUsers.findIndex(user => user.id === userId);
        waitingUsers.splice(userIndex, 1);
        cb()
    })
    
    socket.on('joinChat', (chatData, cb) => {
        user.free = false;
        
        usersInfo.free--;
        io.sockets.emit('usersInfo', usersInfo);
        
        chat = chatData;
        socket.join(chatData.id);
        cb();
    });
    
    socket.on('requestReconnect', chatId => {
        socket.join(chatId);
    })
    
    socket.on('message', data => {
        const message = {
            message: data.message,
            author: data.author
        }
        
        io.to(data.chat.id).emit('messageFormServer', message);
    });
    
    socket.on('leaveChat', data => {
        usersInfo.free++;
        io.sockets.emit('usersInfo', usersInfo);
        
        socket.leave(data.chatId);
        data.first && io.to(data.chatId).emit('partnerLeave', data.chatId);
        if (chat) {
            const userIndex = users.findIndex(user => user.id === chat.you.id);
            users.splice(userIndex, 1);
            chat = null;
            user = null;
            randomUser = null;
        }
    });
    
});
