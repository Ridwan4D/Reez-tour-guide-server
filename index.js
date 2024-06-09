const express = require('express')
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_pass}@cluster0.yyjvuyt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // await client.connect();
    const packageCollection = client.db("guideForTourist").collection("packages");
    const userCollection = client.db("guideForTourist").collection("users");
    const wishCollection = client.db("guideForTourist").collection("wishlist");

    // ========================================   user collection start    ========================================
    app.get('/users', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { userEmail: user.userEmail }
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exist", insertedId: null })
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    })

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const userInfo = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: userInfo.role
        }
      };
      const result = await userCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })
    // ========================================   user collection end    ========================================

    // ========================================   wishlist collection start    ========================================
    app.get("/wishlist", async (req, res) => {
      const email = req.query.email;
      const query = { email: email }
      const result = await wishCollection.find(query).toArray();
      res.send(result)
    })

    app.post('/wishlist', async (req, res) => {
      const wishItem = req.body;
      const result = await wishCollection.insertOne(wishItem);
      res.send(result);
    })

    app.delete("/wishlist/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await wishCollection.deleteOne(query);
      res.send(result);
    })
    // ========================================   wishlist collection end    ========================================

    // ========================================   packages collection start    ========================================
    app.get('/packages', async (req, res) => {
      const result = await packageCollection.find().toArray();
      res.send(result);
    })
    // ========================================   packages collection end    ========================================



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
  res.send("Tour guid for tourist server is running")
})

app.listen(port, () => {
  console.log(`Tour guid server is running on: ${port}`);
})