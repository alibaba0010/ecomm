// cannister code goes here
import { StableBTreeMap, Vec, Result, Server, nat64, ic } from "azle";
import { v4 as uuidv4 } from "uuid";
import express from "express";

class Product {
  id: string;
  seller: string;
  name: string;
  description: string;
  image: string;
  price: nat64;
  stock: number;
  createdAt: Date;
  updatedAt: Date | null;
}

const productStorage = StableBTreeMap<string, Product>(0);

export default Server(() => {
  const app = express();
  app.use(express.json());
  app.get("/products", (req, res) => {
    res.json(productStorage.values());
  });
  return app.listen();
});
