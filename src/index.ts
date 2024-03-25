// cannister code goes here
import { StableBTreeMap, Vec, Result, Server, nat64, ic } from "azle";
import { v4 as uuidv4 } from "uuid";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

class User {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date | null;
  // constructor(username: string, email: string) {
  //   if (!User.isUnique(email)) {
  //     throw new Error('Email must be unique.');
  //   }

  //   if (!User.isUnique(username)) {
  //     throw new Error('Username must be unique.');
  // }
}
class Product {
  id: string;
  seller: string;
  name: string;
  description: string;
  image: string;
  price: number;
  stock: number;
  isSold: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

const userStorage = StableBTreeMap<string, User>(0);
const productStorage = StableBTreeMap<string, Product>(0);

export default Server(() => {
  const app = express();
  app.use(express.json());
  // create a new user
  app.post("/user/new", async (req, res) => {
    const { email, password, username } = req.body;
    const userOpt = userStorage.get(email);

    if (userOpt)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user: User = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      createdAt: getCurrentDate(),
      updatedAt: null,
    };
    const token = jwt.sign({ email: user.email, id: user.id }, "JkjKJkjKJ", {
      expiresIn: "1h",
    });

    userStorage.insert(user.id, user);
    res.status(201).json({ username, email, token });
  });
  //login existing user
  app.post("/user/login", async (req, res) => {
    const { email, password } = req.body;
    const user: User = {
      ...req.body,
    };
    const userOpt = userStorage.get(email);
    console.log("UserOpt: ", userOpt);
    if ("None" in userOpt) {
      res.status(404).send(`User with email=${email} not found.`);

      const isPasswordCorrect = await bcrypt.compare(password, password); //userOpt(password);

      if (!isPasswordCorrect)
        return res.status(400).json({ message: "Invalid credentials" });
    } else {
      res.json(user);
    }
  });
  // get all products
  app.get("/products", (req, res) => {
    res.json(productStorage.values());
  });
  // create a new product
  app.post("/product/new", (req, res) => {
    const product: Product = {
      id: uuidv4(),
      createdAt: getCurrentDate(),
      seller: ic.caller(),
      ...req.body,
    };
    productStorage.insert(product.id, product);
    res.json(product);
  });
  // update a product
  app.put("/product/:id/update", (req, res) => {
    const productId = req.params.id;
    const productOpt = productStorage.get(productId);
    if ("None" in productOpt) {
      res.status(404).send(`Product with id=${productId} not found.`);
    } else {
      const product = productOpt.Some;
      const updatedProduct = {
        ...product,
        isRead: product.isSold ? false : true,
        updatedAt: getCurrentDate(),
      };
      productStorage.insert(product.id, updatedProduct);

      res.json(updatedProduct);
    }
    //   Function to delete a Book
    app.delete("/product/:id", (req, res) => {
      const productId = req.params.id;
      const deleteProduct = productStorage.remove(productId);
      if ("None" in productOpt) {
        res.status(404).send(`Product with id=${productId} not found.`);
      } else {
        res.json({ msg: "Product with id=${productId} deleted" });
      }
    });
  });
  return app.listen();
});
function getCurrentDate() {
  const timestamp = new Number(ic.time());
  return new Date(timestamp.valueOf() / 1000_000);
}
