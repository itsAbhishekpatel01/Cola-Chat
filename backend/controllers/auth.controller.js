import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import {generateToken} from '../lib/utils.js';
import cloudinary from '../lib/cloudinary.js';

export const signup = async (req,res)=>{
    try {
        const {email,fullName,password} = req.body;
        if(!email || !fullName || !password){
            return res.status(400).json({message: 'All fields are required'});
        }
        if(password.length < 6){
            return res.status(400).json({message: 'Password must be at least 6 characters'});
        }
        const user  = await User.findOne({email});
        if(user){
            return res.status(400).json({message: 'User already exists'});
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({email,fullName,password: hashedPassword});
        if(newUser){
            // generate jwt token here
            generateToken(newUser._id, res);
            await newUser.save();
            return res.status(201).json({message: 'User created successfully', user: newUser});
        }
    } catch (error) {
        console.log('Signup error',error);
        res.status(500).json({message: 'Server error', error});
    }
}

export const login = async (req,res)=>{
    try {
        const {email,password} = req.body;
        if(!email || !password){
            return res.status(400).json({message: 'All fields are required'});
        }
        const user  = await User.findOne({email});
        if(!user){
            return res.status(400).json({message: 'Invalid credentials'});
        }
        const isMatch = await bcrypt.compare(password, user.password); 
        if(!isMatch){
            return res.status(400).json({message: 'Invalid credentials'});
        }
        // generate jwt token here
        generateToken(user._id, res);
        return res.status(200).json({message: 'Login successful', user});
    } catch (error) {
        console.log('Login error',error);
        res.status(500).json({message: 'Server error', error});
    }
}

export const logout = async (req,res)=>{
    try {
        res.cookie("jwt", '', {maxAge: 0});
        return res.status(200).json({message: 'Logout successful'});
    } catch (error) {
        console.log('Logout error',error);
        res.status(500).json({message: 'Server error', error});
    }
}

export const updateProfile = async (req,res)=>{
    try {
        const {profilePic} = req.body;
        if(!profilePic){
            return res.status(400).json({message: 'Profile picture is required'});
        }
        const uploadedResponse = await cloudinary.uploader.upload(profilePic);
        const userId = req.user._id;
        const updatedUser = await User.findByIdAndUpdate(userId, {profilePic: uploadedResponse.secure_url}, {new: true});
        return res.status(200).json({message: 'Profile updated successfully', user: updatedUser});
    } catch (error) {
        console.log('Update profile error',error);
        res.status(500).json({message: 'Server error', error});
    }
}

export const checkAuth = async (req,res)=>{
    try {
        return res.status(200).json({user: req.user});
    } catch (error) {
        console.log('Check auth error',error);
        res.status(500).json({message: 'Server error', error});
    }
}
