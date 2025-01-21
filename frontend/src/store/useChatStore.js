import {create} from 'zustand'
import toast from 'react-hot-toast'
import {axiosInstance} from '../lib/axios'
import { useAuthStore } from './useAuthStore';


export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUserLoading: false,
    isMessagesLoading: false,
    getUsers: async ()=>{
        set({isUserLoading: true})
        try {
            const res = await axiosInstance("/message/user");
            set({users: res.data.users})
        } catch (error) {
            toast.error(error.response.data.message)
        } finally{
            set({isUserLoading: false})
        }
    },
    getMessages: async (userId)=>{
        set({isMessagesLoading: true})
        try {
            const res = await axiosInstance(`/message/${userId}`);
            set({messages: res.data.messages})
        } catch (error) {
            toast.error(error.response.data.message)
        } finally{
            set({isMessagesLoading: false})
        }
    },
    subscribeToMessages: ()=>{
        const {selectedUser} = get();
        if(!selectedUser) return;
        const socket = useAuthStore.getState().socket;
        socket.on('newMessage', (newMessage)=>{
            const isMessageSentToSelectedUser = newMessage.senderId === selectedUser._id;
            if(!isMessageSentToSelectedUser) return;
            set({messages: [...get().messages, newMessage]})
        })
    },
    unSubscribeFromMessages: ()=>{
        const socket = useAuthStore.getState().socket;
        socket.off('newMessage')
    },
    sendMessage: async (messageData)=>{
        const {selectedUser, messages}  = get();
        try {
            const res = await axiosInstance.post(`/message/send/${selectedUser._id}`, messageData);
            set({messages: [...messages, res.data.newMessage]})
        } catch (error) {
            toast.error(error.response.data.message)
        }
    },
    setSelectedUser: (selectedUser) => set({selectedUser}),
}));