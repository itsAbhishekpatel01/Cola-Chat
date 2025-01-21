import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId } from "../lib/socket.js";
import { io } from "../lib/socket.js";

export const getUsersForSidebar = async (req,res)=>{
    try {
        const loggedUserId = req.user._id;
        const filteredUsers = await User.find({_id: {$ne: loggedUserId}}).select("-password");
        return res.status(200).json({users: filteredUsers});
    } catch (error) {
        console.log('Get users error',error);
        res.status(500).json({message: 'Server error', error});
    }
}

export const getMessages = async (req,res)=>{
    try {
        const {id:userToChatId} = req.params;
        const myId = req.user._id; 
        const messages = await Message.find({
            $or:[
                {senderId: myId, receiverId: userToChatId},
                {senderId: userToChatId, receiverId: myId}
            ]
        })
        return res.status(200).json({messages});
    } catch (error) {
        console.log('Get messages error',error);
        res.status(500).json({message: 'Server error', error});
    }
}

export const sendMessage = async (req,res)=>{
    try {
        const {text, image} = req.body;
        const {id: receiverId} = req.params;
        const senderId = req.user._id; //  user._id added from auth middleware
        let imageUrl;
        if(image){
            // Upload base64 image to cloudinary
            const uploadedResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadedResponse.secure_url;
        }
        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl
        });
        await newMessage.save();
        const receiverSocketId = getReceiverSocketId(receiverId);
        if(receiverSocketId){
            io.to(receiverSocketId).emit('newMessage', newMessage);
        }
        return res.status(201).json({message: 'Message sent successfully', newMessage});
    } catch (error) {
        console.log('Send message error',error);
        res.status(500).json({message: 'Server error', error});
    }
} 