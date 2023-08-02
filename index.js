import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt, { hash } from "bcrypt";
 

// Connecting DataBase

mongoose.connect('mongodb://127.0.0.1:27017',{
    dbName: "Backend",
}).then(() => console.log("database connected")).catch((e)=> console.log(e));

// Schema 

const userSchema = new mongoose.Schema({
    name: String , 
    email: String ,
    password: String ,
})
const User = mongoose.model("user", userSchema)

const app = express();
const users = [];




// middleWare
app.use(express.static(path.join(path.resolve(),"public")));
app.use(express.urlencoded({extended: true}))
app.use(cookieParser());

app.set("view engine", "ejs");

const isAutheticated = async (req,res,next) => {
    const {token} = req.cookies;

    if(token){

        const decoded =  jwt.verify(token,"gwqfEFREGWREQ")
        req.user = await User.findById(decoded._id)
        next();

    }
    else{
        res.redirect("/login")

    }
}

app.get("/" , isAutheticated ,(req,res)=>{
    console.log(req.user);
    res.render("logout",{name: req.user.name});
    
})

app.get("/register", (req, res) => {
    res.render("register")
})
app.get("/login", (req,res) => {
    res.render("login")
})

app.get("/logout",(req,res)=>{

    res.cookie("token",null,{
        httpOnly:true, 
        expires:new Date(Date.now()),
    })
    res.redirect("/")
})



app.post("/register", async(req,res)=>{
    const {name,email,password} = req.body;
    
    let user = await User.findOne({email});
    
    if(user){
        return res.redirect("/login");
    }
    const hashPassword = await bcrypt.hash(password,10)
    user = await User.create({
        name,
        email,
        password: hashPassword,
    })

    const token = jwt.sign({_id:user._id},"gwqfEFREGWREQ" )

    res.cookie("token",token,{
        httpOnly:true, 
        expires: new Date(Date.now() + 10*1000),
    })
    res.redirect("/")
})



app.post("/login", async(req,res)=>{
    const {email,password} = req.body;
    
    let user = await User.findOne({email});
    
    if(!user){
        return res.redirect("/register");
    }
    const isMatch = await bcrypt.compare(password,user.password);

    if(!isMatch) return res.render("login",{email, message: "Incorrect password"})

    // user = await User.create({
    //     name,
    //     email,
    // })

    const token = jwt.sign({_id:user._id},"gwqfEFREGWREQ" )

    res.cookie("token",token,{
        httpOnly:true, 
        expires: new Date(Date.now() + 10*1000),
    })
    res.redirect("/")
})









app.listen(3000,()=>{
    console.log("listening in port 3000")
})