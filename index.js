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

    app.get('/users',async(req,res)=>{
      const result = await userCollection.find().toArray();
      res.send(result);
    })

    app.patch('/users/admin/:id',async(req,res)=>{
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