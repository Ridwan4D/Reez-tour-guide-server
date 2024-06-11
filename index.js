const express = require('express')
const cors = require('cors');
var jwt = require('jsonwebtoken');
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
    const bookingCollection = client.db("guideForTourist").collection("bookings");
    const storyCollection = client.db("guideForTourist").collection("stories");

    // ========================================   jwt api start    ========================================
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ token })
    })

    // ========================================   jwt api end    ========================================
    // ========================================   middle wares start    ========================================
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" })
      }
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" })
        }
        req.decoded = decoded;
        next()
      })
    }

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { userEmail: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" })
      }
      next();
    }
    // ========================================   middle wares end    ========================================
    // ========================================   user collection start    ========================================
    app.get('/users', verifyToken, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })

    app.get("/guides", async (req, res) => {
      const role = req.query.role;
      const query = { role: role }
      const result = await userCollection.find(query).toArray();
      res.send(result)
    })

    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" })
      }
      const query = { userEmail: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin'
      }
      res.send({ admin })
    })

    app.get('/users/guide/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" })
      }
      const query = { userEmail: email };
      const user = await userCollection.findOne(query);
      let guide = false;
      if (user) {
        guide = user?.role === 'guide'
      }
      res.send({ guide })
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

    app.patch("/users/admin/:id", verifyToken, async (req, res) => {
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
    // ========================================   story collection start    ========================================
    app.get("/stories", async (req, res) => {
      const email = req.query.email;
      const query = { email: email }
      const result = await storyCollection.find(query).toArray();
      res.send(result)
    })
    app.post('/stories',async(req,res)=>{
      const storyItem = req.body;
      const result = await storyCollection.insertOne(storyItem);
      res.send(result);
    })
    // ========================================   story collection end    ========================================
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
    // ========================================   bookings collection start    ========================================
    app.post('/bookings', async (req, res) => {
      const bookingItem = req.body;
      const result = await bookingCollection.insertOne(bookingItem);
      res.send(result);
    })
    app.get("/bookings", async (req, res) => {
      const email = req.query.email;
      const query = { userEmail: email }
      const result = await bookingCollection.find(query).toArray();
      res.send(result)
    })
    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    })
    // ========================================   bookings collection end    ========================================
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