const express = require('express')
const cors = require('cors')
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

// middlewere
app.use(express.json())
app.use(cors())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_USER}@cluster0.dsq3s3c.mongodb.net/?retryWrites=true&w=majority`;

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
    const royaldb = client.db('royalFood');
    const allFoodCollection = royaldb.collection('allFood');
    const orderFoodCollection = royaldb.collection('orderedFood');
    const foodsixCollection = royaldb.collection('foodSix');
    
    // app.get('/api/v1/allFood',async(req,res)=>{
    //   res.send("kichu na")
    // })

    app.post('/api/v1/allFood', async(req,res)=>{
      const food = req.body;
      console.log(food);
      const result = await allFoodCollection.insertOne(food)
      res.send(result)
    })

    app.get('/api/v1/allFood', async(req,res)=>{
      const food = req.body;
      // console.log(food);
      const result = await allFoodCollection.find().toArray()
      res.send(result)
    })
    
    app.get('/api/v1/foodSix', async(req,res)=>{
      const result = await foodsixCollection.find().toArray()
      res.send(result)
    })
    


    console.log("successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send(`Royal Food is Running ${port}`)
})

app.listen(port, () => {
  console.log(`app listening on port ${port}`)
})