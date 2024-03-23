// cannister code goes here
import {
  $query,
  $update,
  Record,
  StableBTreeMap,
  Vec,
  match,
  Result,
  nat64,
  ic,
  Opt,
  Principal,
  nat,
} from "azle";
import { v4 as uuidv4 } from "uuid";

type Product = Record<{
  id: string;
  seller: Principal;
  name: string;
  description: string;
  image: string;
  price: nat64;
  stock: nat;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

type ProductPayload = Record<{
  name: string;
  description: string;
  image: string;
  price: nat64;
  stock: nat;
}>;

const productStorage = new StableBTreeMap<string, Product>(0, 44, 1024);

$query;
export function getProducts(): Result<Vec<Product>, string> {
  return Result.Ok(productStorage.values());
}

$query;
export function getProduct(id: string): Result<Product, string> {
  return match(productStorage.get(id), {
    Some: (product) => Result.Ok<Product, string>(product),
    None: () =>
      Result.Err<Product, string>(`a product with id=${id} not found`),
  });
}
// Add product
$update;
export function addProduct(payload: ProductPayload): Result<Product, string> {
  const product: Product = {
    id: uuidv4(),
    createdAt: ic.time(),
    updatedAt: Opt.None,
    seller: ic.caller(),
    ...payload,
  };
  productStorage.insert(product.id, product);
  return Result.Ok(product);
}

$update;
export function updateProduct(
  id: string,
  payload: ProductPayload
): Result<Product, string> {
  return match(productStorage.get(id), {
    Some: (product) => {
      if (product.seller.toString() != ic.caller().toString()) {
        return Result.Err<Product, string>(
          `only a product seller can update a product`
        );
      }
      const updateProduct: Product = {
        ...product,
        ...payload,
        updatedAt: Opt.Some(ic.time()),
      };
      productStorage.insert(id, updateProduct);
      return Result.Ok<Product, string>(updateProduct);
    },
    None: () => Result.Err<Product, string>(`Product with id=${id} not found`),
  });
}

$update;
export function deleteProduct(id: string): Result<Product, string> {
  return match(productStorage.remove(id), {
    Some: (deleteProduct) => {
      if (deleteProduct.seller.toString() != ic.caller().toString()) {
        return Result.Err<Product, string>(
          `only a product seller can update a product`
        );
      }
      return Result.Ok<Product, string>(deleteProduct);
    },
    None: () => Result.Err<Product, string>(`Product with id=${id} not found.`),
  });
}

// a workaround to make uuid package work with Azle
globalThis.crypto = {
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};
