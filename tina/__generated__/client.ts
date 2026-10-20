import { createClient } from "tinacms/dist/client";
import { queries } from "./types.js";
export const client = createClient({ url: "http://localhost:4001/graphql", token: "dd57c0c528af1e91e208f16bb3e36687fe014e58", queries,  });
export default client;
  