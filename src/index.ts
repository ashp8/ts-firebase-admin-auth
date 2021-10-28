import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import path from 'path';
import express, {Express, NextFunction, Request, Response} from 'express';
import admin from 'firebase-admin';
import cors from 'cors';
const serviceAccount = require('../fbsecretkey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
//const csrfMiddleware = csrf({cookie:true});

const PORT:number|string = process.env.PORT || 3000;

const app:Express = express();


var corsOptions = {
    origin: 'http://localhost:4200',
    credentials: true };
app.use(cors(corsOptions));

app.engine("html", require('ejs').renderFile);
app.use(express.static('static'));

app.use(express.json());
app.use(cookieParser());
//app.use(csrfMiddleware);

app.all("*", (req: Request, res:Response, next:NextFunction)=>{
  res.cookie("XSRF-TOKEN", "you are some super smart cookie!!");
  next();
});

app.get('/', (req:Request, res:Response)=>{
//  res.render("index.html");
    res.end();
});

app.get("/login", (req: Request, res:Response)=>{
  console.log(req.cookies.session);
  if(req.cookies.session){
    res.json({status: "true!", location: '/'});
  }
  res.json({status: "failed!"});
  //res.render("login.html");
});

app.get("/signup", (req:Request, res:Response)=>{
  res.render('signup.html');
});

app.post('/sessionLogin', (req:Request, res:Response)=>{
  const idToken = req.body.idToken.toString();
  const expiresIn:number = 60*60*24*5*1000;

  admin
    .auth()
    .createSessionCookie(idToken, { expiresIn })
    .then(
      (sessionCookie) => {
        const options = { maxAge: expiresIn, httpOnly: true, secure: true };
        res.cookie("session", sessionCookie, options);
        res.end(JSON.stringify({ status: "success", location: "/" }));
      },
      (error) => {
        res.status(401).send("UNAUTHORIZED REQUEST!");
      }
    );

});
app.get("/sessionLogout", (req:Request, res:Response)=>{
  res.clearCookie("session");
  res.redirect("/login");
});


app.get("/profile", (req:Request, res:Response)=>{
  const sessionCookie:string = req.cookies.session || "";

  admin
    .auth()
    .verifySessionCookie(sessionCookie, true)
    .then(()=>{
      res.render('profile.html');
    })
    .catch((error)=>{
      res.redirect("/login");
    })
});




app.listen(PORT, ():void=>{
  console.log("Server started at port " + PORT);
});
