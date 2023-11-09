const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// middlewere


app.use(cors({
  origin:['https://royal-food-assignment.netlify.app','http://localhost:5173'],
  credentials:true
}));

app.use(express.json());
app.use(cookieParser())

const secretKey = process.env.SCERET_KEY

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_USER}@cluster0.dsq3s3c.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const royaldb = client.db("royalFood");
    const allFoodCollection = royaldb.collection("allFood");
    const orderFoodCollection = royaldb.collection("orderedFood");
    const userCollection = royaldb.collection("user");

    // JWT

    const middleman = (req,res,next)=>{
      const {token} = req.cookies;
      // console.log('man',token);
      if(!token){
        return res.status(401).send({message:"not Authrized"})
      }
      jwt.verify(token,secretKey,(err,decoded)=>{
        if(err){
          return res.status(401).send({message:"not Authrized"})
        }
        console.log('decoded',decoded);
        req.user = decoded
        next()

      })
      


    }


    app.post("/api/v1/jwt", async (req, res) => {
      const email = req.body;
      // console.log(email);
      const token = jwt.sign(email,secretKey,{expiresIn:'1h'})
      res.cookie('token',token,{
        httpOnly:true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      }).send({success:true})
    })

    app.post("/api/v1/allFood", async (req, res) => {
      const food = req.body;
      // console.log(food);
      const result = await allFoodCollection.insertOne(food);
      res.send(result);
    });

    app.get("/api/v1/allFood", async (req, res) => {
      const pageNumber = Number(req.query.pageNum);
      const limit = Number(req.query.limit);
      const skip = pageNumber * limit;
      // console.log(pageNumber);

      const result = await allFoodCollection
        .find()
        .skip(skip)
        .limit(limit)
        .toArray();
      res.send(result);
    });

    app.get("/api/v1/addedFood",middleman, async (req, res) => {
      const email = req.query?.email;
      console.log(email,req.user.email);
      if(email !== req.user.email){
        return res.send({message:'unauthirised'})
      }
      let query = {};
      if (email) {
        query = { madeBy: email };
      }
      console.log(query);
      const result = await allFoodCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/api/v1/allfood/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await allFoodCollection.findOne(filter);
      res.send(result);
    });

    app.get("/api/v1/foodcount", async (req, res) => {
      const result = await allFoodCollection.estimatedDocumentCount();
      res.send({ result });
      // console.log(result);
    });

    app.get("/api/v1/foodSix", async (req, res) => {
      const result = await allFoodCollection
        .find()
        .sort({ count: "desc" })
        .limit(6)
        .toArray();
      res.send(result);
    });

    app.post("/api/v1/cart", async (req, res) => {
      const product = req.body;
      const result = await orderFoodCollection.insertOne(product);
      res.send(result);
    });

    app.get("/api/v1/cart",middleman, async (req, res) => {
      const email = req.query?.email;
      if(email !== req.user.email){
        return res.send({message:'unauthirised'})
      }
      let query = {};
      if (email) {
        query = { email: email };
      }
      console.log(query);
      const result = await orderFoodCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/api/v1/cart/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const find = { _id: id };
      const result = await orderFoodCollection.deleteOne(find);
      res.send(result);
    });

    app.delete("/api/v1/addedFood/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const find = { _id : new ObjectId(id) };
      const result = await allFoodCollection.deleteOne(find);
      res.send(result);
    });

    app.post('/api/v1/user', async (req,res)=>{
      const user = req.body;
      // console.log(user);
      const result = await userCollection.insertOne(user);
      res.send(result);
    })

    app.put('/api/v1/addedFood/:id', async (req,res)=>{
      const id = req.params.id;
      console.log(id);
      const formValue = req.body;
      const filter = {_id: new ObjectId(id)}
      const options = { upsert: true };
      const update = {
        $set: {
          img:formValue.img,
          name:formValue.name,
          category:formValue.category,
          madeBy:formValue.madeBy,
          price:formValue.price,
          quantity:formValue.quantity,
          description:formValue.description,
          origin:formValue.origin,
        },
      };
      const result = await allFoodCollection.updateOne(filter,update,options)
      console.log(result);
      res.send(result)
    })

    console.log("successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send(`Royal Food is Running ${port}`);
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
