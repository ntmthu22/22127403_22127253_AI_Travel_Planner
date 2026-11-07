import { createApp } from "./app.js";
import { Store } from "./store.js";

const store = new Store();
const port = Number(process.env.PORT ?? 3000);
createApp(store).listen(port, () => console.log(`listening on ${port}`));
