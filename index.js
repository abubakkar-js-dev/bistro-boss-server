const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors');
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