const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { configDotenv } = require('dotenv');
configDotenv();


const app = express();
const port = process.env.PORT || 5000;

// middleware

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y24v7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const menuCollection = client.db('bistro-boss-db').collection('menu');
    const cartCollection = client.db('bistro-boss-db').collection('carts');
    const userCollection = client.db('bistro-boss-db').collection('users');


    // jwt related api
    app.post('/jwt',async(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.JWT_SECRET,{expiresIn: '1h'});
      res.send({token});

    })

    // user related api
    app.post('/users',async(req,res)=>{
      const user = req.body;
      // insert email if user desn't exists;
      // you can  do this many ways (1. email unique,2. upsert, 3. simple checkin in db);
      const query = {email: user.email};
      const existingUser = await userCollection.findOne(query);
      if(existingUser){
        return res.send({message: "User already exist.",innsertedId: null});
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    })

    // custom middleware to verify the token

    const verifyToken = (req,res,next)=>{
      // console.log("inside the verify token",req.headers);
        if(!req.headers.authorization){
          return res.status(401).send({message: "forbiddedn access"})
        }
        const token = req.headers.authorization.split(" ")[1];
        jwt.verify(token,process.env.JWT_SECRET,(error,decoded)=>{
          if(error){
            return res.status(401).send({message: "Forbidden access"});
          }
          req.decoded = decoded;
        })
      next();
    }


    // verify admin
    const verifyAdmin = async(req,res,next)=>{
      const email = req.decoded.email;
      const query = {email: email};
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if(!isAdmin){
        return res.status(403).send({message:"Forbidden access"});
      }
      next();
    }

    app.get('/users',verifyToken,verifyAdmin,async(req,res)=>{
      // console.log(req.headers);
      const result = await userCollection.find().toArray();
      res.send(result);
    })

    // check if user is admin
    app.get('/users/admin/:email',verifyToken,async(req,res)=>{
      const email = req.params.email;
      if(req.decoded.email !== email){
        return res.status(403).send({message:"Forbidden access"});
      }
      const query = {email: email};
      const user = await userCollection.findOne(query);
      res.send({isAdmin: user?.role === "admin"});
    })

    app.patch('/users/admin/:id',verifyToken,verifyAdmin,async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const updatedDocs = {
        $set: {
          role: "admin"
        }
      };

      const result = await userCollection.updateOne(query,updatedDocs);
      res.send(result);
    })

    // delete user
    app.delete('/users/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = userCollection.deleteOne(query);

      res.send(result);
    })

    // menu api

    app.get('/menu',async(req,res)=>{
        const cursor = menuCollection.find();
        const result = await cursor.toArray();

        res.send(result);
    })

    app.post('/menu',verifyToken,verifyAdmin,async(req,res)=>{
      const item = req.body;
      const result = await menuCollection.insertOne(item);
      res.send(result);
    })

    // add to cart
    app.post('/carts',async(req,res)=>{
      try {
        const cart = req.body;
        const result = await cartCollection.insertOne(cart);
        res.send(result);
      } catch (error) {
        console.log("something went wrong when adding to cart",error);
      }
    })

    // get cart
    app.get('/carts',async(req,res)=>{
      try {
        const email = req.query.email;
        let filter = {customer_email:email};
        const cursor = cartCollection.find(filter);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.log("something went wrong when getting cart",error);
      }

    })

    // delete carts
    app.delete('/carts/:id',async(req,res)=>{
      const id = req.params.id;
      console.log(id);
      const filter = {_id: new ObjectId(id)};
      const result = await cartCollection.deleteOne(filter);
      res.send(result);
    })




  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);









app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});